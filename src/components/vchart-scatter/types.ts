/**
 * VChart 散点图组件类型定义
 */

export interface VChartScatterDataPoint {
  x: number
  y: number
  value?: number
  name?: string
  category?: string
}

export interface VChartScatterProps {
  // 数据
  data: VChartScatterDataPoint[]
  
  // 基础配置
  width?: string | number
  height?: string | number
  
  // 样式配置
  pointSize?: number
  pointSizeRange?: [number, number]
  
  // 颜色配置
  color?: string | string[]
  
  // 性能优化
  enableLargeMode?: boolean // 大数据模式
  largeThreshold?: number // 大数据阈值
  enableSampling?: boolean // 启用采样
  samplingThreshold?: number // 采样阈值
  
  // 交互配置
  enableZoom?: boolean
  enableBrush?: boolean // 框选
  enableTooltip?: boolean
  
  // 工具栏
  showToolbar?: boolean // 显示工具栏
  enableDownload?: boolean // 启用下载
  enableImageExport?: boolean // 启用图片导出
  
  // 标题
  title?: string
  
  // 懒加载
  lazyLoad?: boolean
  rootMargin?: string
  threshold?: number
}

export interface VChartScatterEmits {
  (e: 'point-click', data: { point: VChartScatterDataPoint; index: number }): void
  (e: 'brush-select', data: { points: VChartScatterDataPoint[] }): void
  (e: 'visible', visible: boolean): void
  (e: 'ready'): void
  (e: 'render-stats', stats: {
    totalCount: number
    renderedCount: number
    renderTime: number
  }): void
}
