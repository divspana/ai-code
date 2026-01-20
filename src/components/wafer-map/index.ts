/**
 * Wafer Map 组件库导出
 */

// 核心组件
export { default as WaferMap } from './WaferMap.vue'

// 类型定义
export type {
  WaferConfig,
  RenderConfig,
  WaferMapProps,
  WaferMapEmits,
  Defect,
  DieInfo,
  DiePosition,
  DefectType,
  NotchPosition,
  XDirection,
  YDirection,
  Viewport,
  PerformanceStats,
  LayerType,
  LayerContext
} from './types'

// 常量
export {
  DEFAULT_RENDER_CONFIG,
  PERFORMANCE_THRESHOLDS,
  DECIMATION_LEVELS,
  DECIMATION_RATES,
  LOD_CONFIG,
  SPATIAL_INDEX_CONFIG,
  CANVAS_CONFIG,
  INTERACTION_CONFIG,
  STYLES
} from './constants'

// Hooks（高级用法）
export { useWaferRenderer } from './hooks/useWaferRenderer'
export { useDefectLayer } from './hooks/useDefectLayer'
export { useInteraction } from './hooks/useInteraction'
export { usePerformance } from './hooks/usePerformance'
export { useCanvasLayers } from './hooks/useCanvasLayers'
