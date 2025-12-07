/**
 * 仪表盘组件 Props 定义
 */

import type { EChartsOption } from 'echarts'

export interface GaugeChartProps {
  option?: EChartsOption
  width?: string
  height?: string
}

export const gaugeChartPropsDefaults = {
  width: '100%',
  height: '400px'
}

export const defaultGaugeChartOption: EChartsOption = {
  title: {
    text: '仪表盘'
  },
  tooltip: {
    formatter: '{a} <br/>{b} : {c}%'
  },
  series: [
    {
      name: '业务指标',
      type: 'gauge',
      detail: {
        formatter: '{value}%'
      },
      data: [{ value: 75, name: '完成率' }]
    }
  ]
}
