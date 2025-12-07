/**
 * 散点图组件 Props 定义
 */

import type { EChartsOption } from 'echarts'

export interface ScatterChartProps {
  option?: EChartsOption
  width?: string
  height?: string
}

export const scatterChartPropsDefaults = {
  width: '100%',
  height: '400px'
}

export const defaultScatterChartOption: EChartsOption = {
  title: {
    text: '散点图'
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    data: ['数据集1', '数据集2']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value'
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '数据集1',
      type: 'scatter',
      data: [[10, 20], [20, 30], [30, 25], [40, 35], [50, 45]]
    },
    {
      name: '数据集2',
      type: 'scatter',
      data: [[15, 25], [25, 35], [35, 30], [45, 40], [55, 50]]
    }
  ]
}
