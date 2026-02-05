/**
 * VChart 散点图组合 Hook
 * 组合所有子 hooks，提供统一的接口
 */

import { watch } from 'vue'
import type { Ref } from 'vue'
import type { VChartScatterDataPoint } from '../types'
import { useVChartData } from './useVChartData'
import { useVChartInstance } from './useVChartInstance'
import { useChartVisibility } from '../../scatter-chart/hooks/useChartVisibility'

export interface UseVChartScatterParams {
  // 数据
  data: Ref<VChartScatterDataPoint[]>
  
  // DOM 引用
  containerRef: Ref<HTMLElement | null>
  wrapperRef: Ref<HTMLElement | null>
  
  // 配置
  title?: string
  pointSize: number
  pointSizeRange: [number, number]
  color: string | string[]
  
  // 性能优化
  enableLargeMode: boolean
  largeThreshold: number
  enableSampling: boolean
  samplingThreshold: number
  
  // 交互
  enableZoom: boolean
  enableBrush: boolean
  enableTooltip: boolean
  
  // 懒加载
  lazyLoad: boolean
  rootMargin?: string
  threshold?: number
  
  // 事件回调
  onPointClick?: (data: { point: VChartScatterDataPoint; index: number }) => void
  onBrushSelect?: (data: { points: VChartScatterDataPoint[] }) => void
  onVisible?: (visible: boolean) => void
  onReady?: () => void
  onRenderStats?: (stats: { totalCount: number; renderedCount: number; renderTime: number }) => void
}

export function useVChartScatter(params: UseVChartScatterParams) {
  const {
    data,
    containerRef,
    wrapperRef,
    title,
    pointSize,
    pointSizeRange,
    color,
    enableLargeMode,
    largeThreshold,
    enableSampling,
    samplingThreshold,
    enableZoom,
    enableBrush,
    enableTooltip,
    lazyLoad,
    rootMargin,
    threshold,
    onPointClick,
    onBrushSelect,
    onVisible,
    onReady,
    onRenderStats
  } = params

  // 1. 数据处理 Hook
  const dataHook = useVChartData({
    data,
    enableSampling,
    samplingThreshold
  })

  const { chartData, getStats } = dataHook

  // 2. 实例管理 Hook
  const instanceHook = useVChartInstance({
    containerRef,
    chartData,
    title,
    pointSize,
    pointSizeRange,
    color,
    enableLargeMode,
    largeThreshold,
    enableZoom,
    enableBrush,
    enableTooltip,
    lazyLoad,
    onPointClick,
    onBrushSelect,
    onReady,
    onRenderStats
  })

  const {
    isReady,
    initChart,
    updateChart,
    resize,
    exportImage,
    downloadImage,
    getChartInstance
  } = instanceHook

  // 3. 可见性检测 Hook
  const { isVisible } = useChartVisibility({
    containerRef: wrapperRef,
    enabled: lazyLoad,
    rootMargin,
    threshold,
    onVisible: (visible) => {
      if (onVisible) {
        onVisible(visible)
      }
      if (visible && !isReady.value) {
        initChart()
      }
    }
  })

  // 监听数据变化
  watch(
    () => data.value,
    (newData, oldData) => {
      if (isReady.value && newData !== oldData) {
        console.log('📊 数据变化，更新图表')
        updateChart()
      }
    }
  )

  return {
    // 状态
    isReady,
    isVisible,
    
    // 方法
    getStats,
    resize,
    exportImage,
    downloadImage,
    getChartInstance,
    
    // 内部方法
    initChart,
    updateChart
  }
}
