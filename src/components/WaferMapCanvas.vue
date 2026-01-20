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
      <canvas
        ref="waferCanvas"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
        @click="handleCanvasClick"
        style="cursor: crosshair"
      ></canvas>

      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        class="die-tooltip"
        :style="{
          left: tooltip.x + 'px',
          top: tooltip.y + 'px'
        }"
      >
        <div class="tooltip-title">Die 信息</div>
        <div class="tooltip-item">
          <span class="tooltip-label">位置:</span>
          <span class="tooltip-value"
            >Row {{ tooltip.dieInfo?.row }}, Col {{ tooltip.dieInfo?.col }}</span
          >
        </div>
        <div class="tooltip-item">
          <span class="tooltip-label">坐标:</span>
          <span class="tooltip-value"
            >X: {{ tooltip.dieInfo?.x?.toFixed(2) }}mm, Y:
            {{ tooltip.dieInfo?.y?.toFixed(2) }}mm</span
          >
        </div>
        <div
          v-if="tooltip.dieInfo?.defects && tooltip.dieInfo.defects.length > 0"
          class="tooltip-item"
        >
          <span class="tooltip-label">缺陷数:</span>
          <span class="tooltip-value">{{ tooltip.dieInfo.defects.length }}</span>
        </div>
      </div>
    </div>

    <!-- 放大视图对话框 -->
    <el-dialog
      v-model="showZoomDialog"
      title="放大视图"
      width="80%"
      center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="zoom-dialog-content">
        <canvas ref="zoomCanvas" class="zoom-canvas"></canvas>
      </div>
    </el-dialog>
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
const zoomCanvas = ref<HTMLCanvasElement>()
const canvasContainer = ref<HTMLDivElement>()
const totalDies = ref(0)
const validDies = ref(0)

// 框选放大相关状态
const isSelecting = ref(false)
const selectionStart = ref({ x: 0, y: 0 })
const selectionEnd = ref({ x: 0, y: 0 })
const showZoomDialog = ref(false)
const zoomDialogArea = ref({ minX: 0, minY: 0, maxX: 0, maxY: 0 })

// Tooltip 相关状态
interface DieInfo {
  row: number
  col: number
  x: number
  y: number
  defects?: Array<{
    dieRow: number
    dieCol: number
    x: number
    y: number
    type: string
    size?: number
    severity?: string
  }>
}

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  dieInfo: null as DieInfo | null
})

// 存储所有有效 Die 的位置信息，用于点击和悬停检测
const validDiePositionsCache = ref<
  Array<{
    row: number
    col: number
    canvasX: number
    canvasY: number
    physicalX: number
    physicalY: number
  }>
>([])

// 当前绘制参数缓存
const drawParamsCache = ref({
  scale: 0,
  centerX: 0,
  centerY: 0,
  dieWidth: 0,
  dieHeight: 0
})

const generateWaferMap = () => {
  const canvas = waferCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置画布大小
  const containerWidth = canvasContainer.value?.clientWidth || 800
  const canvasSize = Math.min(containerWidth - 40, 800)
  canvas.width = canvasSize
  canvas.height = canvasSize

  // 清空画布并重置变换矩阵
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 计算缩放比例和中心点
  const scale = (canvasSize * 0.75) / props.config.diameter
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2

  // 绘制晶圆圆圈（倒角和有效区域）
  const { waferOuterRadius, waferInnerRadius } = drawWaferCircles(ctx, centerX, centerY, scale)

  // 绘制 Notch
  drawNotch(ctx, centerX, centerY, waferOuterRadius)

  // 绘制 Dies
  const { validDiePositions, totalCount, validCount } = drawDies(
    ctx,
    centerX,
    centerY,
    scale,
    waferInnerRadius
  )

  totalDies.value = totalCount
  validDies.value = validCount

  // 缓存绘制参数和 Die 位置信息
  drawParamsCache.value = {
    scale,
    centerX,
    centerY,
    dieWidth: props.config.dieWidth * scale,
    dieHeight: props.config.dieHeight * scale
  }
  validDiePositionsCache.value = validDiePositions

  // 绘制 Reticle 边框（如果开关打开）
  if (props.config.showReticleBorder) {
    const dieWidthWithScribe = props.config.dieWidth + props.config.scribeLineX
    const dieHeightWithScribe = props.config.dieHeight + props.config.scribeLineY
    drawReticleBorders(ctx, scale, dieWidthWithScribe, dieHeightWithScribe, validDiePositions)
  }

  // 绘制缺陷（如果开关打开且有缺陷数据）
  if (props.config.showDefects && props.config.defectData && props.config.defectData.length > 0) {
    drawDefects(ctx, scale, centerX, centerY, validDiePositions)
  }
}

// 绘制晶圆圆圈（倒角和有效区域）
const drawWaferCircles = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  scale: number
) => {
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

  return { waferOuterRadius, waferInnerRadius }
}

// 绘制 Dies
const drawDies = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  scale: number,
  waferInnerRadius: number
) => {
  const dieWidthWithScribe = props.config.dieWidth + props.config.scribeLineX
  const dieHeightWithScribe = props.config.dieHeight + props.config.scribeLineY

  // 第一步：计算理论上需要多少行列才能覆盖整个晶圆
  // 使用晶圆半径计算，而不是直径
  const waferRadius = props.config.diameter / 2
  const maxRows = Math.ceil(waferRadius / dieHeightWithScribe) * 2 + 2
  const maxCols = Math.ceil(waferRadius / dieWidthWithScribe) * 2 + 2

  console.log(
    `Theoretical grid: ${maxRows}x${maxCols}, wafer diameter=${props.config.diameter}mm, die=${props.config.dieWidth}x${props.config.dieHeight}mm`
  )

  // 第二步：生成理论 Die 布局（基于整数索引）
  interface DieInfo {
    row: number
    col: number
    centerX_mm: number // Die 中心的理论坐标（mm）
    centerY_mm: number
    canvasX: number // Die 左上角的画布坐标
    canvasY: number
  }

  const allDies: DieInfo[] = []

  for (let row = -Math.floor(maxRows / 2); row <= Math.floor(maxRows / 2); row++) {
    for (let col = -Math.floor(maxCols / 2); col <= Math.floor(maxCols / 2); col++) {
      // 计算 Die 中心的理论坐标（mm）
      const centerX_mm = col * dieWidthWithScribe + props.config.dieOffsetX
      const centerY_mm = row * dieHeightWithScribe + props.config.dieOffsetY

      // 转换为画布坐标（Die 左上角）
      const canvasX =
        centerX +
        (centerX_mm - props.config.dieWidth / 2) *
          scale *
          (props.config.xPositive === 'RIGHT' ? 1 : -1)
      const canvasY =
        centerY -
        (centerY_mm + props.config.dieHeight / 2) *
          scale *
          (props.config.yPositive === 'UP' ? 1 : -1)

      allDies.push({ row, col, centerX_mm, centerY_mm, canvasX, canvasY })
    }
  }

  // 第三步：判断每个 Die 是否在有效区域内
  const tolerance = 0.01 * scale
  const validDiePositions: DieInfo[] = []
  let rejectedCount = 0
  const rejectedDies: Array<{ row: number; col: number; maxDistance: number }> = []

  for (const die of allDies) {
    // 检查 Die 的四个角是否都在有效区域内
    const dieCorners = [
      { x: die.canvasX, y: die.canvasY },
      { x: die.canvasX + props.config.dieWidth * scale, y: die.canvasY },
      { x: die.canvasX, y: die.canvasY + props.config.dieHeight * scale },
      {
        x: die.canvasX + props.config.dieWidth * scale,
        y: die.canvasY + props.config.dieHeight * scale
      }
    ]

    const cornerDistances = dieCorners.map(corner => {
      const dx = corner.x - centerX
      const dy = corner.y - centerY
      return Math.sqrt(dx * dx + dy * dy)
    })

    const allCornersInside = cornerDistances.every(dist => dist <= waferInnerRadius + tolerance)

    if (allCornersInside) {
      validDiePositions.push(die)
    } else {
      // 调试：检查 Die 中心是否在有效区域内
      const dieCenterCanvasX = die.canvasX + (props.config.dieWidth * scale) / 2
      const dieCenterCanvasY = die.canvasY + (props.config.dieHeight * scale) / 2
      const centerDistance = Math.sqrt(
        Math.pow(dieCenterCanvasX - centerX, 2) + Math.pow(dieCenterCanvasY - centerY, 2)
      )

      if (centerDistance <= waferInnerRadius) {
        rejectedCount++
        const maxDistance = Math.max(...cornerDistances)
        const exceedBy = maxDistance - waferInnerRadius
        if (rejectedDies.length < 20) {
          rejectedDies.push({ row: die.row, col: die.col, maxDistance: exceedBy / scale })
        }
      }
    }
  }

  // 第四步：绘制有效的 Die
  ctx.fillStyle = '#409EFF'
  for (const die of validDiePositions) {
    ctx.fillRect(
      die.canvasX,
      die.canvasY,
      props.config.dieWidth * scale,
      props.config.dieHeight * scale
    )
  }

  console.log(`Valid Dies: ${validDiePositions.length}, Rejected (center inside): ${rejectedCount}`)
  if (rejectedDies.length > 0) {
    console.log(
      'Sample rejected dies:',
      rejectedDies
        .map(d => `(${d.row},${d.col}) exceed by ${d.maxDistance.toFixed(4)}mm`)
        .join(', ')
    )
  }

  return {
    validDiePositions: validDiePositions.map(d => ({
      row: d.row,
      col: d.col,
      canvasX: d.canvasX,
      canvasY: d.canvasY,
      physicalX: d.centerX_mm,
      physicalY: d.centerY_mm
    })),
    totalCount: validDiePositions.length,
    validCount: validDiePositions.length
  }
}

// 绘制缺陷（优化版：支持大数据量）
const drawDefects = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  centerX: number,
  centerY: number,
  validDiePositions: Array<{ row: number; col: number; canvasX: number; canvasY: number }>
) => {
  if (!props.config.defectData || props.config.defectData.length === 0) return

  const startTime = performance.now()

  // 创建 Die 位置映射，用于快速查找
  const diePositionMap = new Map<string, { canvasX: number; canvasY: number }>()
  validDiePositions.forEach(die => {
    diePositionMap.set(`${die.row},${die.col}`, { canvasX: die.canvasX, canvasY: die.canvasY })
  })

  // 默认缺陷大小和颜色映射
  const defaultDefectSize = props.config.defectSize || 2
  const defaultColors: Record<string, string> = {
    scratch: '#FF4444',
    particle: '#FFA500',
    void: '#9370DB',
    crack: '#DC143C',
    contamination: '#FFD700',
    default: '#FF0000'
  }
  const defectColors = props.config.defectTypeColors || defaultColors

  // 获取画布尺寸用于视口裁剪
  const canvas = ctx.canvas
  const viewportMinX = 0
  const viewportMinY = 0
  const viewportMaxX = canvas.width
  const viewportMaxY = canvas.height

  let drawnCount = 0
  let skippedCount = 0

  // 批量绘制优化：按颜色分组绘制
  const defectsByColor = new Map<string, Array<{ x: number; y: number; size: number }>>()

  // 遍历所有缺陷，进行视口裁剪和分组
  props.config.defectData.forEach(defect => {
    const dieKey = `${defect.dieRow},${defect.dieCol}`
    const diePos = diePositionMap.get(dieKey)

    if (!diePos) {
      skippedCount++
      return
    }

    // 计算缺陷在画布上的位置
    const defectX = diePos.canvasX + defect.x * props.config.dieWidth * scale
    const defectY = diePos.canvasY + defect.y * props.config.dieHeight * scale

    // 视口裁剪：只绘制可见区域内的缺陷
    const size = (defect.size || defaultDefectSize) * scale
    if (
      defectX + size < viewportMinX ||
      defectX - size > viewportMaxX ||
      defectY + size < viewportMinY ||
      defectY - size > viewportMaxY
    ) {
      skippedCount++
      return
    }

    // 按颜色分组
    const color = defectColors[defect.type] || defectColors.default || '#FF0000'
    if (!defectsByColor.has(color)) {
      defectsByColor.set(color, [])
    }
    defectsByColor.get(color)!.push({ x: defectX, y: defectY, size })
    drawnCount++
  })

  // 批量绘制：相同颜色的缺陷一起绘制，减少状态切换
  defectsByColor.forEach((defects, color) => {
    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 0.5

    defects.forEach(({ x, y, size }) => {
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
  })

  const endTime = performance.now()
  console.log(
    `Defects: drawn=${drawnCount}, skipped=${skippedCount}, time=${(endTime - startTime).toFixed(2)}ms`
  )
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

// 鼠标按下 - 开始框选
const handleMouseDown = (event: MouseEvent) => {
  const canvas = waferCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  isSelecting.value = true
  selectionStart.value = { x, y }
  selectionEnd.value = { x, y }
}

// 鼠标移动 - 更新框选区域或显示 tooltip
const handleMouseMove = (event: MouseEvent) => {
  const canvas = waferCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  if (isSelecting.value) {
    // 框选模式：更新选择区域
    selectionEnd.value = { x, y }
    // 重绘画布并绘制框选矩形
    generateWaferMap()
    drawSelectionRect()
    // 隐藏 tooltip
    tooltip.value.visible = false
  } else {
    // 非框选模式：显示 tooltip
    const dieInfo = getDieAtPosition(x, y)
    if (dieInfo) {
      tooltip.value = {
        visible: true,
        x: event.clientX - rect.left + 15,
        y: event.clientY - rect.top + 15,
        dieInfo
      }
    } else {
      tooltip.value.visible = false
    }
  }
}

// 鼠标抬起 - 完成框选并弹出对话框
const handleMouseUp = (event: MouseEvent) => {
  if (!isSelecting.value) return

  isSelecting.value = false

  const canvas = waferCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  selectionEnd.value = { x, y }

  // 计算选择区域
  const minX = Math.min(selectionStart.value.x, selectionEnd.value.x)
  const minY = Math.min(selectionStart.value.y, selectionEnd.value.y)
  const maxX = Math.max(selectionStart.value.x, selectionEnd.value.x)
  const maxY = Math.max(selectionStart.value.y, selectionEnd.value.y)
  const width = maxX - minX
  const height = maxY - minY

  // 只有选择区域足够大时才弹出对话框（避免误触）
  if (width > 20 && height > 20) {
    // 扩展选择区域以包含完整的 Die
    const expandedArea = expandSelectionToCompleteDies(minX, minY, maxX, maxY)

    zoomDialogArea.value = expandedArea
    showZoomDialog.value = true
  }

  // 重绘画布以清除框选矩形
  generateWaferMap()
}

// 扩展选择区域以包含完整的 Die
const expandSelectionToCompleteDies = (minX: number, minY: number, maxX: number, maxY: number) => {
  const canvas = waferCanvas.value
  if (!canvas) return { minX, minY, maxX, maxY }

  // 计算当前的缩放参数
  const canvasSize = Math.min(canvas.width, canvas.height)
  const scale = (canvasSize * 0.75) / props.config.diameter
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2

  // Die 尺寸（包含 scribe line）
  const dieWidthWithScribe = (props.config.dieWidth + props.config.scribeLineX) * scale
  const dieHeightWithScribe = (props.config.dieHeight + props.config.scribeLineY) * scale

  // 将画布坐标转换为 Die 坐标系
  // 计算选择区域相对于中心的偏移
  const selMinX_offset = minX - centerX
  const selMinY_offset = minY - centerY
  const selMaxX_offset = maxX - centerX
  const selMaxY_offset = maxY - centerY

  // 计算包含的 Die 范围（向下取整和向上取整）
  const minDieCol = Math.floor(selMinX_offset / dieWidthWithScribe)
  const maxDieCol = Math.ceil(selMaxX_offset / dieWidthWithScribe)
  const minDieRow = Math.floor(selMinY_offset / dieHeightWithScribe)
  const maxDieRow = Math.ceil(selMaxY_offset / dieHeightWithScribe)

  // 将 Die 范围转换回画布坐标
  const expandedMinX = centerX + minDieCol * dieWidthWithScribe
  const expandedMinY = centerY + minDieRow * dieHeightWithScribe
  const expandedMaxX = centerX + maxDieCol * dieWidthWithScribe
  const expandedMaxY = centerY + maxDieRow * dieHeightWithScribe

  return {
    minX: expandedMinX,
    minY: expandedMinY,
    maxX: expandedMaxX,
    maxY: expandedMaxY
  }
}

// 鼠标离开 - 取消框选并隐藏 tooltip
const handleMouseLeave = () => {
  if (isSelecting.value) {
    isSelecting.value = false
    generateWaferMap()
  }
  tooltip.value.visible = false
}

// 根据画布坐标获取 Die 信息
const getDieAtPosition = (canvasX: number, canvasY: number): DieInfo | null => {
  const { scale, dieWidth, dieHeight } = drawParamsCache.value
  if (scale === 0) return null

  // 遍历所有有效 Die，找到鼠标位置对应的 Die
  for (const die of validDiePositionsCache.value) {
    const dieLeft = die.canvasX - dieWidth / 2
    const dieRight = die.canvasX + dieWidth / 2
    const dieTop = die.canvasY - dieHeight / 2
    const dieBottom = die.canvasY + dieHeight / 2

    if (canvasX >= dieLeft && canvasX <= dieRight && canvasY >= dieTop && canvasY <= dieBottom) {
      // 找到对应的缺陷数据
      const defects =
        props.config.defectData?.filter(
          defect => defect.dieRow === die.row && defect.dieCol === die.col
        ) || []

      return {
        row: die.row,
        col: die.col,
        x: die.physicalX,
        y: die.physicalY,
        defects
      }
    }
  }

  return null
}

// 画布点击事件 - 显示 Die 详细信息
const handleCanvasClick = (event: MouseEvent) => {
  // 如果刚完成框选，不触发点击事件
  if (isSelecting.value) return

  const canvas = waferCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const dieInfo = getDieAtPosition(x, y)
  if (dieInfo) {
    console.log('Clicked Die:', dieInfo)
    // 可以在这里触发自定义事件或显示详细信息对话框
    // emit('die-click', dieInfo)
  }
}

// 绘制框选矩形
const drawSelectionRect = () => {
  const canvas = waferCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const minX = Math.min(selectionStart.value.x, selectionEnd.value.x)
  const minY = Math.min(selectionStart.value.y, selectionEnd.value.y)
  const width = Math.abs(selectionEnd.value.x - selectionStart.value.x)
  const height = Math.abs(selectionEnd.value.y - selectionStart.value.y)

  // 绘制淡蓝色填充
  ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'
  ctx.fillRect(minX, minY, width, height)

  // 绘制边框
  ctx.strokeStyle = '#409EFF'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(minX, minY, width, height)
  ctx.setLineDash([])
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

// 监听对话框打开，绘制放大视图
watch(showZoomDialog, newVal => {
  if (newVal) {
    nextTick(() => {
      drawZoomView()
    })
  }
})

// 绘制放大视图
const drawZoomView = () => {
  const canvas = zoomCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置画布大小为较大的尺寸以显示更多细节
  const zoomCanvasSize = 1000
  canvas.width = zoomCanvasSize
  canvas.height = zoomCanvasSize

  // 清空画布并重置变换矩阵
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 计算选中区域的尺寸（原始画布坐标）
  const selectedWidth = zoomDialogArea.value.maxX - zoomDialogArea.value.minX
  const selectedHeight = zoomDialogArea.value.maxY - zoomDialogArea.value.minY

  // 计算缩放比例，使选中区域填充放大画布
  const scaleX = zoomCanvasSize / selectedWidth
  const scaleY = zoomCanvasSize / selectedHeight
  const zoomScale = Math.min(scaleX, scaleY) * 0.9

  // 应用变换：先平移到画布中心，再缩放，再平移选中区域到中心
  ctx.save()
  ctx.translate(zoomCanvasSize / 2, zoomCanvasSize / 2)
  ctx.scale(zoomScale, zoomScale)
  ctx.translate(
    -(zoomDialogArea.value.minX + selectedWidth / 2),
    -(zoomDialogArea.value.minY + selectedHeight / 2)
  )

  // 重新绘制整个 Wafer Map（使用原始的缩放参数）
  const originalCanvas = waferCanvas.value
  if (!originalCanvas) return

  const canvasSize = Math.min(originalCanvas.width, originalCanvas.height)
  const scale = (canvasSize * 0.75) / props.config.diameter
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2

  // 绘制晶圆圆圈
  const { waferOuterRadius, waferInnerRadius } = drawWaferCircles(ctx, centerX, centerY, scale)

  // 绘制 Notch
  drawNotch(ctx, centerX, centerY, waferOuterRadius)

  // 绘制 Dies
  const { validDiePositions } = drawDies(ctx, centerX, centerY, scale, waferInnerRadius)

  // 绘制 Reticle 边框
  if (props.config.showReticleBorder) {
    const dieWidthWithScribe = props.config.dieWidth + props.config.scribeLineX
    const dieHeightWithScribe = props.config.dieHeight + props.config.scribeLineY
    drawReticleBorders(ctx, scale, dieWidthWithScribe, dieHeightWithScribe, validDiePositions)
  }

  // 绘制缺陷
  if (props.config.showDefects && props.config.defectData && props.config.defectData.length > 0) {
    drawDefects(ctx, scale, centerX, centerY, validDiePositions)
  }

  ctx.restore()
}
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
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;

  canvas {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}

.zoom-dialog-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;

  .zoom-canvas {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    max-width: 100%;
    max-height: 70vh;
  }
}

.die-tooltip {
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

    .tooltip-label {
      color: rgba(255, 255, 255, 0.7);
      margin-right: 12px;
    }

    .tooltip-value {
      color: #fff;
      font-weight: 500;
    }
  }
}
</style>
