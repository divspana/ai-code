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

    <!-- Tooltip -->
    <div
      v-if="tooltip.visible && renderConfig.enableTooltip"
      class="wafer-tooltip"
      :style="{
        left: tooltip.x + 'px',
        top: tooltip.y + 'px'
      }"
    >
      <div class="tooltip-title">Die 信息</div>
      <div class="tooltip-item">
        <span class="label">位置:</span>
        <span class="value">Row {{ tooltip.dieInfo?.row }}, Col {{ tooltip.dieInfo?.col }}</span>
      </div>
      <div class="tooltip-item">
        <span class="label">坐标:</span>
        <span class="value">
          X: {{ tooltip.dieInfo?.x?.toFixed(2) }}mm, Y: {{ tooltip.dieInfo?.y?.toFixed(2) }}mm
        </span>
      </div>
      <div
        v-if="tooltip.dieInfo?.defects && tooltip.dieInfo.defects.length > 0"
        class="tooltip-item"
      >
        <span class="label">缺陷数:</span>
        <span class="value">{{ tooltip.dieInfo.defects.length }}</span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="showStats" class="stats-panel">
      <div class="stat-item">
        <span class="label">Die:</span>
        <span class="value">{{ validDies }} / {{ totalDies }}</span>
      </div>
      <div class="stat-item">
        <span class="label">缺陷:</span>
        <span class="value">{{ defectStats.rendered }} / {{ defectStats.total }}</span>
      </div>
      <div class="stat-item">
        <span class="label">FPS:</span>
        <span class="value">{{ stats.fps.toFixed(1) }}</span>
      </div>
      <div class="stat-item">
        <span class="label">渲染:</span>
        <span class="value">{{ stats.renderTime.toFixed(1) }}ms</span>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebugInfo" class="debug-panel">
      <div>Zoom: {{ zoom.toFixed(2) }}x</div>
      <div>LOD: {{ stats.lodLevel }}</div>
      <div>Selected Defects: {{ selectedDefects.length }}</div>
      <div>{{ performanceSuggestion }}</div>
    </div>

    <!-- 选中坏点的信息框和指引线 -->
    <svg v-if="selectedDefects.length > 0" class="defect-lines">
      <line
        v-for="(defect, index) in selectedDefects"
        :key="`line-${index}`"
        :x1="defect.x"
        :y1="defect.y"
        :x2="defect.labelX"
        :y2="defect.labelY"
        stroke="#409eff"
        stroke-width="1.5"
        stroke-dasharray="3,3"
      />
    </svg>

    <div
      v-for="(defect, index) in selectedDefects"
      :key="index"
      class="defect-label"
      :class="{ dragging: draggingIndex === index }"
      :style="{
        left: defect.labelX + 'px',
        top: defect.labelY + 'px'
      }"
      @mousedown="onLabelMouseDown($event, index)"
    >
      <div class="label-content">
        <div class="label-title">{{ defect.type }}</div>
        <div class="label-info">Die: ({{ defect.dieRow }}, {{ defect.dieCol }})</div>
        <div class="label-info">
          位置: ({{ defect.relX.toFixed(2) }}, {{ defect.relY.toFixed(2) }})
        </div>
      </div>
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

const { totalDies, validDies, validDiePositions, drawParams, renderBackground } = useWaferRenderer(
  props.waferConfig
)

const { defectStats, renderDefects } = useDefectLayer()

const {
  zoom,
  tooltip,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseLeave,
  handleClick,
  handleWheel,
  drawSelectionBox
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
  }>
>([])

// 是否只显示选中的坏点
const showOnlySelected = ref(false)

// 拖拽状态
const draggingIndex = ref<number | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

const {
  stats,
  recordFrameTime,
  calculateViewport,
  calculateLODLevel,
  getPerformanceSuggestion,
  updateDefectStats,
  updateLODLevel
} = usePerformance()

// 容器样式
const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

// 性能建议
const performanceSuggestion = computed(() => getPerformanceSuggestion())

// ==================== 核心渲染方法 ====================

/**
 * 主渲染函数
 */
const render = async () => {
  const startTime = performance.now()

  try {
    const containerWidth = containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE
    const canvasSize = Math.min(containerWidth, CANVAS_CONFIG.MAX_SIZE)

    // 初始化图层
    initializeLayers(canvasSize, canvasSize)
    resetAllTransforms()

    // 渲染背景层（晶圆、Die、Reticle）
    const bgLayer = getLayer('background')
    if (bgLayer) {
      renderBackground(bgLayer, canvasSize)
    }

    // 渲染缺陷层
    if (renderConfig.value.showDefects && props.defects.length > 0) {
      await renderDefectsLayer(canvasSize)
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
const renderDefectsLayer = async (canvasSize: number) => {
  const defectsLayer = getLayer('defects')
  if (!defectsLayer) return

  // 计算视口（初始状态下覆盖整个画布）
  const viewport = calculateViewport(
    canvasSize,
    canvasSize,
    zoom.value,
    canvasSize / 2,
    canvasSize / 2
  )

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
 * 渲染交互层
 */
const renderInteractionLayer = () => {
  const interactionLayer = getLayer('interaction')
  if (!interactionLayer) return

  const { canvas, ctx } = interactionLayer
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制选择框
  drawSelectionBox(ctx)
}

// ==================== 事件处理 ====================

const onMouseDown = (event: MouseEvent) => {
  if (!interactionCanvas.value) return
  handleMouseDown(event, interactionCanvas.value)
}

const onMouseMove = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

  handleMouseMove(
    event,
    interactionCanvas.value,
    validDiePositions.value,
    drawParams.value.scale * props.waferConfig.dieWidth,
    drawParams.value.scale * props.waferConfig.dieHeight,
    props.defects,
    renderConfig.value.enableTooltip
  )

  // 重绘交互层
  renderInteractionLayer()
}

const onMouseUp = (event: MouseEvent) => {
  if (!interactionCanvas.value) return

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
    const canvasSize = Math.min(
      containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
      CANVAS_CONFIG.MAX_SIZE
    )
    renderDefectsLayer(canvasSize)
  }

  renderInteractionLayer()
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

        // 初始化信息框位置（默认在坏点右侧 60px）
        selected.push({
          x,
          y,
          type: defect.type,
          dieRow: defect.dieRow,
          dieCol: defect.dieCol,
          relX: defect.x,
          relY: defect.y,
          labelX: x + 60,
          labelY: y
        })
      }
    }
  })

  selectedDefects.value = selected
  console.log(
    `Selected ${selected.length} defects in ${selectedDies.length} dies from ${props.defects.length} total defects`
  )
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
      const canvasSize = Math.min(
        containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
        CANVAS_CONFIG.MAX_SIZE
      )
      renderDefectsLayer(canvasSize)
    })
  }
}

// ==================== 信息框拖拽 ====================

/**
 * 信息框鼠标按下
 */
const onLabelMouseDown = (event: MouseEvent, index: number) => {
  event.stopPropagation()
  event.preventDefault()

  draggingIndex.value = index
  const defect = selectedDefects.value[index]

  // 记录鼠标相对于信息框的偏移
  dragOffset.value = {
    x: event.clientX - defect.labelX,
    y: event.clientY - defect.labelY
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', onLabelMouseMove)
  document.addEventListener('mouseup', onLabelMouseUp)
}

/**
 * 信息框拖拽移动
 */
const onLabelMouseMove = (event: MouseEvent) => {
  if (draggingIndex.value === null) return

  const defect = selectedDefects.value[draggingIndex.value]
  if (!defect) return

  // 计算新位置
  defect.labelX = event.clientX - dragOffset.value.x
  defect.labelY = event.clientY - dragOffset.value.y
}

/**
 * 信息框拖拽结束
 */
const onLabelMouseUp = () => {
  draggingIndex.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', onLabelMouseMove)
  document.removeEventListener('mouseup', onLabelMouseUp)
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
    const canvasSize = Math.min(
      containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
      CANVAS_CONFIG.MAX_SIZE
    )
    renderDefectsLayer(canvasSize)
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
  const canvasSize = Math.min(
    containerRef.value?.clientWidth || CANVAS_CONFIG.DEFAULT_SIZE,
    CANVAS_CONFIG.MAX_SIZE
  )
  renderDefectsLayer(canvasSize)
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

.wafer-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  min-width: 200px;

  .tooltip-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tooltip-item {
    display: flex;
    justify-content: space-between;
    margin: 6px 0;
    line-height: 1.5;

    .label {
      color: rgba(255, 255, 255, 0.7);
      margin-right: 12px;
    }

    .value {
      color: #fff;
      font-weight: 500;
    }
  }
}

.stats-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  z-index: 100;

  .stat-item {
    display: flex;
    justify-content: space-between;
    margin: 4px 0;
    gap: 12px;

    .label {
      color: #606266;
    }

    .value {
      font-weight: 600;
      color: #409eff;
    }
  }
}

.debug-panel {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  z-index: 100;

  div {
    margin: 2px 0;
  }
}

.defect-label {
  position: absolute;
  pointer-events: auto;
  z-index: 500;
  transform: translate(5px, -50%);
  cursor: move;
  user-select: none;
  transition: transform 0.1s ease;

  &:hover {
    transform: translate(5px, -50%) scale(1.02);
  }

  &.dragging {
    cursor: grabbing;
    z-index: 1000;

    .label-content {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      border-color: #66b1ff;
    }
  }

  .label-content {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #409eff;
    border-radius: 6px;
    padding: 8px 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-size: 12px;
    white-space: nowrap;
    transition: all 0.2s ease;

    .label-title {
      font-weight: 600;
      color: #409eff;
      margin-bottom: 4px;
      font-size: 13px;
    }

    .label-info {
      color: #606266;
      margin: 2px 0;
      font-size: 11px;
    }
  }
}

.defect-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 499;
  overflow: visible;

  line {
    filter: drop-shadow(0 0 2px rgba(64, 158, 255, 0.3));
  }
}
</style>
