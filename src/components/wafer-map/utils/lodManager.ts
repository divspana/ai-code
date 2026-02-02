/**
 * LOD (Level of Detail) 管理器
 * 根据缩放级别动态调整显示的数据密度
 */

import type { Defect } from '../types'

export interface LODConfig {
  minZoom: number // 最小缩放级别
  maxZoom: number // 最大缩放级别
  lodLevels: number // LOD 级别数量
}

export interface LODLevel {
  zoom: number // 缩放级别
  samplingRate: number // 采样率（0-1）
  description: string // 描述
}

/**
 * 计算 LOD 级别
 */
export function calculateLODLevel(zoom: number, dataCount: number): number {
  // 根据数据量和缩放级别计算 LOD 级别
  // 数据越多，需要更激进的抽稀

  if (dataCount < 10000) {
    // 小数据量，不需要 LOD
    return 0
  }

  if (zoom >= 2) {
    // 放大 2 倍以上，显示全部细节
    return 0
  } else if (zoom >= 1.5) {
    // 放大 1.5-2 倍，显示 75% 数据
    return 1
  } else if (zoom >= 1.2) {
    // 放大 1.2-1.5 倍，显示 50% 数据
    return 2
  } else if (zoom >= 1.0) {
    // 正常缩放，显示 25% 数据
    return 3
  } else {
    // 缩小，显示 10% 数据
    return 4
  }
}

/**
 * 获取 LOD 级别的采样率
 */
export function getSamplingRate(lodLevel: number): number {
  const samplingRates = [1.0, 0.75, 0.5, 0.25, 0.1]
  return samplingRates[Math.min(lodLevel, samplingRates.length - 1)]
}

/**
 * 获取 LOD 级别描述
 */
export function getLODDescription(lodLevel: number): string {
  const descriptions = [
    '全部细节',
    '高细节 (75%)',
    '中等细节 (50%)',
    '低细节 (25%)',
    '最低细节 (10%)'
  ]
  return descriptions[Math.min(lodLevel, descriptions.length - 1)]
}

/**
 * 对数据进行空间哈希抽稀
 * 使用空间哈希确保抽稀后的数据分布均匀
 */
export function spatialHashSampling(
  defects: Defect[],
  samplingRate: number,
  gridSize: number = 10
): Defect[] {
  if (samplingRate >= 1.0) {
    return defects
  }

  // 使用空间哈希网格
  const grid = new Map<string, Defect[]>()

  // 将缺陷分配到网格中
  defects.forEach(defect => {
    const gridX = Math.floor(defect.dieRow / gridSize)
    const gridY = Math.floor(defect.dieCol / gridSize)
    const key = `${gridX},${gridY}`

    if (!grid.has(key)) {
      grid.set(key, [])
    }
    grid.get(key)!.push(defect)
  })

  // 从每个网格中按比例采样
  const sampled: Defect[] = []
  grid.forEach(cellDefects => {
    const sampleCount = Math.max(1, Math.ceil(cellDefects.length * samplingRate))

    // 均匀采样
    const step = cellDefects.length / sampleCount
    for (let i = 0; i < sampleCount; i++) {
      const index = Math.floor(i * step)
      sampled.push(cellDefects[index])
    }
  })

  return sampled
}

/**
 * 简单随机抽稀（备用方案）
 */
export function randomSampling(defects: Defect[], samplingRate: number): Defect[] {
  if (samplingRate >= 1.0) {
    return defects
  }

  const sampleCount = Math.ceil(defects.length * samplingRate)
  const sampled: Defect[] = []
  const step = defects.length / sampleCount

  for (let i = 0; i < sampleCount; i++) {
    const index = Math.floor(i * step)
    sampled.push(defects[index])
  }

  return sampled
}

/**
 * 基于视口的抽稀
 * 视口内的数据保持高密度，视口外的数据低密度
 */
export function viewportBasedSampling(
  defects: Defect[],
  viewport: { minX: number; maxX: number; minY: number; maxY: number },
  insideSamplingRate: number,
  outsideSamplingRate: number
): Defect[] {
  const insideDefects: Defect[] = []
  const outsideDefects: Defect[] = []

  // 分类：视口内和视口外
  defects.forEach(defect => {
    const isInside =
      defect.dieRow >= viewport.minX &&
      defect.dieRow <= viewport.maxX &&
      defect.dieCol >= viewport.minY &&
      defect.dieCol <= viewport.maxY

    if (isInside) {
      insideDefects.push(defect)
    } else {
      outsideDefects.push(defect)
    }
  })

  // 分别采样
  const sampledInside = randomSampling(insideDefects, insideSamplingRate)
  const sampledOutside = randomSampling(outsideDefects, outsideSamplingRate)

  return [...sampledInside, ...sampledOutside]
}

/**
 * 智能 LOD 采样
 * 结合空间哈希和视口优化
 */
export function smartLODSampling(
  defects: Defect[],
  lodLevel: number,
  viewport?: { minX: number; maxX: number; minY: number; maxY: number }
): Defect[] {
  const samplingRate = getSamplingRate(lodLevel)

  if (samplingRate >= 1.0) {
    return defects
  }

  // 如果有视口信息，使用视口优化
  if (viewport) {
    return viewportBasedSampling(defects, viewport, samplingRate, samplingRate * 0.5)
  }

  // 否则使用空间哈希采样
  return spatialHashSampling(defects, samplingRate)
}
