/**
 * Wafer 渲染器 Hook
 * 负责背景层的渲染（晶圆、Die、Reticle）
 */

import { ref } from 'vue'
import type { WaferConfig, DiePosition, LayerContext } from '../types'
import { CANVAS_CONFIG, STYLES } from '../constants'

export function useWaferRenderer(config: WaferConfig) {
  const totalDies = ref(0)
  const validDies = ref(0)
  const validDiePositions = ref<DiePosition[]>([])

  // 绘制参数缓存
  const drawParams = ref({
    scale: 0,
    centerX: 0,
    centerY: 0,
    waferOuterRadius: 0,
    waferInnerRadius: 0
  })

  /**
   * 渲染背景层
   */
  const renderBackground = (layer: LayerContext, canvasSize: number) => {
    const { canvas, ctx } = layer

    // 清空并重置
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 计算缩放和中心
    const scale = (canvasSize * CANVAS_CONFIG.SCALE_FACTOR) / config.diameter
    const centerX = canvasSize / 2
    const centerY = canvasSize / 2

    // 缓存参数
    drawParams.value.scale = scale
    drawParams.value.centerX = centerX
    drawParams.value.centerY = centerY

    // 绘制晶圆圆圈
    const { waferOuterRadius, waferInnerRadius } = drawWaferCircles(ctx, centerX, centerY, scale)
    drawParams.value.waferOuterRadius = waferOuterRadius
    drawParams.value.waferInnerRadius = waferInnerRadius

    // 绘制 Notch
    drawNotch(ctx, centerX, centerY, waferOuterRadius)

    // 绘制 Dies
    const { positions, total, valid } = drawDies(ctx, centerX, centerY, scale, waferInnerRadius)
    validDiePositions.value = positions
    totalDies.value = total
    validDies.value = valid

    // 绘制 Reticle 边框
    if (config.showReticleBorder) {
      drawReticleBorders(ctx, scale, positions)
    }
  }

  /**
   * 绘制晶圆圆圈
   */
  const drawWaferCircles = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    scale: number
  ) => {
    const waferRadius = config.diameter / 2
    const waferOuterRadius = waferRadius * scale
    const waferInnerRadius = (waferRadius - config.edgeExclusion) * scale

    // 外圈（倒角区域）
    ctx.beginPath()
    ctx.arc(centerX, centerY, waferOuterRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#e0e0e0'
    ctx.fill()
    ctx.strokeStyle = '#999'
    ctx.lineWidth = 2
    ctx.stroke()

    // 内圈（有效区域）
    ctx.beginPath()
    ctx.arc(centerX, centerY, waferInnerRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#f5f5f5'
    ctx.fill()
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1.5
    ctx.stroke()

    return { waferOuterRadius, waferInnerRadius }
  }

  /**
   * 绘制 Notch
   */
  const drawNotch = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ) => {
    const notchSize = STYLES.NOTCH_SIZE
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2

    switch (config.notch) {
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

  /**
   * 绘制 Dies
   */
  const drawDies = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    scale: number,
    waferInnerRadius: number
  ) => {
    const dieWidthWithScribe = config.dieWidth + config.scribeLineX
    const dieHeightWithScribe = config.dieHeight + config.scribeLineY

    // 计算需要的行列数
    const waferRadius = config.diameter / 2
    const maxRows = Math.ceil(waferRadius / dieHeightWithScribe) * 2 + 2
    const maxCols = Math.ceil(waferRadius / dieWidthWithScribe) * 2 + 2

    const positions: DiePosition[] = []
    const tolerance = 0.01 * scale

    // 生成所有 Die
    for (let row = -Math.floor(maxRows / 2); row <= Math.floor(maxRows / 2); row++) {
      for (let col = -Math.floor(maxCols / 2); col <= Math.floor(maxCols / 2); col++) {
        // 计算 Die 中心物理坐标
        const centerX_mm = col * dieWidthWithScribe + config.dieOffsetX
        const centerY_mm = row * dieHeightWithScribe + config.dieOffsetY

        // 转换为画布坐标（左上角）
        const canvasX =
          centerX +
          (centerX_mm - config.dieWidth / 2) * scale * (config.xPositive === 'RIGHT' ? 1 : -1)
        const canvasY =
          centerY -
          (centerY_mm + config.dieHeight / 2) * scale * (config.yPositive === 'UP' ? 1 : -1)

        // 检查四个角是否都在有效区域内
        const corners = [
          { x: canvasX, y: canvasY },
          { x: canvasX + config.dieWidth * scale, y: canvasY },
          { x: canvasX, y: canvasY + config.dieHeight * scale },
          { x: canvasX + config.dieWidth * scale, y: canvasY + config.dieHeight * scale }
        ]

        const allCornersInside = corners.every(corner => {
          const dx = corner.x - centerX
          const dy = corner.y - centerY
          const dist = Math.sqrt(dx * dx + dy * dy)
          return dist <= waferInnerRadius + tolerance
        })

        if (allCornersInside) {
          positions.push({
            row,
            col,
            canvasX,
            canvasY,
            physicalX: centerX_mm,
            physicalY: centerY_mm
          })
        }
      }
    }

    // 绘制有效的 Die
    ctx.fillStyle = '#409EFF'
    positions.forEach(die => {
      ctx.fillRect(die.canvasX, die.canvasY, config.dieWidth * scale, config.dieHeight * scale)
    })

    return {
      positions,
      total: positions.length,
      valid: positions.length
    }
  }

  /**
   * 绘制 Reticle 边框
   */
  const drawReticleBorders = (
    ctx: CanvasRenderingContext2D,
    scale: number,
    positions: DiePosition[]
  ) => {
    if (positions.length === 0) return

    // 找到中心 Die
    let centerDie = positions.find(die => die.row === 0 && die.col === 0)
    if (!centerDie) {
      centerDie = positions.reduce((closest, die) => {
        const distCurrent = Math.abs(die.row) + Math.abs(die.col)
        const distClosest = Math.abs(closest.row) + Math.abs(closest.col)
        return distCurrent < distClosest ? die : closest
      })
    }

    const dieWidthWithScribe = (config.dieWidth + config.scribeLineX) * scale
    const dieHeightWithScribe = (config.dieHeight + config.scribeLineY) * scale

    ctx.strokeStyle = STYLES.RETICLE_BORDER_COLOR
    ctx.lineWidth = Math.max(config.scribeLineX, config.scribeLineY) * scale

    const drawnReticles = new Set<string>()

    positions.forEach(die => {
      const reticleRow = Math.floor(die.row / config.reticleY)
      const reticleCol = Math.floor(die.col / config.reticleX)
      const reticleKey = `${reticleRow},${reticleCol}`

      if (!drawnReticles.has(reticleKey)) {
        drawnReticles.add(reticleKey)

        const startRow = reticleRow * config.reticleY
        const startCol = reticleCol * config.reticleX

        const rowOffset = startRow - centerDie.row
        const colOffset = startCol - centerDie.col

        const firstDieX = centerDie.canvasX + colOffset * dieWidthWithScribe
        const firstDieY = centerDie.canvasY + rowOffset * dieHeightWithScribe

        const borderX = firstDieX - (config.scribeLineX / 2) * scale
        const borderY = firstDieY - (config.scribeLineY / 2) * scale

        const borderWidth = config.reticleX * (config.dieWidth + config.scribeLineX) * scale
        const borderHeight = config.reticleY * (config.dieHeight + config.scribeLineY) * scale

        ctx.strokeRect(borderX, borderY, borderWidth, borderHeight)
      }
    })
  }

  return {
    // 状态
    totalDies,
    validDies,
    validDiePositions,
    drawParams,

    // 方法
    renderBackground
  }
}
