/**
 * VChart 数据处理 Hook
 * 负责数据转换和采样
 */

import { computed } from 'vue'
import type { Ref } from 'vue'
import type { VChartScatterDataPoint } from '../types'

export interface UseVChartDataOptions {
  data: Ref<VChartScatterDataPoint[]>
  enableSampling?: boolean
  samplingThreshold?: number
}

export function useVChartData(options: UseVChartDataOptions) {
  const {
    data,
    enableSampling = true,
    samplingThreshold = 100000
  } = options

  /**
   * 采样数据
   */
  const sampledData = computed(() => {
    const originalData = data.value
    
    // 如果不启用采样或数据量小于阈值，直接返回原始数据
    if (!enableSampling || originalData.length <= samplingThreshold) {
      return originalData
    }

    // 均匀采样
    const sampleRate = samplingThreshold / originalData.length
    const sampled: VChartScatterDataPoint[] = []
    
    for (let i = 0; i < originalData.length; i++) {
      if (Math.random() < sampleRate) {
        sampled.push(originalData[i])
      }
    }

    console.log(`📊 数据采样: ${originalData.length} → ${sampled.length} (${(sampleRate * 100).toFixed(1)}%)`)
    
    return sampled
  })

  /**
   * 转换为 VChart 格式
   */
  const chartData = computed(() => {
    return sampledData.value.map(point => ({
      x: point.x,
      y: point.y,
      size: point.value || 10,
      name: point.name || '',
      category: point.category || 'default'
    }))
  })

  /**
   * 获取统计信息
   */
  const getStats = () => {
    return {
      originalCount: data.value.length,
      sampledCount: sampledData.value.length,
      samplingRate: data.value.length > 0 
        ? (sampledData.value.length / data.value.length * 100).toFixed(1) + '%'
        : '100%'
    }
  }

  return {
    chartData,
    sampledData,
    getStats
  }
}
