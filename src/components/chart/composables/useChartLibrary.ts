/**
 * 图表库管理
 */

import { ref } from 'vue'
import type { ChartLibraryItem, ChartType } from '../../../modules/chart-designer/types'
import type { EChartsOption } from 'echarts'
import { defaultLineChartOption } from '../LineChart'
import { defaultBarChartOption } from '../BarChart'
import { defaultPieChartOption } from '../PieChart'
import { defaultScatterChartOption } from '../ScatterChart'
import { defaultRadarChartOption } from '../RadarChart'
import { defaultGaugeChartOption } from '../GaugeChart'

export function useChartLibrary() {
  // 图表库数据
  const chartLibrary = ref<ChartLibraryItem[]>([
    {
      type: 'line',
      name: '折线图',
      icon: 'TrendCharts',
      description: '用于展示数据随时间或类别的变化趋势',
      defaultOption: defaultLineChartOption
    },
    {
      type: 'bar',
      name: '柱状图',
      icon: 'Histogram',
      description: '用于比较不同类别的数据大小',
      defaultOption: defaultBarChartOption
    },
    {
      type: 'pie',
      name: '饼图',
      icon: 'PieChart',
      description: '用于展示数据的占比关系',
      defaultOption: defaultPieChartOption
    },
    {
      type: 'scatter',
      name: '散点图',
      icon: 'Coordinate',
      description: '用于展示两个变量之间的关系',
      defaultOption: defaultScatterChartOption
    },
    {
      type: 'radar',
      name: '雷达图',
      icon: 'Odometer',
      description: '用于展示多维度数据',
      defaultOption: defaultRadarChartOption
    },
    {
      type: 'gauge',
      name: '仪表盘',
      icon: 'Odometer',
      description: '用于展示进度或完成度',
      defaultOption: defaultGaugeChartOption
    }
  ])

  // 获取图表默认配置
  const getChartDefaultOption = (type: ChartType): EChartsOption => {
    const chart = chartLibrary.value.find(item => item.type === type)
    return chart?.defaultOption || {}
  }

  return {
    chartLibrary,
    getChartDefaultOption
  }
}
