import { ref, computed } from 'vue'
import type { EChartsOption } from 'echarts'

export interface ChartInstance {
  id: string
  type: string
  name: string
  option: EChartsOption
  visible: boolean
  selected: boolean
}

export interface MixedChart {
  id: string
  name: string
  charts: ChartInstance[]
  mergedOption: EChartsOption
}

/**
 * 图表编排管理
 */
export function useChartStore() {
  const charts = ref<ChartInstance[]>([])
  const mixedCharts = ref<MixedChart[]>([])
  const selectedChartId = ref<string | null>(null)

  // 添加图表
  const addChart = (chart: Omit<ChartInstance, 'id' | 'visible' | 'selected'>) => {
    const id = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    charts.value.push({
      ...chart,
      id,
      visible: true,
      selected: false
    })
    return id
  }

  // 删除图表
  const removeChart = (id: string) => {
    const index = charts.value.findIndex(c => c.id === id)
    if (index > -1) {
      charts.value.splice(index, 1)
    }
  }

  // 更新图表配置
  const updateChart = (id: string, option: EChartsOption) => {
    const chart = charts.value.find(c => c.id === id)
    if (chart) {
      chart.option = option
    }
  }

  // 选择图表
  const selectChart = (id: string) => {
    charts.value.forEach(c => {
      c.selected = c.id === id
    })
    selectedChartId.value = id
  }

  // 取消选择
  const deselectAll = () => {
    charts.value.forEach(c => {
      c.selected = false
    })
    selectedChartId.value = null
  }

  // 切换图表可见性
  const toggleChartVisibility = (id: string) => {
    const chart = charts.value.find(c => c.id === id)
    if (chart) {
      chart.visible = !chart.visible
    }
  }

  // 创建混合图表
  const createMixedChart = (chartIds: string[], name: string) => {
    const selectedCharts = charts.value.filter(c => chartIds.includes(c.id))
    if (selectedCharts.length === 0) return null

    const id = `mixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 合并配置
    const mergedOption = mergeSeries(selectedCharts.map(c => c.option))

    const mixedChart: MixedChart = {
      id,
      name,
      charts: selectedCharts,
      mergedOption
    }

    mixedCharts.value.push(mixedChart)
    return id
  }

  // 删除混合图表
  const removeMixedChart = (id: string) => {
    const index = mixedCharts.value.findIndex(m => m.id === id)
    if (index > -1) {
      mixedCharts.value.splice(index, 1)
    }
  }

  // 拆分混合图表
  const splitMixedChart = (id: string) => {
    const mixedChart = mixedCharts.value.find(m => m.id === id)
    if (mixedChart) {
      // 混合图表中的图表已经在 charts 中，只需删除混合图表
      removeMixedChart(id)
    }
  }

  // 合并多个图表的 series
  const mergeSeries = (options: EChartsOption[]): EChartsOption => {
    const merged: EChartsOption = {
      title: { text: '混合图表', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: [], bottom: 10 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: []
    }

    const legendData: string[] = []
    const allSeries: any[] = []
    let xAxisData: any[] = []

    options.forEach(opt => {
      // 收集 series
      if (opt.series) {
        const series = Array.isArray(opt.series) ? opt.series : [opt.series]
        allSeries.push(...series)
        
        // 收集图例数据
        series.forEach((s: any) => {
          if (s.name && !legendData.includes(s.name)) {
            legendData.push(s.name)
          }
        })
      }

      // 使用第一个图表的 xAxis 数据
      if (opt.xAxis && !xAxisData.length) {
        const xAxis = Array.isArray(opt.xAxis) ? opt.xAxis[0] : opt.xAxis
        if (xAxis.data) {
          xAxisData = xAxis.data
        }
      }
    })

    merged.legend = { data: legendData, bottom: 10 }
    merged.series = allSeries
    if (xAxisData.length > 0) {
      (merged.xAxis as any).data = xAxisData
    }

    return merged
  }

  // 获取当前选中的图表
  const selectedChart = computed(() => {
    return charts.value.find(c => c.id === selectedChartId.value)
  })

  // 获取可见的图表
  const visibleCharts = computed(() => {
    return charts.value.filter(c => c.visible)
  })

  return {
    charts,
    mixedCharts,
    selectedChartId,
    selectedChart,
    visibleCharts,
    addChart,
    removeChart,
    updateChart,
    selectChart,
    deselectAll,
    toggleChartVisibility,
    createMixedChart,
    removeMixedChart,
    splitMixedChart
  }
}
