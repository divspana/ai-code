/**
 * 箱线图组合 Hook
 * 组合所有子 hooks，提供统一的接口
 */

import { watch } from 'vue'
import type { Ref } from 'vue'
import type { BoxPlotDataPoint } from '../types'
import { useBoxPlotData } from './useBoxPlotData'
import { useBoxPlotOptions } from './useBoxPlotOptions'
import { useBoxPlotInstance } from './useBoxPlotInstance'
import { useChartVisibility } from '../../scatter-chart/hooks/useChartVisibility'

export interface UseBoxPlotParams {
  // 数据
  data: Ref<BoxPlotDataPoint[]>
  
  // DOM 引用
  chartRef: Ref<HTMLElement | null>
  containerRef: Ref<HTMLElement | null>
  
  // 样式配置
  boxColor: string
  outlierColor: string
  showOutliers: boolean
  
  // 功能配置
  title?: string
  enableZoom: Ref<boolean> | boolean
  enableDataView: Ref<boolean> | boolean
  enableSampling?: Ref<boolean> | boolean
  samplingThreshold?: number
  samplingRate?: number
  enableMultiSeries: Ref<boolean> | boolean
  enableLargeMode: boolean
  largeThreshold: number
  
  // 懒加载配置
  lazyLoad: boolean
  rootMargin?: string
  threshold?: number
  
  // 事件回调
  onBoxClick?: (data: { category: string; statistics: unknown }) => void
  onOutlierClick?: (data: { category: string; value: number }) => void
  onVisible?: (visible: boolean) => void
  onChartReady?: () => void
  onRenderStats?: (stats: {
    totalCategories: number
    totalDataPoints: number
    seriesCount: number
  }) => void
}

export function useBoxPlot(params: UseBoxPlotParams) {
  const {
    data,
    chartRef,
    containerRef,
    boxColor,
    outlierColor,
    showOutliers,
    title,
    enableZoom,
    enableDataView,
    enableSampling,
    samplingThreshold,
    samplingRate,
    enableMultiSeries,
    lazyLoad,
    rootMargin,
    threshold,
    onBoxClick,
    onOutlierClick,
    onVisible,
    onChartReady,
    onRenderStats
  } = params

  // 1. 数据处理 Hook
  const boxPlotDataHook = useBoxPlotData({
    data,
    enableMultiSeries,
    enableSampling,
    samplingThreshold,
    samplingRate,
    boxColor,
    outlierColor,
    showOutliers
  })

  const {
    splitIntoSeries,
    getStatistics
  } = boxPlotDataHook

  // 获取分类列表
  const categories = data.value.map(item => item.category)

  // 2. 配置生成 Hook
  const boxPlotOptionsHook = useBoxPlotOptions({
    title,
    enableZoom,
    enableDataView,
    categories,
    splitIntoSeries
  })

  const { getChartOption } = boxPlotOptionsHook

  // 3. 实例管理 Hook
  const boxPlotInstanceHook = useBoxPlotInstance({
    chartRef,
    lazyLoad,
    getChartOption,
    onBoxClick,
    onOutlierClick,
    onChartReady,
    onRenderStats
  })

  const {
    isChartReady,
    initChart: initChartInternal,
    updateChart,
    resetChart
  } = boxPlotInstanceHook

  // 包装 initChart，确保总是传递数据信息
  const initChart = () => {
    const totalDataPoints = data.value.reduce((sum, item) => sum + item.values.length, 0)
    initChartInternal({
      totalCategories: data.value.length,
      totalDataPoints
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
        const totalDataPoints = newData.reduce((sum, item) => sum + item.values.length, 0)
        updateChart({
          totalCategories: newData.length,
          totalDataPoints
        })
      }
    }
  )

  return {
    // 状态
    isChartReady,
    isVisible,
    
    // 方法
    resetChart,
    getStatistics,
    
    // 内部方法（供高级使用）
    initChart,
    updateChart
  }
}
