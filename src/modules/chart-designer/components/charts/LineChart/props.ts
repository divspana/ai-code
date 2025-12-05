/**
 * 折线图组件 Props 定义
 */

import type { EChartsOption } from 'echarts'

export interface LineChartProps {
  option?: EChartsOption
  width?: string
  height?: string
}

export const lineChartPropsDefaults = {
  width: '100%',
  height: '400px'
}

// 默认配置
export const defaultLineChartOption: EChartsOption = {
  title: {
    text: '折线图'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['数据1', '数据2']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '数据1',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: '数据2',
      type: 'line',
      data: [220, 182, 191, 234, 290, 330, 310]
    }
  ]
}
