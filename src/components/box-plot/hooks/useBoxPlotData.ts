/**
 * 箱线图数据处理 Hook
 * 负责统计计算、数据转换、分片管理
 */

import { computed } from 'vue'
import type { Ref } from 'vue'
import type { BoxPlotDataPoint, BoxPlotStatistics } from '../types'
import { useBoxPlotSampling } from './useBoxPlotSampling'

export interface UseBoxPlotDataOptions {
  data: Ref<BoxPlotDataPoint[]>
  enableMultiSeries?: Ref<boolean> | boolean
  enableSampling?: Ref<boolean> | boolean
  samplingThreshold?: number
  samplingRate?: number
  boxColor: string
  outlierColor: string
  showOutliers: boolean
}

export function useBoxPlotData(options: UseBoxPlotDataOptions) {
  const {
    data,
    enableMultiSeries,
    enableSampling,
    samplingThreshold = 1000,
    samplingRate = 0.1,
    boxColor,
    outlierColor,
    showOutliers
  } = options

  // 使用采样 Hook
  const { getSampledData, getSamplingStats: getSamplingStatsInternal } = useBoxPlotSampling({
    data,
    enableSampling,
    samplingThreshold,
    samplingRate
  })

  // 获取采样后的数据
  const sampledData = computed(() => getSampledData())

  // 处理可能是 Ref 的 enableMultiSeries
  const enableMultiSeriesValue = computed(() => {
    return typeof enableMultiSeries === 'object' && 'value' in enableMultiSeries
      ? enableMultiSeries.value
      : (enableMultiSeries ?? false)
  })

  /**
   * 计算箱线图统计数据
   */
  const calculateStatistics = (values: number[]): BoxPlotStatistics => {
    if (values.length === 0) {
      return {
        min: 0,
        q1: 0,
        median: 0,
        q3: 0,
        max: 0,
        outliers: []
      }
    }

    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length

    // 计算四分位数
    const q1Index = Math.floor(n * 0.25)
    const medianIndex = Math.floor(n * 0.5)
    const q3Index = Math.floor(n * 0.75)

    const q1 = sorted[q1Index]
    const median = sorted[medianIndex]
    const q3 = sorted[q3Index]

    // 计算 IQR (四分位距)
    const iqr = q3 - q1

    // 计算异常值边界
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr

    // 找出异常值
    const outliers = sorted.filter(v => v < lowerBound || v > upperBound)

    // 计算箱线图的最小值和最大值（排除异常值）
    const normalValues = sorted.filter(v => v >= lowerBound && v <= upperBound)
    const min = normalValues.length > 0 ? normalValues[0] : sorted[0]
    const max = normalValues.length > 0 ? normalValues[normalValues.length - 1] : sorted[sorted.length - 1]

    return {
      min,
      q1,
      median,
      q3,
      max,
      outliers
    }
  }

  /**
   * 处理所有数据，计算统计信息（使用采样后的数据）
   */
  const processedData = computed(() => {
    return sampledData.value.map(item => {
      const stats = calculateStatistics(item.values)
      return {
        category: item.category,
        statistics: stats,
        rawValues: item.values
      }
    })
  })

  /**
   * 转换为 ECharts 箱线图格式
   */
  const transformToBoxPlotData = () => {
    return processedData.value.map(item => {
      const { min, q1, median, q3, max } = item.statistics
      return {
        value: [min, q1, median, q3, max],
        name: item.category
      }
    })
  }

  /**
   * 转换异常值数据
   */
  const transformOutliers = () => {
    if (!showOutliers) return []

    const outlierData: Array<{ value: [number, number]; name: string }> = []
    
    processedData.value.forEach((item, categoryIndex) => {
      item.statistics.outliers.forEach(outlier => {
        outlierData.push({
          value: [categoryIndex, outlier],
          name: item.category
        })
      })
    })

    return outlierData
  }

  /**
   * 分成多个 series 或单个 series
   */
  const splitIntoSeries = () => {
    const boxPlotData = transformToBoxPlotData()
    const outlierData = transformOutliers()
    const seriesArray: unknown[] = []

    const samplingStats = getSamplingStatsInternal()
    
    console.log('📊 箱线图数据处理信息:')
    console.log(`  原始分类数量: ${data.value.length}`)
    console.log(`  采样后分类数量: ${sampledData.value.length}`)
    if (samplingStats.enabled) {
      console.log(`  采样减少率: ${samplingStats.reductionRate.toFixed(1)}%`)
    }
    console.log(`  总数据点: ${sampledData.value.reduce((sum, item) => sum + item.values.length, 0)}`)
    console.log(`  异常值数量: ${outlierData.length}`)

    if (enableMultiSeriesValue.value) {
      // 每个分类一个 series（使用采样后的数据）
      sampledData.value.forEach((item, index) => {
        const stats = processedData.value[index].statistics
        seriesArray.push({
          type: 'boxplot',
          name: item.category,
          data: [[stats.min, stats.q1, stats.median, stats.q3, stats.max]],
          itemStyle: {
            color: boxColor
          },
          tooltip: {
            formatter: (params: { data: number[] }) => {
              const [min, q1, median, q3, max] = params.data
              return `
                ${item.category}<br/>
                最大值: ${max.toFixed(2)}<br/>
                上四分位: ${q3.toFixed(2)}<br/>
                中位数: ${median.toFixed(2)}<br/>
                下四分位: ${q1.toFixed(2)}<br/>
                最小值: ${min.toFixed(2)}
              `
            }
          }
        })
      })
      console.log(`  Series 数量: ${seriesArray.length} 个（每个分类一个 series）`)
    } else {
      // 单个 series 包含所有分类
      seriesArray.push({
        type: 'boxplot',
        name: '箱线图',
        data: boxPlotData,
        itemStyle: {
          color: boxColor
        }
      })
      console.log(`  Series 数量: 1 个（包含所有分类）`)
    }

    // 添加异常值 series
    if (showOutliers && outlierData.length > 0) {
      seriesArray.push({
        type: 'scatter',
        name: '异常值',
        data: outlierData,
        itemStyle: {
          color: outlierColor
        },
        symbolSize: 6
      })
      console.log(`  异常值 Series: 1 个`)
    }

    console.log('---')
    return seriesArray
  }

  /**
   * 获取统计信息
   */
  const getStatistics = () => {
    return processedData.value.map(item => ({
      category: item.category,
      statistics: item.statistics
    }))
  }

  return {
    processedData,
    splitIntoSeries,
    getStatistics,
    calculateStatistics,
    getSamplingStats: getSamplingStatsInternal
  }
}
