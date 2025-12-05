/**
 * 柱状图组件 Props 定义
 */

import type { EChartsOption } from 'echarts'

export interface BarChartProps {
  option?: EChartsOption
  width?: string
  height?: string
}

export const barChartPropsDefaults = {
  width: '100%',
  height: '400px'
}

export const defaultBarChartOption: EChartsOption = {
  title: {
    text: '柱状图'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    data: ['销量', '利润']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '销量',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110, 130]
    },
    {
      name: '利润',
      type: 'bar',
      data: [60, 100, 75, 40, 35, 55, 65]
    }
  ]
}
