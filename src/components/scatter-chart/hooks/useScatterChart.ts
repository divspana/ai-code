/**
 * 散点图组合 Hook
 * 组合所有子 hooks，提供统一的接口
 */

import { watch } from 'vue'
import type { Ref } from 'vue'
import type { ScatterDataPoint } from '../types'
import { useChartData } from './useChartData'
import { useChartVisibility } from './useChartVisibility'
import { useChartOptions } from './useChartOptions'
import { useChartInstance } from './useChartInstance'

export interface UseScatterChartParams {
  // 数据
  data: Ref<ScatterDataPoint[]>
  
  // DOM 引用
  chartRef: Ref<HTMLElement | null>
  containerRef: Ref<HTMLElement | null>
  
  // 样式配置
  color: string
  selectedColor: string
  unselectedColor: string
  symbolSize: number | ((data: any) => number)
  
  // 功能配置
  title?: string
  enableZoom: Ref<boolean> | boolean
  enableBrush: Ref<boolean> | boolean
  enableSampling: Ref<boolean> | boolean
  enableMultiSeries: Ref<boolean> | boolean
  enableLargeMode: boolean
  largeThreshold: number
  
  // 懒加载配置
  lazyLoad: boolean
  rootMargin?: string
  threshold?: number
  
  // 事件回调
  onBrushSelected?: (data: ScatterDataPoint[]) => void
  onBrushEnd?: (data: ScatterDataPoint[]) => void
  onVisible?: (visible: boolean) => void
  onChartReady?: () => void
  onRenderStats?: (stats: {
    totalCount: number
    renderedCount: number
    seriesCount: number
    reductionRate: number
  }) => void
}

export function useScatterChart(params: UseScatterChartParams) {
  const {
    data,
    chartRef,
    containerRef,
    color,
    selectedColor,
    unselectedColor,
    symbolSize,
    title,
    enableZoom,
    enableBrush,
    enableSampling,
    enableMultiSeries,
    enableLargeMode,
    largeThreshold,
    lazyLoad,
    rootMargin,
    threshold,
    onBrushSelected,
    onBrushEnd,
    onVisible,
    onChartReady,
    onRenderStats
  } = params

  // 1. 数据处理 Hook
  const chartDataHook = useChartData({
    data,
    color,
    selectedColor,
    unselectedColor,
    seriesChunkSize: 10000,
    enableSampling,
    enableMultiSeries,
    samplingThreshold: 50000,
    keepStrategy: 'first'
  })

  const {
    hasSelection,
    splitIntoSeries,
    handleBrushSelection,
    clearSelection: clearDataSelection,
    getSelectedData,
    getSamplingStats
  } = chartDataHook

  // 2. 配置生成 Hook
  const chartOptionsHook = useChartOptions({
    title,
    enableZoom,
    enableBrush,
    enableLargeMode,
    largeThreshold,
    splitIntoSeries,
    symbolSize
  })

  const { getChartOption } = chartOptionsHook

  // 3. 实例管理 Hook
  const chartInstanceHook = useChartInstance({
    chartRef,
    lazyLoad,
    getChartOption,
    onBrushSelected: (brushComponent: any) => {
      const selectedData = handleBrushSelection(brushComponent)
      if (onBrushSelected) {
        onBrushSelected(selectedData)
      }
      return selectedData
    },
    onChartReady,
    onRenderStats
  })

  const {
    isChartReady,
    initChart: initChartInternal,
    updateChart,
    clearSelection: clearChartSelection,
    resetChart
  } = chartInstanceHook

  // 包装 initChart，确保总是传递数据信息
  const initChart = () => {
    initChartInternal({
      totalCount: data.value.length,
      data: data.value
    })
  }

  // 4. 可见性检测 Hook
  const { isVisible } = useChartVisibility({
    containerRef,
    enabled: lazyLoad,
    rootMargin,
    threshold,
    onVisible: (visible) => {
      if (onVisible) {
        onVisible(visible)
      }
      if (visible && !isChartReady.value) {
        initChart()
      }
    }
  })

  // 监听数据变化
  watch(
    () => data.value,
    (newData, oldData) => {
      if (isChartReady.value && newData !== oldData) {
        updateChart({
          totalCount: newData.length,
          data: newData
        })
      }
    }
  )

  /**
   * 清除选择（组合两个清除操作）
   */
  const clearSelection = () => {
    clearDataSelection()
    clearChartSelection()
    updateChart({
      totalCount: data.value.length,
      data: data.value
    })
  }

  // 框选结束处理已集成到 useChartInstance 中

  return {
    // 状态
    isChartReady,
    isVisible,
    hasSelection,
    
    // 方法
    clearSelection,
    resetChart,
    getSelectedData,
    getSamplingStats,
    
    // 内部方法（供高级使用）
    initChart,
    updateChart
  }
}
