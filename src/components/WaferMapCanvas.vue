<template>
  <el-card class="display-card">
    <template #header>
      <div class="card-header">
        <span>Wafer Map 预览</span>
        <div class="stats">
          <span>总 Die 数: {{ totalDies }}</span>
          <span>有效 Die 数: {{ validDies }}</span>
        </div>
      </div>
    </template>

    <div class="canvas-container" ref="canvasContainer">
      <canvas ref="waferCanvas" @click="handleCanvasClick"></canvas>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import type { WaferConfig } from './WaferConfigForm.vue'

interface Props {
  config: WaferConfig
}

const props = defineProps<Props>()

const waferCanvas = ref<HTMLCanvasElement>()
const canvasContainer = ref<HTMLDivElement>()
const totalDies = ref(0)
const validDies = ref(0)

const generateWaferMap = () => {
  if (!waferCanvas.value) return

  const canvas = waferCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置画布大小
  const containerWidth = canvasContainer.value?.clientWidth || 800
  const canvasSize = Math.min(containerWidth - 40, 800)
  canvas.width = canvasSize
  canvas.height = canvasSize

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 计算缩放比例 - 确保整个晶圆都在画布内（包括 notch）
  const scale = (canvasSize * 0.85) / props.config.diameter
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2

  // 绘制 Wafer 外圆（包含倒角区域）
  const waferOuterRadius = (props.config.diameter / 2) * scale
  const waferInnerRadius = (props.config.diameter / 2 - props.config.bevel) * scale

  // 绘制倒角区域（灰色环形）
  ctx.beginPath()
  ctx.arc(centerX, centerY, waferOuterRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#e0e0e0'
  ctx.fill()
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 2
  ctx.stroke()

  // 绘制有效区域（浅灰色）
  ctx.beginPath()
  ctx.arc(centerX, centerY, waferInnerRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#f5f5f5'
  ctx.fill()
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 绘制 Notch
  drawNotch(ctx, centerX, centerY, waferOuterRadius)

  // 计算 Die 尺寸（包含 scribe line）
  const dieWidthWithScribe = props.config.dieWidth + props.config.scribeLineX
  const dieHeightWithScribe = props.config.dieHeight + props.config.scribeLineY

  // 计算需要的行列数
  const cols = Math.ceil(props.config.diameter / dieWidthWithScribe) + 2
  const rows = Math.ceil(props.config.diameter / dieHeightWithScribe) + 2

  let totalCount = 0
  let validCount = 0

  // 存储有效 Die 的位置信息（用于 Reticle 边框绘制）
  const validDiePositions: Array<{ row: number; col: number; canvasX: number; canvasY: number }> =
    []

  // 绘制 Dies - 简单均匀布局
  for (let row = -rows / 2; row < rows / 2; row++) {
    for (let col = -cols / 2; col < cols / 2; col++) {
      // 简单布局：每个 Die 按照固定间距排列（包含 Scribe Line）
      let dieX = col * dieWidthWithScribe + props.config.dieOffsetX
      let dieY = row * dieHeightWithScribe + props.config.dieOffsetY

      // 转换为画布坐标
      const canvasX = centerX + dieX * scale * (props.config.xPositive === 'RIGHT' ? 1 : -1)
      const canvasY = centerY - dieY * scale * (props.config.yPositive === 'UP' ? 1 : -1)

      // 检查 Die 的所有四个角是否都在有效区域内
      const dieCorners = [
        { x: canvasX, y: canvasY },
        { x: canvasX + props.config.dieWidth * scale, y: canvasY },
        { x: canvasX, y: canvasY + props.config.dieHeight * scale },
        { x: canvasX + props.config.dieWidth * scale, y: canvasY + props.config.dieHeight * scale }
      ]

      const allCornersInside = dieCorners.every(corner => {
        const dx = corner.x - centerX
        const dy = corner.y - centerY
        return Math.sqrt(dx * dx + dy * dy) <= waferInnerRadius
      })

      // 只绘制完全在有效区域内的 Die
      if (allCornersInside) {
        totalCount++
        validCount++

        // 存储有效 Die 的位置信息
        validDiePositions.push({ row, col, canvasX, canvasY })

        // 绘制 Die（蓝色）
        ctx.fillStyle = '#409EFF'
        ctx.fillRect(
          canvasX,
          canvasY,
          props.config.dieWidth * scale,
          props.config.dieHeight * scale
        )
      }
    }
  }

  totalDies.value = totalCount
  validDies.value = validCount

  // 绘制 Reticle 边框（如果开关打开）
  if (props.config.showReticleBorder) {
    drawReticleBorders(ctx, scale, dieWidthWithScribe, dieHeightWithScribe, validDiePositions)
  }
}

const drawReticleBorders = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  dieWidthWithScribe: number,
  dieHeightWithScribe: number,
  validDiePositions: Array<{ row: number; col: number; canvasX: number; canvasY: number }>
) => {
  if (validDiePositions.length === 0) return

  // 找到中心 Die (row=0, col=0) 作为参考点
  let centerDie = validDiePositions.find(die => die.row === 0 && die.col === 0)

  if (!centerDie) {
    // 如果中心 Die 不存在，找最接近中心的 Die
    centerDie = validDiePositions.reduce((closest, die) => {
      const distCurrent = Math.abs(die.row) + Math.abs(die.col)
      const distClosest = Math.abs(closest.row) + Math.abs(closest.col)
      return distCurrent < distClosest ? die : closest
    })
  }

  // 设置 Reticle 边框样式
  ctx.strokeStyle = '#FF6B6B'
  // 边框线宽等于 Scribe Line 的宽度，这样边框完全填充 Scribe Line
  ctx.lineWidth = Math.max(props.config.scribeLineX, props.config.scribeLineY) * scale

  // 根据有效 Die 的位置，计算并绘制 Reticle 边框
  // 使用 Set 来存储已绘制的 Reticle，避免重复
  const drawnReticles = new Set<string>()

  validDiePositions.forEach(die => {
    // 计算这个 Die 所属的 Reticle 索引
    // 使用 floor 来处理小数索引
    const reticleRow = Math.floor(die.row / props.config.reticleY)
    const reticleCol = Math.floor(die.col / props.config.reticleX)

    const reticleKey = `${reticleRow},${reticleCol}`

    // 如果这个 Reticle 还没有绘制过
    if (!drawnReticles.has(reticleKey)) {
      drawnReticles.add(reticleKey)

      // 计算这个 Reticle 左上角的 Die 行列索引
      const startRow = reticleRow * props.config.reticleY
      const startCol = reticleCol * props.config.reticleX

      // 计算 Reticle 左上角 Die 的画布位置
      const rowOffset = startRow - centerDie.row
      const colOffset = startCol - centerDie.col

      const firstDieX = centerDie.canvasX + colOffset * dieWidthWithScribe * scale
      const firstDieY = centerDie.canvasY + rowOffset * dieHeightWithScribe * scale

      // 边框框选整个 N×N Die 区域
      // 边框中心位置：从第一个 Die 左边缘向左偏移半个 Scribe Line
      const borderX = firstDieX - (props.config.scribeLineX / 2) * scale
      const borderY = firstDieY - (props.config.scribeLineY / 2) * scale

      // 边框尺寸：N 个 Die + (N-1) 个 Scribe Line + 两端各半个 Scribe Line
      // = N 个 Die + N 个 Scribe Line
      const borderWidth =
        props.config.reticleX * (props.config.dieWidth + props.config.scribeLineX) * scale
      const borderHeight =
        props.config.reticleY * (props.config.dieHeight + props.config.scribeLineY) * scale

      ctx.strokeRect(borderX, borderY, borderWidth, borderHeight)
    }
  })
}

const drawNotch = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) => {
  const notchSize = 10
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2

  switch (props.config.notch) {
    case 'UP':
      ctx.beginPath()
      ctx.moveTo(centerX - notchSize, centerY - radius)
      ctx.lineTo(centerX, centerY - radius - notchSize)
      ctx.lineTo(centerX + notchSize, centerY - radius)
      ctx.fill()
      ctx.stroke()
      break
    case 'DOWN':
      ctx.beginPath()
      ctx.moveTo(centerX - notchSize, centerY + radius)
      ctx.lineTo(centerX, centerY + radius + notchSize)
      ctx.lineTo(centerX + notchSize, centerY + radius)
      ctx.fill()
      ctx.stroke()
      break
    case 'LEFT':
      ctx.beginPath()
      ctx.moveTo(centerX - radius, centerY - notchSize)
      ctx.lineTo(centerX - radius - notchSize, centerY)
      ctx.lineTo(centerX - radius, centerY + notchSize)
      ctx.fill()
      ctx.stroke()
      break
    case 'RIGHT':
      ctx.beginPath()
      ctx.moveTo(centerX + radius, centerY - notchSize)
      ctx.lineTo(centerX + radius + notchSize, centerY)
      ctx.lineTo(centerX + radius, centerY + notchSize)
      ctx.fill()
      ctx.stroke()
      break
  }
}

const handleCanvasClick = (event: MouseEvent) => {
  const canvas = waferCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  console.log('Clicked at:', { x, y })
}

onMounted(() => {
  nextTick(() => {
    generateWaferMap()
  })
})

watch(
  () => props.config,
  () => {
    generateWaferMap()
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.display-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;

    .stats {
      display: flex;
      gap: 20px;
      font-size: 14px;
      font-weight: normal;
      color: #606266;

      span {
        &:first-child {
          color: #909399;
        }

        &:last-child {
          color: #409eff;
          font-weight: 600;
        }
      }
    }
  }

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  canvas {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: #fff;
    cursor: crosshair;
  }
}
</style>
