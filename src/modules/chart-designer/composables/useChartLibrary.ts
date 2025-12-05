/**
 * 图表库管理
 */

import { ref } from 'vue'
import type { ChartLibraryItem, ChartType } from '../types'
import type { EChartsOption } from 'echarts'

export function useChartLibrary() {
  // 图表库数据
  const chartLibrary = ref<ChartLibraryItem[]>([
    {
      type: 'line',
      name: '折线图',
      icon: 'TrendCharts',
      description: '用于展示数据随时间或类别的变化趋势',
      defaultOption: {
        title: { text: '折线图' },
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'line',
          data: [120, 132, 101, 134, 90, 230, 210]
        }]
      }
    },
    {
      type: 'bar',
      name: '柱状图',
      icon: 'Histogram',
      description: '用于比较不同类别的数据大小',
      defaultOption: {
        title: { text: '柱状图' },
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: [120, 200, 150, 80, 70, 110, 130]
        }]
      }
    },
    {
      type: 'pie',
      name: '饼图',
      icon: 'PieChart',
      description: '用于展示数据的占比关系',
      defaultOption: {
        title: { text: '饼图', left: 'center' },
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: [
            { value: 1048, name: '类别A' },
            { value: 735, name: '类别B' },
            { value: 580, name: '类别C' },
            { value: 484, name: '类别D' }
          ]
        }]
      }
    },
    {
      type: 'scatter',
      name: '散点图',
      icon: 'Coordinate',
      description: '用于展示两个变量之间的关系',
      defaultOption: {
        title: { text: '散点图' },
        tooltip: { trigger: 'item' },
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: [{
          type: 'scatter',
          data: [[10, 20], [20, 30], [30, 25], [40, 35], [50, 45]]
        }]
      }
    },
    {
      type: 'radar',
      name: '雷达图',
      icon: 'Odometer',
      description: '用于展示多维度数据',
      defaultOption: {
        title: { text: '雷达图' },
        radar: {
          indicator: [
            { name: '指标1', max: 100 },
            { name: '指标2', max: 100 },
            { name: '指标3', max: 100 },
            { name: '指标4', max: 100 },
            { name: '指标5', max: 100 }
          ]
        },
        series: [{
          type: 'radar',
          data: [{
            value: [80, 90, 70, 85, 75],
            name: '数据'
          }]
        }]
      }
    },
    {
      type: 'gauge',
      name: '仪表盘',
      icon: 'Odometer',
      description: '用于展示进度或完成度',
      defaultOption: {
        title: { text: '仪表盘' },
        series: [{
          type: 'gauge',
          data: [{ value: 75, name: '完成率' }]
        }]
      }
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
