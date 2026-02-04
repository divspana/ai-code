/**
 * 箱线图组件类型定义
 */

export interface BoxPlotDataPoint {
  category: string // 分类名称
  values: number[] // 原始数据值
}

export interface BoxPlotStatistics {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
}

export interface BoxPlotProps {
  // 数据
  data: BoxPlotDataPoint[]
  
  // 基础配置
  title?: string
  width?: string | number
  height?: string | number
  
  // 性能优化配置
  enableLargeMode?: boolean
  largeThreshold?: number
  enableSampling?: boolean // 是否启用分类采样（用于大量分类场景）
  samplingThreshold?: number // 采样阈值（分类数量）
  samplingRate?: number // 采样率（0-1）
  enableMultiSeries?: boolean // 是否分多个 series（每个分类一个 series）
  
  // 交互配置
  enableZoom?: boolean
  enableDataView?: boolean
  
  // 样式配置
  boxColor?: string
  outlierColor?: string
  showOutliers?: boolean // 是否显示异常值
  
  // 可见性检测配置
  lazyLoad?: boolean
  rootMargin?: string
  threshold?: number
}

export interface BoxPlotEmits {
  (e: 'box-click', data: { category: string; statistics: BoxPlotStatistics }): void
  (e: 'outlier-click', data: { category: string; value: number }): void
  (e: 'visible', visible: boolean): void
  (e: 'chart-ready'): void
  (e: 'render-stats', stats: {
    totalCategories: number
    totalDataPoints: number
    seriesCount: number
  }): void
}
