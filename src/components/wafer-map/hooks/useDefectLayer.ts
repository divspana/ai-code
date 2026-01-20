/**
 * 缺陷层管理 Hook
 * 负责缺陷的渲染和性能优化（视口裁剪、数据抽稀）
 */

import { ref } from 'vue'
import type { Defect, DiePosition, Viewport, LayerContext } from '../types'
import { DEFAULT_RENDER_CONFIG, PERFORMANCE_THRESHOLDS } from '../constants'

export function useDefectLayer() {
  /**
   * 缺陷统计
   */
  const defectStats = ref({
    total: 0,
    rendered: 0,
    skipped: 0
  })

  /**
   * 处理后的缺陷数据
   */
  interface ProcessedDefect {
    x: number
    y: number
    size: number
    color: string
  }

  /**
   * 处理缺陷数据（多维度智能抽稀）
   * 策略：
   * 1. 计算所有有效 Die 的总像素面积
   * 2. 基于像素网格去重（同一像素只保留一个点）
   * 3. 如果数据量仍超过像素容量，进行 Die 级别的采样
   */
  const processDefects = (
    defects: Defect[],
    diePositions: DiePosition[],
    viewport: Viewport,
    scale: number,
    dieWidth: number,
    dieHeight: number,
    enableCulling: boolean,
    enableDecimation: boolean
  ): Map<string, ProcessedDefect[]> => {
    const startTime = performance.now()

    // 创建 Die 查找 Map
    const dieMap = new Map<string, DiePosition>()
    diePositions.forEach(die => {
      dieMap.set(`${die.row},${die.col}`, die)
    })

    // 计算理论最大像素容量
    // 每个 Die 的像素面积
    const diePixelWidth = Math.ceil(dieWidth)
    const diePixelHeight = Math.ceil(dieHeight)
    const pixelsPerDie = diePixelWidth * diePixelHeight
    const totalDiePixels = diePositions.length * pixelsPerDie

    console.log(
      `Die像素容量: ${diePositions.length} Dies × ${diePixelWidth}×${diePixelHeight}px = ${totalDiePixels} 最大像素点`
    )

    // 计算目标渲染点数
    // 取像素容量和配置上限中的较小值
    const maxRenderPoints = Math.min(totalDiePixels, PERFORMANCE_THRESHOLDS.MAX_RENDER_POINTS)

    // 如果数据量超过目标渲染点数，进行预采样
    let samplesToProcess = defects
    let preSamplingRate = 1.0

    if (enableDecimation && defects.length > maxRenderPoints) {
      // 目标：最大渲染点数的 80%（考虑到后续像素去重）
      preSamplingRate = (maxRenderPoints * 0.8) / defects.length
      const targetCount = Math.ceil(defects.length * preSamplingRate)
      const step = Math.max(1, Math.floor(defects.length / targetCount))

      samplesToProcess = []
      for (let i = 0; i < defects.length && samplesToProcess.length < targetCount; i += step) {
        samplesToProcess.push(defects[i])
      }

      console.log(
        `预采样: ${defects.length} -> ${samplesToProcess.length} (目标: ${maxRenderPoints}, 比例: ${(preSamplingRate * 100).toFixed(1)}%)`
      )
    }

    // 使用像素网格进行精确去重
    // 同一像素位置只保留一个点
    const pixelGrid = new Map<string, ProcessedDefect>()
    let skipped = 0
    let culled = 0
    let duplicatePixels = 0

    samplesToProcess.forEach(defect => {
      // 找到对应的 Die
      const dieKey = `${defect.dieRow},${defect.dieCol}`
      const die = dieMap.get(dieKey)

      if (!die) {
        skipped++
        return
      }

      // 计算缺陷在画布上的位置
      const defectX = die.canvasX + defect.x * dieWidth
      const defectY = die.canvasY + defect.y * dieHeight

      // 视口裁剪
      if (enableCulling) {
        const margin = 50
        if (
          defectX < viewport.minX - margin ||
          defectX > viewport.maxX + margin ||
          defectY < viewport.minY - margin ||
          defectY > viewport.maxY + margin
        ) {
          culled++
          return
        }
      }

      // 基于像素的精确去重：将坐标取整到像素
      const pixelX = Math.round(defectX)
      const pixelY = Math.round(defectY)
      const pixelKey = `${pixelX},${pixelY}`

      // 如果这个像素位置已经有点了，跳过
      if (pixelGrid.has(pixelKey)) {
        duplicatePixels++
        return
      }

      // 获取颜色和大小
      const color =
        DEFAULT_RENDER_CONFIG.defectColors?.[defect.type] ||
        DEFAULT_RENDER_CONFIG.defectColors?.default ||
        '#FF0000'
      const size = (defect.size || DEFAULT_RENDER_CONFIG.defectSize) * scale

      // 存储到像素网格
      pixelGrid.set(pixelKey, { x: pixelX, y: pixelY, size, color })
    })

    // 按颜色分组
    const defectsByColor = new Map<string, ProcessedDefect[]>()
    pixelGrid.forEach(defect => {
      if (!defectsByColor.has(defect.color)) {
        defectsByColor.set(defect.color, [])
      }
      defectsByColor.get(defect.color)!.push(defect)
    })

    const processingTime = performance.now() - startTime
    const rendered = pixelGrid.size

    // 更新统计
    defectStats.value = {
      total: defects.length,
      rendered,
      skipped: skipped + duplicatePixels
    }

    // 详细的统计信息
    const efficiency = ((rendered / totalDiePixels) * 100).toFixed(1)
    console.log(
      `多维度智能抽稀:\n` +
        `  原始数据: ${defects.length}\n` +
        `  预采样: ${samplesToProcess.length} (${(preSamplingRate * 100).toFixed(1)}%)\n` +
        `  像素去重: ${rendered} 个唯一像素点\n` +
        `  重复像素: ${duplicatePixels}\n` +
        `  视口裁剪: ${culled}\n` +
        `  无效Die: ${skipped}\n` +
        `  像素容量: ${totalDiePixels} (利用率 ${efficiency}%)\n` +
        `  处理时间: ${processingTime.toFixed(2)}ms`
    )

    return defectsByColor
  }

  /**
   * 渲染缺陷层
   */
  const renderDefects = (
    layer: LayerContext,
    defects: Defect[],
    diePositions: DiePosition[],
    viewport: Viewport,
    scale: number,
    dieWidth: number,
    dieHeight: number,
    enableCulling: boolean,
    enableDecimation: boolean
  ) => {
    const { canvas, ctx } = layer

    // 清空
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (defects.length === 0) return

    // 处理缺陷数据
    const defectsByColor = processDefects(
      defects,
      diePositions,
      viewport,
      scale,
      dieWidth,
      dieHeight,
      enableCulling,
      enableDecimation
    )

    // 批量渲染（按颜色）
    defectsByColor.forEach((defectList, color) => {
      ctx.fillStyle = color

      // 对于小点（< 1px），使用 fillRect 性能更好
      if (defectList.length > 0 && defectList[0].size <= 1) {
        defectList.forEach(({ x, y, size }) => {
          // 使用矩形代替圆形，性能提升 3-5 倍
          const halfSize = size
          ctx.fillRect(x - halfSize, y - halfSize, size * 2, size * 2)
        })
      } else {
        // 大点使用圆形
        defectList.forEach(({ x, y, size }) => {
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        })
      }
    })
  }

  return {
    defectStats,
    renderDefects,
    processDefects
  }
}
