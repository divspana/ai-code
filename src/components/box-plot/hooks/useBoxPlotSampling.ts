/**
 * 箱线图数据采样 Hook
 * 用于处理大量分类的场景（1万-10万分类）
 */

import { computed } from 'vue'
import type { Ref } from 'vue'
import type { BoxPlotDataPoint } from '../types'

export interface UseBoxPlotSamplingOptions {
  data: Ref<BoxPlotDataPoint[]>
  enableSampling?: Ref<boolean> | boolean
  samplingThreshold?: number // 分类数量阈值
  samplingRate?: number // 采样率（0-1）
}

export interface SamplingResult {
  sampledData: BoxPlotDataPoint[]
  originalIndices: number[]
  originalCount: number
  sampledCount: number
  reductionRate: number
}

export function useBoxPlotSampling(options: UseBoxPlotSamplingOptions) {
  const {
    data,
    enableSampling = true,
    samplingThreshold = 1000,
    samplingRate = 0.1 // 默认采样10%
  } = options

  // 处理可能是 Ref 的 enableSampling
  const enableSamplingValue = computed(() => {
    const val = enableSampling
    return typeof val === 'object' && 'value' in val ? val.value : (val ?? true)
  })

  // 缓存
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

    // 检查缓存
    if (cachedResult && 
        cachedDataLength === originalCount && 
        cachedEnableSampling === currentEnableSampling) {
      console.log('🔄 使用缓存的采样结果')
      return cachedResult
    }

    console.log('📊 箱线图采样配置:', {
      enableSampling: currentEnableSampling,
      samplingThreshold,
      originalCount,
      shouldSample: currentEnableSampling && originalCount >= samplingThreshold
    })

    // 如果禁用采样或数据量小于阈值，直接返回原始数据
    if (!currentEnableSampling || originalCount < samplingThreshold) {
      console.log('⏭️  跳过采样（采样未启用或分类数量小于阈值）')
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

    // 计算采样数量
    const targetCount = Math.max(
      Math.floor(originalCount * samplingRate),
      100 // 至少保留100个分类
    )

    // 均匀采样
    const step = originalCount / targetCount
    const sampledData: BoxPlotDataPoint[] = []
    const originalIndices: number[] = []

    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step)
      if (index < originalCount) {
        sampledData.push(originalData[index])
        originalIndices.push(index)
      }
    }

    const sampledCount = sampledData.length
    const reductionRate = ((originalCount - sampledCount) / originalCount) * 100

    console.log('✨ 采样完成:', {
      原始分类: originalCount,
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
