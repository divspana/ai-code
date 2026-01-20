/**
 * Wafer Map 组件常量配置
 */

import type { RenderConfig } from './types'

// ==================== 默认配置 ====================

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  // 缺陷渲染
  showDefects: true,
  defectSize: 0.5,
  defectColors: {
    scratch: '#FF4444',
    particle: '#FFA500',
    void: '#9370DB',
    crack: '#DC143C',
    contamination: '#FFD700',
    default: '#FF0000'
  },

  // 性能优化
  enablePerformanceMode: true,
  maxDefectsToRender: 100000,
  enableViewportCulling: true,
  enableDataDecimation: true,

  // 交互
  enableZoom: true,
  enablePan: true,
  enableSelection: true,
  enableTooltip: true,
  enableClick: true,

  // 样式
  backgroundColor: '#ffffff',
  dieColor: '#409EFF',
  dieStrokeColor: '#333333',
  waferColor: '#f5f5f5',
  waferStrokeColor: '#999999'
}

// ==================== 性能阈值 ====================
/**
 * 性能阈值配置
 */
export const PERFORMANCE_THRESHOLDS = {
  SMALL_DATASET: 10000, // 小数据集：< 1万
  MEDIUM_DATASET: 50000, // 中等数据集：1-5万
  LARGE_DATASET: 200000, // 大数据集：5-20万
  HUGE_DATASET: 1000000, // 超大数据集：20-100万
  FPS_TARGET: 30, // 目标帧率
  RENDER_TIME_WARNING: 100, // 渲染时间警告阈值（ms）
  MAX_RENDER_POINTS: 30000 // 最大渲染点数（视觉质量和性能的平衡点）
}

// ==================== 抽稀配置 ====================

export const DECIMATION_LEVELS = {
  NONE: 0,
  LIGHT: 1,
  MEDIUM: 2,
  HEAVY: 3,
  EXTREME: 4
}

export const DECIMATION_RATES = [
  1.0, // NONE: 100%
  0.3, // LIGHT: 30%
  0.1, // MEDIUM: 10%
  0.02, // HEAVY: 2%
  0.005 // EXTREME: 0.5% (for 1M+ data)
]

// ==================== LOD 配置 ====================

export const LOD_CONFIG = {
  // 根据缩放级别和数据量自动调整
  ZOOM_THRESHOLDS: [0.5, 1.0, 2.0, 4.0],
  DATA_THRESHOLDS: [10000, 50000, 200000, 1000000]
}

// ==================== 空间索引配置 ====================

export const SPATIAL_INDEX_CONFIG = {
  CELL_SIZE: 100, // 网格大小 (pixels)
  VIEWPORT_MARGIN: 50 // 视口边界扩展 (pixels)
}

// ==================== Canvas 配置 ====================

export const CANVAS_CONFIG = {
  DEFAULT_SIZE: 800,
  MIN_SIZE: 400,
  MAX_SIZE: 2000,
  SCALE_FACTOR: 0.75, // 晶圆占画布的比例（留出更多边距）

  // Canvas context 选项
  CONTEXT_OPTIONS: {
    alpha: true,
    desynchronized: true,
    willReadFrequently: false
  }
}

// ==================== 交互配置 ====================

export const INTERACTION_CONFIG = {
  // 缩放
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 10,
  ZOOM_STEP: 0.1,
  WHEEL_ZOOM_SPEED: 0.001,

  // 平移
  PAN_DAMPING: 0.9,

  // 选择框
  MIN_SELECTION_SIZE: 20, // 最小选择框大小 (pixels)

  // Tooltip
  TOOLTIP_OFFSET: 15, // Tooltip 偏移 (pixels)
  TOOLTIP_DELAY: 100, // Tooltip 延迟 (ms)

  // 防抖/节流
  DEBOUNCE_DELAY: 100,
  THROTTLE_DELAY: 16 // ~60fps
}

// ==================== 样式常量 ====================

export const STYLES = {
  // Notch
  NOTCH_SIZE: 10,

  // Reticle Border
  RETICLE_BORDER_COLOR: '#FF6B6B',
  RETICLE_BORDER_WIDTH_FACTOR: 1.0,

  // Selection Box
  SELECTION_FILL_COLOR: 'rgba(173, 216, 230, 0.3)',
  SELECTION_STROKE_COLOR: '#409EFF',
  SELECTION_STROKE_WIDTH: 2,
  SELECTION_DASH: [5, 5],

  // Tooltip
  TOOLTIP_BG_COLOR: 'rgba(0, 0, 0, 0.85)',
  TOOLTIP_TEXT_COLOR: '#ffffff',
  TOOLTIP_BORDER_RADIUS: 6,
  TOOLTIP_PADDING: 12,
  TOOLTIP_MIN_WIDTH: 200
}

// ==================== 错误消息 ====================

export const ERROR_MESSAGES = {
  CANVAS_NOT_FOUND: 'Canvas element not found',
  CONTEXT_NOT_AVAILABLE: 'Canvas 2D context not available',
  INVALID_CONFIG: 'Invalid wafer configuration',
  WORKER_NOT_SUPPORTED: 'Web Worker not supported',
  RENDER_FAILED: 'Render failed'
}

// ==================== 调试配置 ====================

export const DEBUG_CONFIG = {
  ENABLE_CONSOLE_LOG: true,
  ENABLE_PERFORMANCE_LOG: true,
  LOG_RENDER_TIME: true,
  LOG_DEFECT_COUNT: true,
  LOG_FPS: true
}
