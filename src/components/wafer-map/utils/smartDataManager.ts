/**
 * 智能数据管理器
 * 根据缩放级别和视口范围，智能选择要渲染的数据
 *
 * 策略：
 * 1. 全局视图（zoom < 1.5）：显示抽稀的全局概览数据
 * 2. 局部视图（zoom >= 1.5）：只显示可见区域的详细数据
 */

import type { Defect } from '../types'

export interface Viewport {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
}

export interface SmartDataConfig {
  zoom: number
  viewport: Viewport
  totalDataCount: number
  canvasSize: number
}

/**
 * 判断是否应该使用局部详细模式
 */
export function shouldUseLocalDetailMode(zoom: number): boolean {
  return zoom >= 1.5
}

/**
 * 计算全局概览模式的采样率
 */
export function calculateGlobalSamplingRate(dataCount: number, zoom: number): number {
  if (dataCount < 10000) {
    return 1.0 // 小数据量，全部显示
  }

  // 根据缩放级别和数据量动态调整
  if (zoom >= 1.0) {
    // 正常视图
    if (dataCount < 50000) return 0.5
    if (dataCount < 100000) return 0.3
    if (dataCount < 500000) return 0.2
    return 0.1
  } else {
    // 缩小视图
    if (dataCount < 50000) return 0.3
    if (dataCount < 100000) return 0.2
    if (dataCount < 500000) return 0.1
    return 0.05
  }
}

/**
 * 全局概览模式：均匀抽稀全部数据
 */
export function selectGlobalOverviewData(defects: Defect[], samplingRate: number): Defect[] {
  if (samplingRate >= 1.0) {
    return defects
  }

  const targetCount = Math.ceil(defects.length * samplingRate)
  const step = defects.length / targetCount
  const result: Defect[] = []

  for (let i = 0; i < targetCount; i++) {
    const index = Math.floor(i * step)
    result.push(defects[index])
  }

  return result
}

/**
 * 局部详细模式：只选择视口内的数据（全部显示，不抽稀）
 */
export function selectLocalDetailData(
  defects: Defect[],
  viewport: Viewport,
  diePositions: Map<string, { canvasX: number; canvasY: number }>,
  dieWidth: number,
  dieHeight: number
): Defect[] {
  const result: Defect[] = []
  const margin = 100 // 视口边缘留一些余量

  defects.forEach(defect => {
    const dieKey = `${defect.dieRow},${defect.dieCol}`
    const die = diePositions.get(dieKey)

    if (!die) return

    // 计算缺陷在画布上的位置
    const defectX = die.canvasX + defect.x * dieWidth
    const defectY = die.canvasY + defect.y * dieHeight

    // 只保留视口内的数据
    if (
      defectX >= viewport.minX - margin &&
      defectX <= viewport.maxX + margin &&
      defectY >= viewport.minY - margin &&
      defectY <= viewport.maxY + margin
    ) {
      result.push(defect)
    }
  })

  return result
}

/**
 * 智能选择要渲染的数据
 * 这是核心函数，根据缩放和视口自动选择最优策略
 */
export function smartSelectRenderData(
  defects: Defect[],
  config: SmartDataConfig,
  diePositions: Map<string, { canvasX: number; canvasY: number }>,
  dieWidth: number,
  dieHeight: number
): {
  data: Defect[]
  mode: 'global-overview' | 'local-detail'
  samplingRate: number
  info: string
} {
  const { zoom, viewport, totalDataCount } = config

  // 判断使用哪种模式
  if (shouldUseLocalDetailMode(zoom)) {
    // 局部详细模式：只显示可见区域的全部数据
    const localData = selectLocalDetailData(defects, viewport, diePositions, dieWidth, dieHeight)

    return {
      data: localData,
      mode: 'local-detail',
      samplingRate: 1.0,
      info: `局部详细模式: 显示 ${localData.length}/${totalDataCount} 个点 (视口内 100%)`
    }
  } else {
    // 全局概览模式：显示抽稀的全局数据
    const samplingRate = calculateGlobalSamplingRate(totalDataCount, zoom)
    const globalData = selectGlobalOverviewData(defects, samplingRate)

    return {
      data: globalData,
      mode: 'global-overview',
      samplingRate,
      info: `全局概览模式: 显示 ${globalData.length}/${totalDataCount} 个点 (采样率 ${(samplingRate * 100).toFixed(1)}%)`
    }
  }
}

/**
 * 计算视口（考虑平移和缩放）
 */
export function calculateSmartViewport(
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  translateX: number,
  translateY: number
): Viewport {
  // 视口的实际大小（考虑缩放）
  const viewportWidth = canvasWidth / zoom
  const viewportHeight = canvasHeight / zoom

  // 视口中心（考虑平移）
  // 平移是在画布坐标系中的，需要转换到世界坐标系
  const centerX = (canvasWidth / 2 - translateX) / zoom
  const centerY = (canvasHeight / 2 - translateY) / zoom

  return {
    minX: centerX - viewportWidth / 2,
    maxX: centerX + viewportWidth / 2,
    minY: centerY - viewportHeight / 2,
    maxY: centerY + viewportHeight / 2,
    width: viewportWidth,
    height: viewportHeight
  }
}
