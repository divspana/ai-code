/**
 * 图表数据处理 Hook
 * 负责数据分片、选择状态管理、数据转换
 */

import { ref, computed, isRef } from 'vue'
import type { Ref } from 'vue'
import type { ScatterDataPoint } from '../types'
import { useDataSampling } from './useDataSampling'

export interface UseChartDataOptions {
  data: Ref<ScatterDataPoint[]>
  color: string
  selectedColor: string
  unselectedColor: string
  seriesChunkSize?: number
  enableSampling?: Ref<boolean> | boolean
  enableMultiSeries?: Ref<boolean> | boolean
  gridSize?: number
  samplingThreshold?: number
  keepStrategy?: 'first' | 'last' | 'random' | 'center'
}

export function useChartData(options: UseChartDataOptions) {
  const {
    data,
    color,
    selectedColor,
    unselectedColor,
    seriesChunkSize = 10000,
    gridSize,
    samplingThreshold = 50000,
    keepStrategy = 'center'
  } = options

  // 处理可能是 Ref 的配置
  const enableSampling = isRef(options.enableSampling) ? options.enableSampling : ref(options.enableSampling ?? true)
  const enableMultiSeries = isRef(options.enableMultiSeries) ? options.enableMultiSeries : ref(options.enableMultiSeries ?? true)

  // 选中的数据索引
  const selectedIndices = ref<Set<number>>(new Set())

  // 是否有选择
  const hasSelection = computed(() => selectedIndices.value.size > 0)

  // 使用数据采样
  const { getSampledData, getOriginalIndices, getSamplingStats } = useDataSampling({
    data,
    enableSampling,
    gridSize,
    samplingThreshold,
    keepStrategy
  })

  // 获取处理后的数据（采样后的数据）
  const processedData = computed(() => getSampledData())
  
  // 获取原始索引映射
  const originalIndicesMap = computed(() => getOriginalIndices())

  /**
   * 将数据转换为 ECharts 格式
   * 使用采样后的数据，但保留原始索引用于框选
   */
  const transformData = () => {
    const dataToUse = processedData.value
    const indices = originalIndicesMap.value
    
    return dataToUse.map((point, index) => {
      // 使用预先计算好的原始索引
      const originalIndex = indices[index]
      const isSelected = selectedIndices.value.has(originalIndex)
      
      return {
        value: [point.x, point.y, point.value ?? 0],
        name: point.name,
        originalIndex, // 保存原始索引
        itemStyle: hasSelection.value
          ? {
              color: isSelected ? selectedColor : unselectedColor,
              opacity: isSelected ? 1 : 0.3
            }
          : undefined
      }
    })
  }

  /**
   * 将数据分成多个 series（或单个 series）
   */
  const splitIntoSeries = (symbolSize: number | ((data: unknown) => number)) => {
    const transformedData = transformData()
    const seriesArray: Array<{
      type: string
      data: unknown[]
      symbolSize: number | ((data: unknown) => number)
      itemStyle: { color?: string }
      large: boolean
      largeThreshold: number
      animation: boolean
      silent: boolean
    }> = []

    console.log('📊 数据处理信息:')
    console.log(`  原始数据: ${data.value.length.toLocaleString()} 条`)
    console.log(`  采样后数据: ${transformedData.length.toLocaleString()} 条`)
    if (data.value.length > transformedData.length) {
      const reduction = ((data.value.length - transformedData.length) / data.value.length * 100).toFixed(1)
      console.log(`  减少率: ${reduction}%`)
    }

    if (!enableMultiSeries.value || transformedData.length <= seriesChunkSize) {
      // 不分片或数据量小于阈值，使用单个 series
      seriesArray.push({
        type: 'scatter',
        data: transformedData,
        symbolSize,
        itemStyle: {
          color: hasSelection.value ? undefined : color
        },
        large: true,
        largeThreshold: 2000,
        animation: false,
        silent: false
      })
      console.log(`  Series 数量: 1 个`)
      console.log(`  Series[0]: ${transformedData.length.toLocaleString()} 条数据`)
      console.log(`  前 3 个数据点:`, transformedData.slice(0, 3))
    } else {
      // 分多个 series，每个 seriesChunkSize 条数据
      for (let i = 0; i < transformedData.length; i += seriesChunkSize) {
        const chunk = transformedData.slice(i, i + seriesChunkSize)
        seriesArray.push({
          type: 'scatter',
          data: chunk,
          symbolSize,
          itemStyle: {
            color: hasSelection.value ? undefined : color
          },
          large: true,
          largeThreshold: 2000,
          animation: false,
          silent: false
        })
      }
      console.log(`  Series 数量: ${seriesArray.length} 个`)
      console.log(`  第一个 Series 的前 3 个数据点:`, seriesArray[0].data.slice(0, 3))
      seriesArray.forEach((series, index) => {
        console.log(`  Series[${index}]: ${series.data.length.toLocaleString()} 条数据`)
      })
    }
    console.log('---')

    return seriesArray
  }

  /**
   * 处理框选事件，收集所有 series 中被选中的数据索引
   * 使用原始索引映射，确保能找到原始数据
   */
  const handleBrushSelection = (brushComponent: { 
    selected?: Array<{ dataIndex?: number[] }>
  }) => {
    if (!brushComponent || !brushComponent.selected || brushComponent.selected.length === 0) {
      selectedIndices.value.clear()
      return []
    }

    const allSelectedOriginalIndices = new Set<number>()
    const indices = originalIndicesMap.value

    brushComponent.selected.forEach((seriesSelection, seriesIndex: number) => {
      const dataIndices = seriesSelection.dataIndex || []
      dataIndices.forEach((indexInSeries: number) => {
        // 计算在采样数据中的索引
        const sampledDataIndex = seriesIndex * seriesChunkSize + indexInSeries
        // 通过映射找到原始数据的索引
        const originalIndex = indices[sampledDataIndex]
        if (originalIndex !== undefined) {
          allSelectedOriginalIndices.add(originalIndex)
        }
      })
    })

    selectedIndices.value = allSelectedOriginalIndices

    // 返回原始数据中被选中的点
    return Array.from(allSelectedOriginalIndices).map(index => data.value[index])
  }

  /**
   * 清除选择
   */
  const clearSelection = (): void => {
    selectedIndices.value.clear()
  }

  /**
   * 获取选中的数据
   */
  const getSelectedData = () => {
    return Array.from(selectedIndices.value).map(index => data.value[index])
  }

  return {
    selectedIndices,
    hasSelection,
    transformData,
    splitIntoSeries,
    handleBrushSelection,
    clearSelection,
    getSelectedData,
    getSamplingStats,
    processedData
  }
}
