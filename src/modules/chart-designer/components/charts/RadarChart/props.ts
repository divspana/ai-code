/**
 * 雷达图组件 Props 定义
 */

import type { EChartsOption } from 'echarts'

export interface RadarChartProps {
  option?: EChartsOption
  width?: string
  height?: string
}

export const radarChartPropsDefaults = {
  width: '100%',
  height: '400px'
}

export const defaultRadarChartOption: EChartsOption = {
  title: {
    text: '雷达图'
  },
  tooltip: {},
  legend: {
    data: ['预算', '实际']
  },
  radar: {
    indicator: [
      { name: '销售', max: 6500 },
      { name: '管理', max: 16000 },
      { name: '技术', max: 30000 },
      { name: '客服', max: 38000 },
      { name: '研发', max: 52000 },
      { name: '市场', max: 25000 }
    ]
  },
  series: [
    {
      name: '预算 vs 实际',
      type: 'radar',
      data: [
        {
          value: [4200, 3000, 20000, 35000, 50000, 18000],
          name: '预算'
        },
        {
          value: [5000, 14000, 28000, 26000, 42000, 21000],
          name: '实际'
        }
      ]
    }
  ]
}
