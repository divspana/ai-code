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

        // 绘制 Die（蓝色）
        ctx.fillStyle = '#409EFF'
        ctx.fillRect(
          canvasX,
          canvasY,
          props.config.dieWidth * scale,
          props.config.dieHeight * scale
        )

        // 绘制 Die 边框
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 0.5
        ctx.strokeRect(
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
}

const drawNotch = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
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

watch(() => props.config, () => {
  generateWaferMap()
}, { deep: true })
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
          color: #409EFF;
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
