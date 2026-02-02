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
        @contextmenu.prevent="onContextMenu"
        @dblclick="onDoubleClick"
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
import type { WaferMapProps, WaferMapEmits, DieInfo } from './types'
import { DEFAULT_RENDER_CONFIG, CANVAS_CONFIG } from './constants'
import { useCanvasLayers } from './hooks/useCanvasLayers'
import { useWaferRenderer } from './hooks/useWaferRenderer'
import { useDefectLayer } from './hooks/useDefectLayer'
import { useInteraction } from './hooks/useInteraction'
import { usePerformance } from './hooks/usePerformance'
import { useWaferZoom } from './hooks/useWaferZoom'
import { optimizeLabelLayout, initializeLabelPosition } from './utils/labelLayout'
import { isPointInPolygon, isRectIntersectPolygon } from './utils/polygonUtils'

// Props & Emits
const props = withDefaults(defineProps<WaferMapProps>(), {
  defects: () => [],
  showDebugInfo: false,
  showStats: false,
  interactionMode: 'select'
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
  clearLayer
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
  drawSelectionBox
  // getDieAtPosition,
  // getDiesInSelection,
  // reset
} = useInteraction()

// 滚轮缩放功能
const waferZoom = useWaferZoom({
  minZoom: 0.5,
  maxZoom: 5,
  zoomSpeed: 0.001,
  smoothZoom: true,
  zoomStep: 0.2
})

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

// 多边形框选状态
const polygonPoints = ref<Array<{ x: number; y: number }>>([])
const isPolygonComplete = ref(false)

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

    // 注册图层到缩放 hook
    const bgLayer = getLayer('background')
    const defLayer = getLayer('defects')
    const intLayer = getLayer('interaction')

    if (bgLayer) waferZoom.registerLayer('background', bgLayer.ctx)
    if (defLayer) waferZoom.registerLayer('defects', defLayer.ctx)
    if (intLayer) waferZoom.registerLayer('interaction', intLayer.ctx)

    // 应用当前的缩放变换（如果有的话）
    waferZoom.applyTransformToAllLayers()

    // 渲染背景层（晶圆、Die、Reticle）
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
  // 注意：clearRect 由外部 clearLayer 处理（使用 save/restore）

  // 绘制选择框
  drawSelectionBox(ctx)

  // 绘制多边形框选（在屏幕坐标系下绘制，不受缩放影响）
  if (props.interactionMode === 'polygon') {
    ctx.save()
    // 重置变换，使用屏幕坐标系
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // 显示操作提示
    if (polygonPoints.value.length === 0) {
      ctx.fillStyle = '#409EFF'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.fillText('点击添加多边形顶点，右键或双击完成', canvas.width / 2, 40)
      ctx.shadowBlur = 0
    }

    if (polygonPoints.value.length > 0) {
      // 绘制线段的阴影（让线条更明显）
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // 绘制已有的线段
      ctx.strokeStyle = '#409EFF'
      ctx.lineWidth = 5
      ctx.setLineDash([10, 6])
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(polygonPoints.value[0].x, polygonPoints.value[0].y)
      for (let i = 1; i < polygonPoints.value.length; i++) {
        ctx.lineTo(polygonPoints.value[i].x, polygonPoints.value[i].y)
      }
      ctx.stroke()

      // 重置阴影
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // 绘制顶点
      polygonPoints.value.forEach((point, index) => {
        // 绘制外圈光晕
        ctx.beginPath()
        ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
        ctx.fillStyle = index === 0 ? 'rgba(103, 194, 58, 0.3)' : 'rgba(64, 158, 255, 0.3)'
        ctx.fill()

        // 绘制中圈
        ctx.beginPath()
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2)
        ctx.fillStyle = index === 0 ? '#67C23A' : '#409EFF'
        ctx.fill()

        // 绘制白色边框
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.stroke()

        // 绘制内圈高光
        ctx.beginPath()
        ctx.arc(point.x - 2, point.y - 2, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fill()
      })

      // 显示点数提示（左上角，更大更明显）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(8, 8, 200, 70)

      // 添加边框
      ctx.strokeStyle = '#409EFF'
      ctx.lineWidth = 2
      ctx.strokeRect(8, 8, 200, 70)

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`已添加 ${polygonPoints.value.length} 个点`, 20, 35)

      if (polygonPoints.value.length >= 3) {
        ctx.fillStyle = '#67C23A'
        ctx.font = 'bold 14px Arial'
        ctx.fillText('✓ 右键或双击完成', 20, 60)
      } else {
        ctx.fillStyle = '#E6A23C'
        ctx.font = 'bold 14px Arial'
        ctx.fillText(`⚠ 还需 ${3 - polygonPoints.value.length} 个点`, 20, 60)
      }

      // 如果多边形已完成，绘制闭合线和填充
      if (isPolygonComplete.value && polygonPoints.value.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(polygonPoints.value[0].x, polygonPoints.value[0].y)
        for (let i = 1; i < polygonPoints.value.length; i++) {
          ctx.lineTo(polygonPoints.value[i].x, polygonPoints.value[i].y)
        }
        ctx.closePath()

        // 填充
        ctx.fillStyle = 'rgba(64, 158, 255, 0.3)'
        ctx.fill()

        // 边框（实线，更粗）
        ctx.setLineDash([])
        ctx.strokeStyle = '#409EFF'
        ctx.lineWidth = 5
        ctx.stroke()
      }
    }

    ctx.restore()
  }

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
    // 点击在信息框上，开始拖拽信息框
    event.stopPropagation()
    draggingIndex.value = clickedLabelIndex
    const defect = selectedDefects.value[clickedLabelIndex]
    dragOffset.value = {
      x: mouseX - defect.labelX,
      y: mouseY - defect.labelY
    }
    return
  }

  // 根据交互模式处理
  if (props.interactionMode === 'pan') {
    // 拖拽模式：左键拖拽画布
    if (event.button === 0) {
      event.preventDefault()
      waferZoom.startDrag(event.clientX, event.clientY)
      interactionCanvas.value.style.cursor = 'grabbing'
    }
  } else if (props.interactionMode === 'polygon') {
    // 多边形框选模式：左键添加点，右键或双击完成
    if (event.button === 0) {
      polygonPoints.value.push({ x: mouseX, y: mouseY })
      clearLayer('interaction')
      renderInteractionLayer()
    }
  } else {
    // 矩形框选模式：执行原有的框选逻辑
    handleMouseDown(
      event,
      interactionCanvas.value,
      waferZoom.scale.value,
      waferZoom.translateX.value,
      waferZoom.translateY.value
    )
  }
}

const onMouseMove = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

  // 如果正在拖拽画布
  if (waferZoom.isDragging.value) {
    waferZoom.onDrag(event.clientX, event.clientY, () => {
      // 拖拽时重新绘制所有图层
      nextTick(() => {
        clearLayer('background')
        const bgLayer = getLayer('background')
        if (bgLayer) {
          renderBackground(bgLayer, canvasSize.value)
        }
        clearLayer('defects')
        renderDefectsLayer(canvasSize.value)
        clearLayer('interaction')
        renderInteractionLayer()
      })
    })
    return
  }

  const rect = interactionCanvas.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 如果正在拖拽信息框
  if (draggingIndex.value !== null) {
    const defect = selectedDefects.value[draggingIndex.value]
    if (defect) {
      defect.labelX = mouseX - dragOffset.value.x
      defect.labelY = mouseY - dragOffset.value.y

      // 清空并重绘交互层（包括连线）
      clearLayer('interaction')
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
    // 根据交互模式显示不同光标
    if (props.interactionMode === 'pan') {
      interactionCanvas.value.style.cursor = 'grab'
    } else {
      interactionCanvas.value.style.cursor = 'crosshair'
    }

    // 执行原有的 hover 逻辑（显示 tooltip 等）
    handleMouseMove(
      event,
      interactionCanvas.value,
      validDiePositions.value,
      drawParams.value.scale * props.waferConfig.dieWidth,
      drawParams.value.scale * props.waferConfig.dieHeight,
      props.defects,
      renderConfig.value.enableTooltip,
      waferZoom.scale.value,
      waferZoom.translateX.value,
      waferZoom.translateY.value
    )
  }

  // 重绘交互层
  clearLayer('interaction')
  renderInteractionLayer()
}

const onMouseUp = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

  // 如果正在拖拽画布，结束拖拽
  if (waferZoom.isDragging.value) {
    waferZoom.endDrag()
    // 根据交互模式恢复光标
    interactionCanvas.value.style.cursor = props.interactionMode === 'pan' ? 'grab' : 'crosshair'
    return
  }

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
  clearLayer('interaction')
  renderInteractionLayer()
}

/**
 * 完成多边形框选
 */
const completePolygon = () => {
  if (polygonPoints.value.length < 3) {
    polygonPoints.value = []
    clearLayer('interaction')
    renderInteractionLayer()
    return
  }

  isPolygonComplete.value = true
  clearLayer('interaction')
  renderInteractionLayer()

  // 获取多边形内的 Die
  const diesInPolygon = getDiesInPolygon()
  if (diesInPolygon.length > 0) {
    emit('selection', diesInPolygon)
    getDefectsInSelection(diesInPolygon)
    showOnlySelected.value = true

    // 重新渲染缺陷层
    canvasSize.value = Math.min(
      containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
      CANVAS_CONFIG.MAX_SIZE
    )
    renderDefectsLayer(canvasSize.value)
  }

  // 清空多边形
  setTimeout(() => {
    polygonPoints.value = []
    isPolygonComplete.value = false
    clearLayer('interaction')
    renderInteractionLayer()
  }, 500)
}

/**
 * 获取多边形内的 Die
 */
const getDiesInPolygon = (): DieInfo[] => {
  const dies: DieInfo[] = []

  validDiePositions.value.forEach(die => {
    const dieWidth = drawParams.value.scale * props.waferConfig.dieWidth
    const dieHeight = drawParams.value.scale * props.waferConfig.dieHeight

    // 检查 Die 的中心点或矩形是否在多边形内
    const dieCenter = {
      x: die.canvasX + dieWidth / 2,
      y: die.canvasY + dieHeight / 2
    }

    const dieRect = {
      x: die.canvasX,
      y: die.canvasY,
      width: dieWidth,
      height: dieHeight
    }

    if (
      isPointInPolygon(dieCenter, polygonPoints.value) ||
      isRectIntersectPolygon(dieRect, polygonPoints.value)
    ) {
      dies.push({
        row: die.row,
        col: die.col,
        x: die.physicalX,
        y: die.physicalY
      })
    }
  })

  return dies
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
  // 结束画布拖拽
  if (waferZoom.isDragging.value) {
    waferZoom.endDrag()
  }
  handleMouseLeave()
  clearLayer('interaction')
  renderInteractionLayer()
}

const onClick = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

  // 多边形模式下不处理 click 事件（在 mousedown 中处理）
  if (props.interactionMode === 'polygon') {
    return
  }

  const result = handleClick(
    event,
    interactionCanvas.value,
    validDiePositions.value,
    drawParams.value.scale * props.waferConfig.dieWidth,
    drawParams.value.scale * props.waferConfig.dieHeight,
    props.defects,
    waferZoom.scale.value,
    waferZoom.translateX.value,
    waferZoom.translateY.value
  )

  if (result?.type === 'click') {
    emit('die-click', result.die)
  }
}

/**
 * 右键点击完成多边形
 */
const onContextMenu = (event: MouseEvent) => {
  if (props.interactionMode === 'polygon' && polygonPoints.value.length >= 3) {
    event.preventDefault()
    completePolygon()
  }
}

/**
 * 双击完成多边形
 */
const onDoubleClick = (event: MouseEvent) => {
  if (props.interactionMode === 'polygon' && polygonPoints.value.length >= 3) {
    event.preventDefault()
    completePolygon()
  }
}

const onWheel = (event: WheelEvent) => {
  if (!renderConfig.value.enableZoom || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()

  // 使用 waferZoom 处理滚轮事件，所有图层会同步缩放
  waferZoom.handleWheel(event, rect, () => {
    // 缩放变化后的回调
    emit('zoom', waferZoom.scale.value)

    // 重新渲染所有图层（包括背景层）
    // 注意：applyTransformToAllLayers 已经在 handleWheel 内部调用了
    nextTick(() => {
      // 清空并重新绘制背景层（clearLayer 会保持变换）
      clearLayer('background')
      const bgLayer = getLayer('background')
      if (bgLayer) {
        renderBackground(bgLayer, canvasSize.value)
      }

      // 重新绘制缺陷层和交互层
      clearLayer('defects')
      renderDefectsLayer(canvasSize.value)

      clearLayer('interaction')
      renderInteractionLayer()
    })
  })
}

// ==================== 生命周期 ====================

/**
 * 键盘事件处理
 */
const handleKeyDown = (event: KeyboardEvent) => {
  // Escape 键取消多边形
  if (event.key === 'Escape' && props.interactionMode === 'polygon') {
    polygonPoints.value = []
    isPolygonComplete.value = false
    clearLayer('interaction')
    renderInteractionLayer()
  }
}

onMounted(() => {
  nextTick(() => {
    render()
  })

  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
})

// 清理资源
onUnmounted(() => {
  waferZoom.cleanup()
  window.removeEventListener('keydown', handleKeyDown)
})

// 监听交互模式变化，切换模式时清空多边形
watch(
  () => props.interactionMode,
  (newMode, oldMode) => {
    if (oldMode === 'polygon' && newMode !== 'polygon') {
      polygonPoints.value = []
      isPolygonComplete.value = false
      clearLayer('interaction')
      renderInteractionLayer()
    }
  }
)

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

// 清理资源
onUnmounted(() => {
  waferZoom.cleanup()
})

// 暴露方法
defineExpose({
  render,
  clearLayer,
  clearSelection,
  getStats: () => stats.value,
  // 缩放相关方法
  zoomIn: () => {
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    waferZoom.zoomIn(rect.width / 2, rect.height / 2, () => {
      nextTick(() => {
        // 清空并重新绘制所有图层
        clearLayer('background')
        const bgLayer = getLayer('background')
        if (bgLayer) {
          renderBackground(bgLayer, canvasSize.value)
        }
        clearLayer('defects')
        renderDefectsLayer(canvasSize.value)
        clearLayer('interaction')
        renderInteractionLayer()
      })
    })
  },
  zoomOut: () => {
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    waferZoom.zoomOut(rect.width / 2, rect.height / 2, () => {
      nextTick(() => {
        // 清空并重新绘制所有图层
        clearLayer('background')
        const bgLayer = getLayer('background')
        if (bgLayer) {
          renderBackground(bgLayer, canvasSize.value)
        }
        clearLayer('defects')
        renderDefectsLayer(canvasSize.value)
        clearLayer('interaction')
        renderInteractionLayer()
      })
    })
  },
  resetZoom: () => {
    waferZoom.resetZoom(() => {
      nextTick(() => {
        // 清空并重新绘制所有图层
        clearLayer('background')
        const bgLayer = getLayer('background')
        if (bgLayer) {
          renderBackground(bgLayer, canvasSize.value)
        }
        clearLayer('defects')
        renderDefectsLayer(canvasSize.value)
        clearLayer('interaction')
        renderInteractionLayer()
      })
    })
  },
  getZoomState: () => ({
    scale: waferZoom.scale.value,
    translateX: waferZoom.translateX.value,
    translateY: waferZoom.translateY.value,
    percentage: waferZoom.zoomPercentage.value
  })
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
