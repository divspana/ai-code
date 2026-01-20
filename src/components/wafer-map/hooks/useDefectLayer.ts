/**
 * 缺陷层管理 Hook
 * 负责缺陷的渲染和性能优化（视口裁剪、数据抽稀）
 */

import { ref } from 'vue'
import type { Defect, DiePosition, LayerContext, Viewport } from '../types'
import { DEFAULT_RENDER_CONFIG, DECIMATION_RATES, PERFORMANCE_THRESHOLDS } from '../constants'

interface ProcessedDefect {
  x: number
  y: number
  size: number
  color: string
}

export function useDefectLayer() {
  const defectStats = ref({
    total: 0,
    rendered: 0,
    skipped: 0
  })

  /**
   * 计算抽稀级别
   */
  const calculateDecimationLevel = (count: number): number => {
    if (count < PERFORMANCE_THRESHOLDS.SMALL_DATASET) return 0
    if (count < PERFORMANCE_THRESHOLDS.MEDIUM_DATASET) return 1
    if (count < PERFORMANCE_THRESHOLDS.LARGE_DATASET) return 2
    return 3
  }

  /**
   * 处理缺陷数据（视口裁剪 + 抽稀）
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

    // 计算抽稀级别
    const decimationLevel = enableDecimation ? calculateDecimationLevel(defects.length) : 0
    const samplingRate = DECIMATION_RATES[decimationLevel]

    const defectsByColor = new Map<string, ProcessedDefect[]>()
    let rendered = 0
    let skipped = 0

    defects.forEach(defect => {
      // 数据抽稀
      if (enableDecimation && Math.random() > samplingRate) {
        skipped++
        return
      }

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
          skipped++
          return
        }
      }

      // 获取颜色
      const color =
        DEFAULT_RENDER_CONFIG.defectColors?.[defect.type] ||
        DEFAULT_RENDER_CONFIG.defectColors?.default ||
        '#FF0000'
      const size = (defect.size || DEFAULT_RENDER_CONFIG.defectSize) * scale

      // 按颜色分组
      if (!defectsByColor.has(color)) {
        defectsByColor.set(color, [])
      }
      defectsByColor.get(color)!.push({ x: defectX, y: defectY, size, color })
      rendered++
    })

    const processingTime = performance.now() - startTime

    // 更新统计
    defectStats.value = {
      total: defects.length,
      rendered,
      skipped
    }

    console.log(
      `Defects processed: total=${defects.length}, rendered=${rendered}, ` +
        `skipped=${skipped}, time=${processingTime.toFixed(2)}ms, ` +
        `decimation=${decimationLevel}, rate=${(samplingRate * 100).toFixed(0)}%`
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 0.5

      // 使用 Path2D 提升性能
      const path = new Path2D()
      defectList.forEach(({ x, y, size }) => {
        path.arc(x, y, size, 0, Math.PI * 2)
        path.moveTo(x + size, y) // 避免连线
      })

      ctx.fill(path)
      ctx.stroke(path)
    })
  }

  return {
    defectStats,
    renderDefects,
    processDefects
  }
}
