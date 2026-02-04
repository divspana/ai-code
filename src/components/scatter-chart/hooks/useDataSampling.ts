/**
 * 数据采样 Hook
 * 使用网格算法过滤重叠点，减少渲染数据量
 */

import { computed } from 'vue'
import type { Ref } from 'vue'
import type { ScatterDataPoint } from '../types'

export interface UseDataSamplingOptions {
  data: Ref<ScatterDataPoint[]>
  enableSampling?: Ref<boolean> | boolean
  gridSize?: number // 网格大小（像素）
  samplingThreshold?: number // 启用采样的数据量阈值
  keepStrategy?: 'first' | 'last' | 'random' | 'center' // 网格内保留策略
}

export interface SamplingResult {
  sampledData: ScatterDataPoint[]
  originalIndices: number[] // 采样点在原始数据中的索引
  originalCount: number
  sampledCount: number
  reductionRate: number
}

/**
 * 计算数据的边界
 */
function calculateBounds(data: ScatterDataPoint[]) {
  if (data.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  data.forEach(point => {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  })

  return { minX, maxX, minY, maxY }
}

/**
 * 网格采样算法（优化版）
 * 将数据空间划分为网格，每个网格只保留一个点
 * 返回采样后的数据和原始索引
 */
function gridSampling(
  data: ScatterDataPoint[],
  gridSize: number,
  keepStrategy: 'first' | 'last' | 'random' | 'center'
): { sampledData: ScatterDataPoint[]; originalIndices: number[] } {
  if (data.length === 0) return { sampledData: [], originalIndices: [] }

  const bounds = calculateBounds(data)
  const gridMap = new Map<string, { point: ScatterDataPoint; index: number }>()

  // 优化：根据策略直接选择，不存储所有点
  if (keepStrategy === 'first') {
    // 只保留第一个点，不需要存储数组
    data.forEach((point, index) => {
      const gridX = Math.floor((point.x - bounds.minX) / gridSize)
      const gridY = Math.floor((point.y - bounds.minY) / gridSize)
      const gridKey = `${gridX},${gridY}`

      if (!gridMap.has(gridKey)) {
        gridMap.set(gridKey, { point, index })
      }
    })
  } else if (keepStrategy === 'last') {
    // 直接覆盖，最后一个会保留
    data.forEach((point, index) => {
      const gridX = Math.floor((point.x - bounds.minX) / gridSize)
      const gridY = Math.floor((point.y - bounds.minY) / gridSize)
      const gridKey = `${gridX},${gridY}`
      gridMap.set(gridKey, { point, index })
    })
  } else {
    // random 和 center 策略需要存储多个点
    const gridArrayMap = new Map<string, Array<{ point: ScatterDataPoint; index: number }>>()
    
    data.forEach((point, index) => {
      const gridX = Math.floor((point.x - bounds.minX) / gridSize)
      const gridY = Math.floor((point.y - bounds.minY) / gridSize)
      const gridKey = `${gridX},${gridY}`

      if (!gridArrayMap.has(gridKey)) {
        gridArrayMap.set(gridKey, [])
      }
      gridArrayMap.get(gridKey)!.push({ point, index })
    })

    // 从每个网格中选择一个点
    gridArrayMap.forEach((items, key) => {
      let selectedItem: { point: ScatterDataPoint; index: number }

      if (keepStrategy === 'random') {
        selectedItem = items[Math.floor(Math.random() * items.length)]
      } else {
        // center 策略
        if (items.length === 1) {
          selectedItem = items[0]
        } else {
          const centerX = items.reduce((sum, item) => sum + item.point.x, 0) / items.length
          const centerY = items.reduce((sum, item) => sum + item.point.y, 0) / items.length
          selectedItem = items.reduce((closest, current) => {
            const closestDist = Math.hypot(closest.point.x - centerX, closest.point.y - centerY)
            const currentDist = Math.hypot(current.point.x - centerX, current.point.y - centerY)
            return currentDist < closestDist ? current : closest
          })
        }
      }

      gridMap.set(key, selectedItem)
    })
  }

  const result = Array.from(gridMap.values())
  return {
    sampledData: result.map(item => item.point),
    originalIndices: result.map(item => item.index)
  }
}

/**
 * 自适应网格大小
 * 根据数据量和数据范围自动计算合适的网格大小
 */
function calculateAdaptiveGridSize(
  data: ScatterDataPoint[],
  targetCount: number
): number {
  const bounds = calculateBounds(data)
  const dataWidth = bounds.maxX - bounds.minX
  const dataHeight = bounds.maxY - bounds.minY
  const dataArea = dataWidth * dataHeight

  // 计算每个点平均占用的面积
  const avgAreaPerPoint = dataArea / targetCount

  // 网格大小 = sqrt(平均面积)
  const gridSize = Math.sqrt(avgAreaPerPoint)

  return Math.max(gridSize, 1) // 至少为 1
}

export function useDataSampling(options: UseDataSamplingOptions) {
  const {
    data,
    gridSize: fixedGridSize,
    samplingThreshold = 50000,
    keepStrategy = 'center'
  } = options

  // 处理可能是 Ref 的 enableSampling
  const enableSamplingValue = computed(() => {
    const val = options.enableSampling
    return typeof val === 'object' && 'value' in val ? val.value : (val ?? true)
  })

  // 缓存上次的结果，避免重复计算
  let cachedResult: SamplingResult | null = null
  let cachedDataLength = 0
  let cachedEnableSampling = false

  /**
   * 执行数据采样
   */
  const sampleData = computed((): SamplingResult => {
    const originalData = data.value
    const originalCount = originalData.length
    const currentEnableSampling = enableSamplingValue.value

    // 如果数据和配置都没变化，返回缓存结果
    if (cachedResult && 
        cachedDataLength === originalCount && 
        cachedEnableSampling === currentEnableSampling) {
      console.log('🔄 使用缓存的采样结果')
      return cachedResult
    }

    console.log('🔍 采样配置:', {
      enableSampling: enableSamplingValue.value,
      samplingThreshold,
      originalCount,
      shouldSample: enableSamplingValue.value && originalCount >= samplingThreshold
    })

    // 如果禁用采样或数据量小于阈值，直接返回原始数据
    if (!enableSamplingValue.value || originalCount < samplingThreshold) {
      console.log('⏭️  跳过采样（采样未启用或数据量小于阈值）')
      const result = {
        sampledData: originalData,
        originalIndices: originalData.map((_, index) => index),
        originalCount,
        sampledCount: originalCount,
        reductionRate: 0
      }
      cachedResult = result
      cachedDataLength = originalCount
      cachedEnableSampling = currentEnableSampling
      return result
    }

    console.log('✅ 开始执行采样...')

    // 计算网格大小
    let gridSize = fixedGridSize
    if (!gridSize) {
      // 自适应网格大小：目标是保留95%的数据，只去除严重重叠的点
      const targetCount = Math.floor(originalCount * 0.95)
      gridSize = calculateAdaptiveGridSize(originalData, targetCount)
      // 设置最小网格大小，避免过度采样
      gridSize = Math.max(gridSize, 2)
    }

    // 执行网格采样
    const { sampledData, originalIndices } = gridSampling(originalData, gridSize, keepStrategy)
    const sampledCount = sampledData.length
    const reductionRate = ((originalCount - sampledCount) / originalCount) * 100

    console.log('✨ 采样完成:', {
      gridSize: gridSize.toFixed(2),
      原始数据: originalCount,
      采样后: sampledCount,
      减少率: `${reductionRate.toFixed(1)}%`
    })

    const result = {
      sampledData,
      originalIndices,
      originalCount,
      sampledCount,
      reductionRate
    }
    
    // 缓存结果
    cachedResult = result
    cachedDataLength = originalCount
    cachedEnableSampling = currentEnableSampling
    
    return result
  })

  /**
   * 获取采样后的数据
   */
  const getSampledData = () => sampleData.value.sampledData

  /**
   * 获取原始索引映射
   */
  const getOriginalIndices = () => sampleData.value.originalIndices

  /**
   * 获取采样统计信息
   */
  const getSamplingStats = () => ({
    originalCount: sampleData.value.originalCount,
    sampledCount: sampleData.value.sampledCount,
    reductionRate: sampleData.value.reductionRate,
    enabled: enableSamplingValue.value && sampleData.value.originalCount >= samplingThreshold
  })

  return {
    sampleData,
    getSampledData,
    getOriginalIndices,
    getSamplingStats
  }
}
