/**
 * 箱线图实例管理 Hook
 * 负责 ECharts 实例的创建、更新、销毁和事件处理
 */

import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Ref } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

export interface UseBoxPlotInstanceParams {
  chartRef: Ref<HTMLElement | null>
  lazyLoad: boolean
  getChartOption: () => EChartsOption
  onBoxClick?: (data: { category: string; statistics: unknown }) => void
  onOutlierClick?: (data: { category: string; value: number }) => void
  onChartReady?: () => void
  onRenderStats?: (stats: {
    totalCategories: number
    totalDataPoints: number
    seriesCount: number
  }) => void
}

export function useBoxPlotInstance(params: UseBoxPlotInstanceParams) {
  const {
    chartRef,
    lazyLoad,
    getChartOption,
    onBoxClick,
    onOutlierClick,
    onChartReady,
    onRenderStats
  } = params

  let chartInstance: echarts.ECharts | null = null
  const isChartReady = ref(false)

  /**
   * 初始化图表
   */
  const initChart = (dataInfo?: { totalCategories: number; totalDataPoints: number }) => {
    if (!chartRef.value || isChartReady.value) return

    nextTick(() => {
      if (!chartRef.value) return

      chartInstance = echarts.init(chartRef.value)
      isChartReady.value = true

      const option = getChartOption()
      chartInstance.setOption(option)

      // 发送渲染统计信息
      if (onRenderStats && dataInfo) {
        const seriesArray = option.series as Array<{ data: unknown[] }>
        onRenderStats({
          totalCategories: dataInfo.totalCategories,
          totalDataPoints: dataInfo.totalDataPoints,
          seriesCount: seriesArray.length
        })
      }

      // 监听点击事件
      if (onBoxClick || onOutlierClick) {
        chartInstance.on('click', (params: { 
          seriesType: string
          name: string
          data: unknown
          value: number[]
        }) => {
          if (params.seriesType === 'boxplot' && onBoxClick) {
            onBoxClick({
              category: params.name,
              statistics: params.data
            })
          } else if (params.seriesType === 'scatter' && onOutlierClick) {
            onOutlierClick({
              category: params.name,
              value: params.value[1]
            })
          }
        })
      }

      // 监听窗口大小变化
      window.addEventListener('resize', resize)

      // 触发就绪回调
      if (onChartReady) {
        onChartReady()
      }

      // 延迟 resize 确保正确的尺寸
      setTimeout(() => {
        if (chartInstance) {
          chartInstance.resize()
        }
      }, 100)
    })
  }

  /**
   * 更新图表
   */
  const updateChart = (dataInfo?: { totalCategories: number; totalDataPoints: number }) => {
    if (!chartInstance || !isChartReady.value) return

    const option = getChartOption()
    const seriesArray = option.series as Array<{ data: unknown[] }>

    chartInstance.setOption(
      {
        series: seriesArray
      },
      {
        replaceMerge: ['series'],
        lazyUpdate: true
      }
    )

    // 发送渲染统计信息
    if (onRenderStats && dataInfo) {
      onRenderStats({
        totalCategories: dataInfo.totalCategories,
        totalDataPoints: dataInfo.totalDataPoints,
        seriesCount: seriesArray.length
      })
    }
  }

  /**
   * 重置图表
   */
  const resetChart = () => {
    if (chartInstance) {
      chartInstance.dispatchAction({
        type: 'restore'
      })
    }
  }

  /**
   * 调整图表大小
   */
  const resize = () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  }

  /**
   * 销毁图表
   */
  const dispose = () => {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    window.removeEventListener('resize', resize)
  }

  // 生命周期
  onMounted(() => {
    if (!lazyLoad) {
      nextTick(() => {
        initChart()
      })
    }
  })

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    isChartReady,
    initChart,
    updateChart,
    resetChart,
    resize,
    dispose
  }
}
