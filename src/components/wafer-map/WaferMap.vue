<!--
  Wafer Map 组件
  高性能晶圆图可视化组件，支持大数据量渲染
-->
<template>
  <div class="wafer-map" ref="containerRef" :style="containerStyle">
    <!-- 多图层 Canvas -->
    <div class="canvas-stack">
      <canvas ref="backgroundCanvas" class="canvas-layer"></canvas>
      <canvas ref="defectsCanvas" class="canvas-layer"></canvas>
      <canvas
        ref="interactionCanvas"
        class="canvas-layer canvas-interactive"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @click="onClick"
        @wheel="onWheel"
        @contextmenu.prevent
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { WaferMapProps, WaferMapEmits, DieInfo } from './types'
import { DEFAULT_RENDER_CONFIG, CANVAS_CONFIG } from './constants'
import { useCanvasLayers } from './hooks/useCanvasLayers'
import { useWaferRenderer } from './hooks/useWaferRenderer'
import { useDefectLayer } from './hooks/useDefectLayer'
import { useInteraction } from './hooks/useInteraction'
import { usePerformance } from './hooks/usePerformance'
import { optimizeLabelLayout, initializeLabelPosition } from './utils/labelLayout'

// Props & Emits
const props = withDefaults(defineProps<WaferMapProps>(), {
  defects: () => [],
  showDebugInfo: false,
  showStats: false
})

const emit = defineEmits<WaferMapEmits>()

// 合并配置
const renderConfig = computed(() => ({
  ...DEFAULT_RENDER_CONFIG,
  ...props.renderConfig
}))

// Refs
const containerRef = ref<HTMLDivElement>()
const canvasSize = ref(CANVAS_CONFIG.DEFAULT_SIZE)

// Hooks
const {
  backgroundCanvas,
  defectsCanvas,
  interactionCanvas,
  initializeLayers,
  getLayer,
  clearLayer,
  resetAllTransforms
} = useCanvasLayers()

const { validDiePositions, drawParams, renderBackground } = useWaferRenderer(props.waferConfig)

const { defectStats, renderDefects } = useDefectLayer()

const {
  zoom,
  // isSelecting,
  // selectionStart,
  // selectionEnd,
  // selectionRect,
  // tooltip,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseLeave,
  handleClick,
  handleWheel,
  drawSelectionBox
  // getDieAtPosition,
  // getDiesInSelection,
  // reset
} = useInteraction()

// 选中的坏点状态
const selectedDefects = ref<
  Array<{
    x: number
    y: number
    type: string
    dieRow: number
    dieCol: number
    relX: number
    relY: number
    labelX: number // 信息框 X 坐标
    labelY: number // 信息框 Y 坐标
    labelHeight: number // 信息框高度
  }>
>([])

// 是否只显示选中的坏点
const showOnlySelected = ref(false)

// 拖拽状态
const draggingIndex = ref<number | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
const hoveredLabelIndex = ref<number | null>(null)

const {
  stats,
  recordFrameTime,
  calculateViewport,
  calculateLODLevel,
  updateDefectStats,
  updateLODLevel
} = usePerformance()

// 容器样式
const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

// ==================== 核心渲染方法 ====================

/**
 * 主渲染函数
 */
const render = async () => {
  const startTime = performance.now()

  try {
    const containerWidth = containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE
    canvasSize.value = Math.min(containerWidth, CANVAS_CONFIG.MAX_SIZE)

    // 初始化图层
    initializeLayers(canvasSize.value, canvasSize.value)
    resetAllTransforms()

    // 渲染背景层（晶圆、Die、Reticle）
    const bgLayer = getLayer('background')
    if (bgLayer) {
      renderBackground(bgLayer, canvasSize.value)
    }

    // 渲染缺陷层
    if (renderConfig.value.showDefects && props.defects.length > 0) {
      await renderDefectsLayer(canvasSize.value)
    } else {
      clearLayer('defects')
    }

    // 渲染交互层（选择框等）
    renderInteractionLayer()

    // 记录性能
    const renderTime = performance.now() - startTime
    recordFrameTime(renderTime)

    // 触发就绪事件
    emit('ready')
  } catch (error) {
    console.error('Render failed:', error)
    emit('error', error as Error)
  }
}

/**
 * 渲染缺陷层
 */
const renderDefectsLayer = async (size: number) => {
  const defectsLayer = getLayer('defects')
  if (!defectsLayer) return

  // 计算视口（初始状态下覆盖整个画布）
  const viewport = calculateViewport(size, size, zoom.value, size / 2, size / 2)

  // 计算 LOD 级别
  const lodLevel = calculateLODLevel(zoom.value, props.defects.length)
  updateLODLevel(lodLevel)

  // 渲染缺陷（如果启用了只显示选中模式，则只渲染选中的坏点）
  const defectsToRender = showOnlySelected.value
    ? props.defects.filter(d =>
        selectedDefects.value.some(sd => sd.dieRow === d.dieRow && sd.dieCol === d.dieCol)
      )
    : props.defects

  renderDefects(
    defectsLayer,
    defectsToRender,
    validDiePositions.value,
    viewport,
    drawParams.value.scale,
    drawParams.value.scale * props.waferConfig.dieWidth,
    drawParams.value.scale * props.waferConfig.dieHeight,
    renderConfig.value.enableViewportCulling,
    renderConfig.value.enableDataDecimation
  )

  // 更新统计
  updateDefectStats(defectStats.value.rendered, defectStats.value.total)
}

/**
 * 检测鼠标是否在某个信息框上
 */
const getLabelIndexAtPosition = (mouseX: number, mouseY: number): number => {
  for (let i = selectedDefects.value.length - 1; i >= 0; i--) {
    const defect = selectedDefects.value[i]
    if (
      mouseX >= defect.labelX &&
      mouseX <= defect.labelX + LABEL_WIDTH &&
      mouseY >= defect.labelY &&
      mouseY <= defect.labelY + LABEL_HEIGHT
    ) {
      return i
    }
  }
  return -1
}

/**
 * 渲染交互层
 */
const renderInteractionLayer = () => {
  const interactionLayer = getLayer('interaction')
  if (!interactionLayer) return

  const { canvas, ctx } = interactionLayer
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制选择框
  drawSelectionBox(ctx)

  // 绘制连线和信息框
  if (selectedDefects.value.length > 0) {
    const lineHeight = 14
    const padding = 8
    const labelHalfHeight = LABEL_HEIGHT / 2

    ctx.save()

    // 设置文本样式（只设置一次）
    ctx.font = '10px "Courier New", monospace'
    ctx.textBaseline = 'top'

    selectedDefects.value.forEach((defect, index) => {
      const { x: x1, y: y1, labelX: x2, labelY: y2 } = defect

      // 更新 labelHeight 用于后续计算
      defect.labelHeight = LABEL_HEIGHT

      // 绘制连线（从坏点到信息框左边缘中心）
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2 + labelHalfHeight)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.stroke()

      // 绘制信息框背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x2, y2, LABEL_WIDTH, LABEL_HEIGHT)

      // 绘制信息框边框
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.strokeRect(x2, y2, LABEL_WIDTH, LABEL_HEIGHT)

      // 绘制文本
      ctx.fillStyle = '#000000'

      const texts = [
        `logics = ${defect.dieRow * 100 + defect.dieCol}`,
        `begin = ${(defect.relX * 1000).toFixed(1)}`,
        `defectId = ${index + 1}`,
        `manualBinDefectType = defect_${defect.type}`,
        `inspectedDefectTypeId = ${Math.floor(defect.relY * 100)}`
      ]

      const textX = x2 + padding
      let textY = y2 + padding

      for (let i = 0; i < texts.length; i++) {
        ctx.fillText(texts[i], textX, textY)
        textY += lineHeight
      }
    })
    ctx.restore()
  }
}

// ==================== 事件处理 ====================

const onMouseDown = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

  // 获取鼠标在 Canvas 上的坐标
  const rect = interactionCanvas.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 优先检查是否点击在信息框上
  const clickedLabelIndex = getLabelIndexAtPosition(mouseX, mouseY)

  if (clickedLabelIndex !== -1) {
    // 点击在信息框上，开始拖拽
    event.stopPropagation()
    draggingIndex.value = clickedLabelIndex
    const defect = selectedDefects.value[clickedLabelIndex]
    dragOffset.value = {
      x: mouseX - defect.labelX,
      y: mouseY - defect.labelY
    }
  } else {
    // 点击在其他地方，执行原有的框选逻辑
    handleMouseDown(event, interactionCanvas.value)
  }
}

const onMouseMove = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

  const rect = interactionCanvas.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 如果正在拖拽信息框
  if (draggingIndex.value !== null) {
    const defect = selectedDefects.value[draggingIndex.value]
    if (defect) {
      defect.labelX = mouseX - dragOffset.value.x
      defect.labelY = mouseY - dragOffset.value.y

      // 重绘交互层（包括连线）
      renderInteractionLayer()
    }
    return
  }

  // 检测鼠标是否在信息框上，改变光标样式
  const labelIndex = getLabelIndexAtPosition(mouseX, mouseY)
  hoveredLabelIndex.value = labelIndex

  if (labelIndex !== -1) {
    // 鼠标在信息框上，显示移动光标
    interactionCanvas.value.style.cursor = 'move'
  } else {
    // 鼠标不在信息框上，恢复默认光标
    interactionCanvas.value.style.cursor = 'crosshair'

    // 执行原有的 hover 逻辑（显示 tooltip 等）
    handleMouseMove(
      event,
      interactionCanvas.value,
      validDiePositions.value,
      drawParams.value.scale * props.waferConfig.dieWidth,
      drawParams.value.scale * props.waferConfig.dieHeight,
      props.defects,
      renderConfig.value.enableTooltip
    )
  }

  // 重绘交互层
  renderInteractionLayer()
}

const onMouseUp = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

  // 如果正在拖拽信息框，结束拖拽
  if (draggingIndex.value !== null) {
    draggingIndex.value = null
    return
  }

  const result = handleMouseUp(
    event,
    interactionCanvas.value,
    validDiePositions.value,
    drawParams.value.scale * props.waferConfig.dieWidth,
    drawParams.value.scale * props.waferConfig.dieHeight,
    props.defects
  )

  if (result?.type === 'selection') {
    emit('selection', result.dies)

    // 获取选中区域内的坏点
    getDefectsInSelection(result.dies)

    // 启用只显示选中坏点模式
    showOnlySelected.value = true

    // 重新渲染缺陷层
    canvasSize.value = Math.min(
      containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
      CANVAS_CONFIG.MAX_SIZE
    )
    renderDefectsLayer(canvasSize.value)
  }

  // 重新渲染交互层（包括信息框）
  renderInteractionLayer()
}

// 布局配置常量
const LABEL_WIDTH = 250
const LABEL_HEIGHT = 80
const LABEL_LAYOUT_CONFIG = {
  labelWidth: LABEL_WIDTH,
  labelHeight: LABEL_HEIGHT,
  minDistance: -20, // 允许轻微重叠
  maxIterations: 15,
  overlapThreshold: 0.3, // 重叠面积阈值 30%
  pushDistance: 5,
  canvasSize: 0 // 运行时设置
}

/**
 * 获取选中区域内的坏点
 */
const getDefectsInSelection = (selectedDies: DieInfo[]) => {
  const selected: typeof selectedDefects.value = []

  // 创建选中 Die 的 Set 用于快速查找
  const selectedDieSet = new Set(selectedDies.map(die => `${die.row},${die.col}`))

  // 从所有缺陷中筛选出在选中 Die 上的缺陷
  props.defects.forEach(defect => {
    const dieKey = `${defect.dieRow},${defect.dieCol}`

    if (selectedDieSet.has(dieKey)) {
      // 找到对应的 Die 位置
      const diePos = validDiePositions.value.find(
        d => d.row === defect.dieRow && d.col === defect.dieCol
      )

      if (diePos) {
        const x = diePos.canvasX + defect.x * drawParams.value.scale * props.waferConfig.dieWidth
        const y = diePos.canvasY + defect.y * drawParams.value.scale * props.waferConfig.dieHeight

        // 使用工具函数初始化信息框位置
        const { labelX, labelY } = initializeLabelPosition(
          x,
          y,
          LABEL_WIDTH,
          LABEL_HEIGHT,
          canvasSize.value
        )

        selected.push({
          x,
          y,
          type: defect.type,
          dieRow: defect.dieRow,
          dieCol: defect.dieCol,
          relX: defect.x,
          relY: defect.y,
          labelX,
          labelY,
          labelHeight: LABEL_HEIGHT
        })
      }
    }
  })

  // 应用智能布局算法
  if (selected.length > 1) {
    LABEL_LAYOUT_CONFIG.canvasSize = canvasSize.value
    optimizeLabelLayout(selected, LABEL_LAYOUT_CONFIG)
  }

  selectedDefects.value = selected
}

const onMouseLeave = () => {
  handleMouseLeave()
  renderInteractionLayer()
}

const onClick = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

  const result = handleClick(
    event,
    interactionCanvas.value,
    validDiePositions.value,
    drawParams.value.scale * props.waferConfig.dieWidth,
    drawParams.value.scale * props.waferConfig.dieHeight,
    props.defects
  )

  if (result?.type === 'click') {
    emit('die-click', result.die)
  }
}

const onWheel = (event: WheelEvent) => {
  const newZoom = handleWheel(event, renderConfig.value.enableZoom)
  if (newZoom !== undefined) {
    emit('zoom', newZoom)
    // 缩放后重新渲染缺陷层
    nextTick(() => {
      canvasSize.value = Math.min(
        containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
        CANVAS_CONFIG.MAX_SIZE
      )
      renderDefectsLayer(canvasSize.value)
    })
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  nextTick(() => {
    render()
  })
})

// 监听配置变化
watch(
  () => props.waferConfig,
  () => {
    render()
  },
  { deep: true }
)

watch(
  () => props.defects,
  () => {
    canvasSize.value = Math.min(
      containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
      CANVAS_CONFIG.MAX_SIZE
    )
    renderDefectsLayer(canvasSize.value)
  },
  { deep: true }
)

/**
 * 清除选择
 */
const clearSelection = () => {
  selectedDefects.value = []
  showOnlySelected.value = false

  // 重新渲染缺陷层
  canvasSize.value = Math.min(
    containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
    CANVAS_CONFIG.MAX_SIZE
  )
  renderDefectsLayer(canvasSize.value)
}

// 暴露方法
defineExpose({
  render,
  clearLayer,
  clearSelection,
  getStats: () => stats.value
})
</script>

<style scoped lang="scss">
.wafer-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.canvas-stack {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-layer {
  position: absolute;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.canvas-interactive {
  cursor: crosshair;
  z-index: 10;
}
</style>
