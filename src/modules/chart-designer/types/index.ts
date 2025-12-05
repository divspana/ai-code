/**
 * 图表设计器类型定义
 */

import type { EChartsOption } from 'echarts'

// 图表类型
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'gauge' | 'funnel' | 'candlestick'

// 图表配置
export interface ChartConfig {
  id: string
  type: ChartType
  name: string
  icon: string
  option: EChartsOption
  width?: string
  height?: string
}

// 图表实例
export interface ChartInstance {
  id: string
  type: ChartType
  name: string
  option: EChartsOption
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
}

// 图表库项
export interface ChartLibraryItem {
  type: ChartType
  name: string
  icon: string
  description: string
  defaultOption: EChartsOption
}
