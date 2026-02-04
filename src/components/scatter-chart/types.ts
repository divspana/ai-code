/**
 * 散点图组件类型定义
 */

export interface ScatterDataPoint {
  x: number
  y: number
  value?: number
  name?: string
  [key: string]: any
}

export interface ScatterChartProps {
  // 数据
  data: ScatterDataPoint[]
  
  // 图表配置
  title?: string
  width?: string | number
  height?: string | number
  
  // 性能配置
  enableLargeMode?: boolean // 是否启用大数据模式
  largeThreshold?: number // 大数据模式阈值，默认 2000
  
  // 数据采样配置（简化）
  enableSampling?: boolean // 是否启用数据采样（阈值固定为1万）
  enableMultiSeries?: boolean // 是否分多个series（每个1万条数据）
  
  // 交互配置
  enableZoom?: boolean // 是否启用缩放
  enableBrush?: boolean // 是否启用框选
  
  // 样式配置
  symbolSize?: number | ((data: unknown) => number)
  color?: string
  selectedColor?: string // 选中点的颜色
  unselectedColor?: string // 未选中点的颜色（置灰）
  
  // 可见性检测配置
  lazyLoad?: boolean // 是否启用懒加载
  rootMargin?: string // IntersectionObserver 的 rootMargin
  threshold?: number // IntersectionObserver 的 threshold
}

export interface ScatterChartEmits {
  (e: 'brush-selected', data: ScatterDataPoint[]): void
  (e: 'brush-end', data: ScatterDataPoint[]): void
  (e: 'visible', visible: boolean): void
  (e: 'chart-ready'): void
  (e: 'render-stats', stats: { 
    totalCount: number
    renderedCount: number
    seriesCount: number
    reductionRate: number 
  }): void
}

export interface BrushArea {
  brushType: string
  coordRange: number[][]
  range: number[][]
}
