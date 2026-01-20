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
      <div>{{ performanceSuggestion }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { WaferMapProps, WaferMapEmits } from './types'
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

const { defectStats, renderDefects } = useDefectLayer(props.defects)

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

  // 计算视口
  const viewport = calculateViewport(canvasSize, canvasSize, zoom.value)

  // 计算 LOD 级别
  const lodLevel = calculateLODLevel(zoom.value, props.defects.length)
  updateLODLevel(lodLevel)

  // 渲染缺陷
  renderDefects(
    defectsLayer,
    props.defects,
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
  }

  renderInteractionLayer()
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

// 暴露方法
defineExpose({
  render,
  clearLayer,
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
</style>
