/**
 * Wafer Map 组件类型定义
 */

// ==================== 基础类型 ====================

export type NotchPosition = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
export type XDirection = 'LEFT' | 'RIGHT'
export type YDirection = 'UP' | 'DOWN'

// ==================== 缺陷类型 ====================

/**
 * 传统的坏点数据格式（单个坏点对象）
 */
export interface Defect {
  dieRow: number
  dieCol: number
  x: number // 0-1, Die 内相对位置
  y: number // 0-1, Die 内相对位置
  type: string
  size?: number
  severity?: string
  [key: string]: string | number | undefined // 允许扩展字段
}

/**
 * 新的坏点数据格式（数组形式）
 * logicx 和 logicy 是对应的坐标数组
 */
export interface DefectArrayData {
  logicx: number[] // X 坐标数组
  logicy: number[] // Y 坐标数组
  defectType?: string[] // 坏点类型数组（可选）
  [key: string]: number[] | string[] | undefined // 其他扩展字段
}

export interface DefectType {
  name: string
  color: string
  icon?: string
}

// ==================== Die 信息 ====================

export interface DieInfo {
  row: number
  col: number
  x: number // 物理坐标 (mm)
  y: number // 物理坐标 (mm)
  defects?: Defect[]
  status?: 'good' | 'bad' | 'unknown'
  [key: string]: string | number | Defect[] | undefined // 允许扩展字段
}

export interface DiePosition {
  row: number
  col: number
  canvasX: number
  canvasY: number
  physicalX: number
  physicalY: number
}

// ==================== Wafer 配置 ====================

export interface WaferConfig {
  // 晶圆基本参数
  diameter: number // 晶圆直径 (mm)
  edgeExclusion: number // 边缘排除区域 (mm)
  notch: NotchPosition // Notch 位置

  // Die 参数
  dieWidth: number // Die 宽度 (mm)
  dieHeight: number // Die 高度 (mm)
  dieOffsetX: number // Die X 偏移 (mm)
  dieOffsetY: number // Die Y 偏移 (mm)

  // Scribe Line
  scribeLineX: number // X 方向 Scribe Line (mm)
  scribeLineY: number // Y 方向 Scribe Line (mm)

  // Reticle
  reticleX: number // Reticle X 方向 Die 数量
  reticleY: number // Reticle Y 方向 Die 数量
  showReticleBorder: boolean // 是否显示 Reticle 边框

  // 坐标系
  xPositive: XDirection // X 正方向
  yPositive: YDirection // Y 正方向
}

// ==================== 渲染配置 ====================

export interface RenderConfig {
  // 画布尺寸
  canvasSize?: number // 画布大小，默认自适应

  // 缺陷渲染
  showDefects: boolean // 是否显示缺陷
  defectSize: number // 缺陷点大小
  defectColors?: Record<string, string> // 缺陷颜色映射

  // 性能优化
  enablePerformanceMode: boolean // 是否启用性能模式
  maxDefectsToRender?: number // 最大渲染缺陷数
  enableViewportCulling: boolean // 是否启用视口裁剪
  enableDataDecimation: boolean // 是否启用数据抽稀

  // 交互
  enableZoom: boolean // 是否启用缩放
  enablePan: boolean // 是否启用平移
  enableSelection: boolean // 是否启用框选
  enableTooltip: boolean // 是否启用 Tooltip
  enableClick: boolean // 是否启用点击

  // 样式
  backgroundColor?: string
  dieColor?: string
  dieStrokeColor?: string
  waferColor?: string
  waferStrokeColor?: string
}

// ==================== 组件 Props ====================

export interface WaferMapProps {
  // 必需参数
  waferConfig: WaferConfig

  // 坏点数据（支持两种格式）
  defects?: Defect[] // 传统格式
  defectData?: DefectArrayData // 新格式 {logicx, logicy}

  // 可选配置
  renderConfig?: Partial<RenderConfig>

  // 尺寸
  width?: number | string
  height?: number | string

  // 调试
  showDebugInfo?: boolean
  showStats?: boolean
}

// ==================== 组件 Emits ====================

export interface WaferMapEmits {
  'die-click': [die: DieInfo]
  'die-hover': [die: DieInfo | null]
  selection: [dies: DieInfo[]]
  zoom: [level: number]
  pan: [x: number, y: number]
  ready: []
  error: [error: Error]
}

// ==================== 视口和性能 ====================

export interface Viewport {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface PerformanceStats {
  fps: number
  renderTime: number
  defectsRendered: number
  defectsTotal: number
  lodLevel: number
}

// ==================== 图层类型 ====================

export type LayerType = 'background' | 'defects' | 'interaction'

export interface LayerContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

// ==================== 渲染器接口 ====================

export interface IRenderer {
  render(): void
  clear(): void
  resize(width: number, height: number): void
}

export interface ILayer extends IRenderer {
  readonly type: LayerType
  readonly zIndex: number
  setVisible(visible: boolean): void
}
