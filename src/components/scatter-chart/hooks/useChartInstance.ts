/**
 * 图表实例管理 Hook
 * 负责 ECharts 实例的创建、更新、销毁和事件处理
 */

import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Ref } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { ScatterDataPoint } from '../types'

export interface UseChartInstanceParams {
  chartRef: Ref<HTMLElement | null>
  lazyLoad: boolean
  getChartOption: () => EChartsOption
  onBrushSelected?: (brushComponent: unknown) => ScatterDataPoint[]
  onChartReady?: () => void
  onRenderStats?: (stats: {
    totalCount: number
    renderedCount: number
    seriesCount: number
    reductionRate: number
  }) => void
}

export function useChartInstance(params: UseChartInstanceParams) {
  const {
    chartRef,
    lazyLoad,
    getChartOption,
    onBrushSelected,
    onChartReady,
    onRenderStats
  } = params

  let chartInstance: echarts.ECharts | null = null
  const isChartReady = ref(false)

  /**
   * 初始化图表
   */
  const initChart: (dataInfo?: { totalCount: number; data: unknown[] }) => void = (dataInfo) => {
    if (!chartRef.value || isChartReady.value) return

    // 使用 nextTick 确保 DOM 已经渲染完成
    nextTick(() => {
      if (!chartRef.value) return

      chartInstance = echarts.init(chartRef.value)
      isChartReady.value = true

      // 设置配置
      const option = getChartOption()
      chartInstance.setOption(option)
      
      // 发送初始渲染统计信息
      if (onRenderStats && dataInfo) {
        const seriesArray = option.series as any[]
        const renderedCount = seriesArray.reduce((sum, series) => sum + series.data.length, 0)
        onRenderStats({
          totalCount: dataInfo.totalCount,
          renderedCount,
          seriesCount: seriesArray.length,
          reductionRate:
            dataInfo.totalCount > 0
              ? Number((((dataInfo.totalCount - renderedCount) / dataInfo.totalCount) * 100).toFixed(1))
              : 0
        })
      }

      // 监听框选事件
      if (onBrushSelected && chartInstance) {
        chartInstance.on('brushSelected', (params: { batch: unknown[] }) => {
          onBrushSelected(params.batch[0])
        })
      }

      // 监听窗口大小变化
      window.addEventListener('resize', resize)

      // 触发就绪回调
      if (onChartReady) {
        onChartReady()
      }
      
      // 再次调用 resize 确保正确的尺寸
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
  const updateChart = (dataInfo?: { totalCount: number; data: unknown[] }) => {
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
      const renderedCount = seriesArray.reduce((sum, series) => sum + series.data.length, 0)
      onRenderStats({
        totalCount: dataInfo.totalCount,
        renderedCount,
        seriesCount: seriesArray.length,
        reductionRate:
          dataInfo.totalCount > 0
            ? Number((((dataInfo.totalCount - renderedCount) / dataInfo.totalCount) * 100).toFixed(1))
            : 0
      })
    }
  }

  /**
   * 清除选择
   */
  const clearSelection = () => {
    if (chartInstance) {
      chartInstance.dispatchAction({
        type: 'brush',
        command: 'clear',
        areas: []
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
    clearSelection,
    resetChart,
    resize,
    dispose
  }
}
