<template>
  <div class="wafer-map-example">
    <div class="controls">
      <el-button @click="loadDefectData">加载坏点数据</el-button>
      <el-button @click="clearSelection">清空选择</el-button>
      <div class="info">
        <span>总坏点数: {{ totalDefects }}</span>
        <span>选中坏点数: {{ selectedDefects.length }}</span>
      </div>
    </div>

    <div ref="containerRef" class="canvas-container">
      <canvas ref="backgroundCanvasRef"></canvas>
      <canvas ref="defectsCanvasRef"></canvas>
      <canvas ref="interactionCanvasRef"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCanvasLayers } from '../hooks/useCanvasLayers'
import { useWaferRenderer } from '../hooks/useWaferRenderer'
import { useInteraction } from '../hooks/useInteraction'
import { useDefectInfoBox } from '../hooks/useDefectInfoBox'
import { createDefectAdapter } from '../utils/defectAdapter'
import type { DefectArrayData } from '../types/defectData'
import type { WaferConfig } from '../types'

// 容器引用
const containerRef = ref<HTMLDivElement>()
const backgroundCanvasRef = ref<HTMLCanvasElement>()
const defectsCanvasRef = ref<HTMLCanvasElement>()
const interactionCanvasRef = ref<HTMLCanvasElement>()

// 晶圆配置
const waferConfig: WaferConfig = {
  diameter: 300,
  edgeExclusion: 3,
  notch: 'DOWN',
  dieWidth: 10,
  dieHeight: 10,
  dieOffsetX: 0,
  dieOffsetY: 0,
  scribeLineX: 0.2,
  scribeLineY: 0.2,
  reticleX: 2,
  reticleY: 2,
  showReticleBorder: true,
  xPositive: 'RIGHT',
  yPositive: 'UP'
}

const canvasSize = ref(800)

// 使用 Hooks
const { initializeLayers, getLayer } = useCanvasLayers()
const { validDiePositions, drawParams, renderBackground } = useWaferRenderer(waferConfig)
const { handleMouseDown, handleMouseMove, handleMouseUp } = useInteraction()
const infoBox = useDefectInfoBox({ canvasSize: canvasSize.value })

// 创建坐标适配器
const adapter = createDefectAdapter({
  waferRows: 30,
  waferCols: 30,
  dieWidth: waferConfig.dieWidth,
  dieHeight: waferConfig.dieHeight
})

// 坏点数据
const defectData = ref<DefectArrayData>({
  logicx: [],
  logicy: [],
  defectType: []
})

const selectedDefects = computed(() => infoBox.selectedDefects.value)
const totalDefects = computed(() => defectData.value.logicx.length)

/**
 * 加载坏点数据（模拟）
 */
const loadDefectData = () => {
  // 生成模拟数据
  const count = 1000
  const logicx: number[] = []
  const logicy: number[] = []
  const defectType: string[] = []

  for (let i = 0; i < count; i++) {
    logicx.push(Math.random() * 300)
    logicy.push(Math.random() * 300)
    defectType.push(`type${Math.floor(Math.random() * 5) + 1}`)
  }

  defectData.value = { logicx, logicy, defectType }

  // 重新渲染
  renderAll()
}

/**
 * 清空选择
 */
const clearSelection = () => {
  infoBox.clearSelectedDefects()
  renderInteractionLayer()
}

/**
 * 渲染所有图层
 */
const renderAll = () => {
  renderBackgroundLayer()
  renderDefectsLayer()
  renderInteractionLayer()
}

/**
 * 渲染背景层（晶圆图）
 */
const renderBackgroundLayer = () => {
  const layer = getLayer('background')
  if (!layer) return

  const { ctx } = layer
  ctx.clearRect(0, 0, canvasSize.value, canvasSize.value)

  renderBackground(ctx, canvasSize.value, validDiePositions.value, drawParams.value)
}

/**
 * 渲染坏点层
 */
const renderDefectsLayer = () => {
  const layer = getLayer('defects')
  if (!layer) return

  const { ctx } = layer
  ctx.clearRect(0, 0, canvasSize.value, canvasSize.value)

  // 转换坏点数据
  const defects = adapter.convertArrayData(defectData.value)

  // 计算 Canvas 位置并绘制
  const defectsWithPos = adapter.calculateCanvasPositions(
    defects,
    validDiePositions.value,
    drawParams.value.scale
  )

  ctx.fillStyle = '#ff0000'
  defectsWithPos.forEach(defect => {
    ctx.beginPath()
    ctx.arc(defect.canvasX, defect.canvasY, 2, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * 渲染交互层（信息框）
 */
const renderInteractionLayer = () => {
  const layer = getLayer('interaction')
  if (!layer) return

  const { ctx } = layer
  ctx.clearRect(0, 0, canvasSize.value, canvasSize.value)

  // 绘制信息框
  infoBox.render(ctx)
}

/**
 * 鼠标事件处理
 */
const onMouseDown = (event: MouseEvent) => {
  const canvas = interactionCanvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 检查是否点击在信息框上
  const index = infoBox.getInfoBoxIndexAtPosition(mouseX, mouseY)
  if (index !== -1) {
    infoBox.startDrag(index, mouseX, mouseY)
    return
  }

  // 否则执行框选
  handleMouseDown(event, canvas)
}

const onMouseMove = (event: MouseEvent) => {
  const canvas = interactionCanvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 更新拖拽
  if (infoBox.updateDrag(mouseX, mouseY)) {
    renderInteractionLayer()
    return
  }

  // 更新 hover
  const isHovering = infoBox.updateHover(mouseX, mouseY)
  canvas.style.cursor = isHovering ? 'move' : 'crosshair'

  // 执行框选移动
  handleMouseMove(
    event,
    canvas,
    validDiePositions.value,
    drawParams.value.scale * waferConfig.dieWidth,
    drawParams.value.scale * waferConfig.dieHeight,
    [],
    false
  )
}

const onMouseUp = (event: MouseEvent) => {
  const canvas = interactionCanvasRef.value
  if (!canvas) return

  // 结束拖拽
  infoBox.endDrag()

  // 处理框选
  const result = handleMouseUp(
    event,
    canvas,
    validDiePositions.value,
    drawParams.value.scale * waferConfig.dieWidth,
    drawParams.value.scale * waferConfig.dieHeight,
    []
  )

  if (result?.type === 'selection') {
    // 获取选中区域的坏点
    const selectedDefectPoints = adapter.filterByDies(defectData.value, result.dies)

    // 计算 Canvas 位置
    const defectsWithPos = adapter.calculateCanvasPositions(
      selectedDefectPoints,
      validDiePositions.value,
      drawParams.value.scale
    )

    // 设置信息框数据
    infoBox.setSelectedDefects(defectsWithPos)

    // 重新渲染
    renderInteractionLayer()
  }
}

/**
 * 初始化
 */
onMounted(() => {
  if (!backgroundCanvasRef.value || !defectsCanvasRef.value || !interactionCanvasRef.value) {
    return
  }

  // 初始化图层
  initializeLayers(
    backgroundCanvasRef.value,
    defectsCanvasRef.value,
    interactionCanvasRef.value,
    canvasSize.value
  )

  // 绑定事件
  const canvas = interactionCanvasRef.value
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)

  // 初始渲染
  renderAll()

  // 加载示例数据
  loadDefectData()
})
</script>

<style scoped>
.wafer-map-example {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.info {
  display: flex;
  gap: 16px;
  margin-left: auto;
  font-size: 14px;
  color: #666;
}

.canvas-container {
  position: relative;
  width: 800px;
  height: 800px;
  border: 1px solid #ddd;
  background: #f5f5f5;
}

.canvas-container canvas {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
