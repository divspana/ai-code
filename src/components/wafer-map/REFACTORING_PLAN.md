# Wafer Map 组件重构优化方案

## 一、当前架构分析

### 优点

1. ✅ **模块化设计**：使用 Composition API 和 hooks 分离关注点
2. ✅ **类型安全**：完整的 TypeScript 类型定义
3. ✅ **性能优化**：多层次抽稀、视口裁剪、像素去重
4. ✅ **多图层架构**：背景、缺陷、交互层分离

### 需要优化的问题

#### 1. **代码重复和耦合**

- `WaferMap.vue` 组件过大（666行），职责过多
- 拖拽逻辑直接写在主组件中
- 缺少统一的事件管理

#### 2. **函数职责不清**

- `processDefects` 函数过长（150+行），做了太多事情
- 缺少单一职责原则
- 难以测试和维护

#### 3. **类型定义不够完善**

- 缺少枚举类型（如 DefectType, DieStatus）
- 接口扩展性不够（使用 `[key: string]` 过于宽泛）
- 缺少工具类型和泛型

#### 4. **错误处理不足**

- 缺少边界检查
- 没有统一的错误处理机制
- 控制台日志过多，缺少日志级别

#### 5. **配置管理混乱**

- 常量分散在多个文件
- 缺少配置验证
- 硬编码的魔法数字

---

## 二、优化方案

### 1. 设计模式优化

#### 1.1 策略模式 - 抽稀策略

**当前问题**：抽稀逻辑硬编码在 `processDefects` 中

**优化方案**：

```typescript
// src/components/wafer-map/strategies/decimation/index.ts
export interface IDecimationStrategy {
  decimate(defects: Defect[], maxPoints: number): Defect[]
  getName(): string
}

export class PixelBasedDecimation implements IDecimationStrategy {
  decimate(defects: Defect[], maxPoints: number): Defect[] {
    // 像素网格去重逻辑
  }
  getName() {
    return 'pixel-based'
  }
}

export class SamplingDecimation implements IDecimationStrategy {
  decimate(defects: Defect[], maxPoints: number): Defect[] {
    // 采样逻辑
  }
  getName() {
    return 'sampling'
  }
}

// 策略工厂
export class DecimationStrategyFactory {
  static create(type: 'pixel' | 'sampling'): IDecimationStrategy {
    switch (type) {
      case 'pixel':
        return new PixelBasedDecimation()
      case 'sampling':
        return new SamplingDecimation()
    }
  }
}
```

#### 1.2 观察者模式 - 事件管理

**当前问题**：事件处理分散，难以追踪

**优化方案**：

```typescript
// src/components/wafer-map/core/EventBus.ts
export class WaferMapEventBus {
  private listeners = new Map<string, Set<Function>>()

  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  off(event: string, handler: Function) {
    this.listeners.get(event)?.delete(handler)
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(handler => handler(...args))
  }
}
```

#### 1.3 建造者模式 - 配置构建

**当前问题**：配置对象创建复杂，缺少验证

**优化方案**：

```typescript
// src/components/wafer-map/builders/ConfigBuilder.ts
export class WaferConfigBuilder {
  private config: Partial<WaferConfig> = {}

  setDiameter(diameter: number): this {
    if (diameter <= 0) throw new Error('Diameter must be positive')
    this.config.diameter = diameter
    return this
  }

  setDieSize(width: number, height: number): this {
    if (width <= 0 || height <= 0) throw new Error('Die size must be positive')
    this.config.dieWidth = width
    this.config.dieHeight = height
    return this
  }

  build(): WaferConfig {
    this.validate()
    return this.config as WaferConfig
  }

  private validate() {
    // 配置验证逻辑
  }
}
```

---

### 2. 函数抽离优化

#### 2.1 拆分 `processDefects` 函数

**当前**：150+ 行，职责过多

**优化后**：

```typescript
// src/components/wafer-map/processors/DefectProcessor.ts
export class DefectProcessor {
  constructor(
    private dieMap: Map<string, DiePosition>,
    private decimationStrategy: IDecimationStrategy
  ) {}

  // 主流程
  process(defects: Defect[], options: ProcessOptions): ProcessedDefects {
    const validated = this.validateDefects(defects)
    const sampled = this.preSample(validated, options)
    const positioned = this.calculatePositions(sampled)
    const culled = this.applyCulling(positioned, options.viewport)
    const deduplicated = this.deduplicatePixels(culled)

    return this.groupByColor(deduplicated)
  }

  // 单一职责的小函数
  private validateDefects(defects: Defect[]): Defect[] {}
  private preSample(defects: Defect[], options: ProcessOptions): Defect[] {}
  private calculatePositions(defects: Defect[]): PositionedDefect[] {}
  private applyCulling(defects: PositionedDefect[], viewport: Viewport): PositionedDefect[] {}
  private deduplicatePixels(defects: PositionedDefect[]): ProcessedDefect[] {}
  private groupByColor(defects: ProcessedDefect[]): Map<string, ProcessedDefect[]> {}
}
```

#### 2.2 提取拖拽逻辑

**当前**：拖拽逻辑在 `WaferMap.vue` 中

**优化后**：

```typescript
// src/components/wafer-map/composables/useDraggable.ts
export function useDraggable<T extends { x: number; y: number }>(
  items: Ref<T[]>,
  options?: DraggableOptions
) {
  const draggingIndex = ref<number | null>(null)
  const dragOffset = ref({ x: 0, y: 0 })

  const onDragStart = (event: MouseEvent, index: number) => {}
  const onDragMove = (event: MouseEvent) => {}
  const onDragEnd = () => {}

  return {
    draggingIndex,
    onDragStart,
    onDragMove,
    onDragEnd
  }
}
```

---

### 3. 类型系统优化

#### 3.1 使用枚举和联合类型

```typescript
// src/components/wafer-map/types/enums.ts
export enum DefectSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum DieStatus {
  GOOD = 'good',
  BAD = 'bad',
  UNKNOWN = 'unknown',
  EDGE = 'edge'
}

export enum DecimationLevel {
  NONE = 0,
  LIGHT = 1,
  MEDIUM = 2,
  HEAVY = 3,
  EXTREME = 4
}
```

#### 3.2 泛型和工具类型

```typescript
// src/components/wafer-map/types/utils.ts
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P]
}

// 使用示例
export type DefectWithMetadata<M = Record<string, any>> = Defect & {
  metadata?: M
}
```

#### 3.3 严格的接口定义

```typescript
// 移除宽泛的索引签名，使用具体类型
export interface Defect {
  dieRow: number
  dieCol: number
  x: number
  y: number
  type: string
  size?: number
  severity?: DefectSeverity
  metadata?: DefectMetadata // 替代 [key: string]
}

export interface DefectMetadata {
  timestamp?: number
  inspector?: string
  confidence?: number
  [key: string]: any // 仅在 metadata 中允许扩展
}
```

---

### 4. 接口设计优化

#### 4.1 统一的服务接口

```typescript
// src/components/wafer-map/services/IWaferMapService.ts
export interface IWaferMapService {
  // 数据处理
  processDefects(defects: Defect[], options: ProcessOptions): ProcessedDefects

  // 渲染
  render(layer: LayerType, data: any): void

  // 交互
  handleSelection(area: SelectionArea): DieInfo[]
  handleZoom(delta: number): number

  // 配置
  updateConfig(config: Partial<WaferConfig>): void
  getConfig(): Readonly<WaferConfig>
}
```

#### 4.2 插件系统

```typescript
// src/components/wafer-map/plugins/IPlugin.ts
export interface IWaferMapPlugin {
  name: string
  version: string
  install(context: WaferMapContext): void
  uninstall(): void
}

// 示例插件
export class DefectAnalysisPlugin implements IWaferMapPlugin {
  name = 'defect-analysis'
  version = '1.0.0'

  install(context: WaferMapContext) {
    context.on('defects-processed', this.analyze)
  }

  private analyze(defects: ProcessedDefects) {
    // 分析逻辑
  }
}
```

---

### 5. 错误处理优化

#### 5.1 自定义错误类

```typescript
// src/components/wafer-map/errors/index.ts
export class WaferMapError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message)
    this.name = 'WaferMapError'
  }
}

export class ConfigValidationError extends WaferMapError {
  constructor(field: string, value: any) {
    super(`Invalid configuration: ${field} = ${value}`, 'CONFIG_VALIDATION_ERROR', { field, value })
  }
}

export class RenderError extends WaferMapError {
  constructor(layer: LayerType, cause: Error) {
    super(`Failed to render layer: ${layer}`, 'RENDER_ERROR', { layer, cause })
  }
}
```

#### 5.2 边界检查工具

```typescript
// src/components/wafer-map/utils/validators.ts
export class Validators {
  static isPositive(value: number, name: string): void {
    if (value <= 0) {
      throw new ConfigValidationError(name, value)
    }
  }

  static isInRange(value: number, min: number, max: number, name: string): void {
    if (value < min || value > max) {
      throw new WaferMapError(`${name} must be between ${min} and ${max}`, 'RANGE_ERROR', {
        value,
        min,
        max
      })
    }
  }

  static isNotEmpty<T>(array: T[], name: string): void {
    if (array.length === 0) {
      throw new WaferMapError(`${name} cannot be empty`, 'EMPTY_ARRAY_ERROR')
    }
  }
}
```

---

### 6. 日志系统优化

#### 6.1 统一日志管理

```typescript
// src/components/wafer-map/utils/Logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO

  static setLevel(level: LogLevel) {
    this.level = level
  }

  static debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[WaferMap] ${message}`, ...args)
    }
  }

  static info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[WaferMap] ${message}`, ...args)
    }
  }

  static warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WaferMap] ${message}`, ...args)
    }
  }

  static error(message: string, error?: Error) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[WaferMap] ${message}`, error)
    }
  }
}

// 使用
Logger.setLevel(import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN)
Logger.debug('Processing defects', { count: defects.length })
```

---

### 7. 配置管理优化

#### 7.1 配置验证器

```typescript
// src/components/wafer-map/config/ConfigValidator.ts
export class ConfigValidator {
  static validate(config: WaferConfig): ValidationResult {
    const errors: string[] = []

    // 晶圆参数验证
    if (config.diameter <= 0) {
      errors.push('Diameter must be positive')
    }

    // Die 参数验证
    if (config.dieWidth <= 0 || config.dieHeight <= 0) {
      errors.push('Die dimensions must be positive')
    }

    // 边缘排除验证
    if (config.edgeExclusion >= config.diameter / 2) {
      errors.push('Edge exclusion too large')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
```

#### 7.2 配置预设

```typescript
// src/components/wafer-map/config/presets.ts
export const WAFER_PRESETS = {
  WAFER_300MM: {
    diameter: 300,
    edgeExclusion: 3
    // ...
  },
  WAFER_200MM: {
    diameter: 200,
    edgeExclusion: 2
    // ...
  }
} as const

export type WaferPreset = keyof typeof WAFER_PRESETS
```

---

## 三、重构优先级

### 高优先级（立即执行）

1. ✅ **拆分 `processDefects` 函数**
2. ✅ **提取拖拽逻辑到 composable**
3. ✅ **添加错误处理和边界检查**
4. ✅ **统一日志管理**

### 中优先级（近期执行）

5. ⏳ **实现策略模式抽稀**
6. ⏳ **优化类型定义**
7. ⏳ **添加配置验证**

### 低优先级（长期优化）

8. 📋 **实现插件系统**
9. 📋 **添加单元测试**
10. 📋 **性能监控和分析**

---

## 四、预期收益

### 代码质量

- 单个函数行数 < 50 行
- 圈复杂度 < 10
- 测试覆盖率 > 80%

### 可维护性

- 新增功能时修改文件数 < 3
- Bug 修复时间减少 50%
- 代码审查时间减少 30%

### 性能

- 类型检查时间减少 20%
- 构建时间减少 15%
- 运行时错误减少 90%

---

## 五、实施计划

### 第一阶段：函数重构（1-2天）

- 拆分大型函数
- 提取公共逻辑
- 添加单元测试

### 第二阶段：类型优化（1天）

- 完善类型定义
- 添加枚举和工具类型
- 移除宽泛的索引签名

### 第三阶段：错误处理（1天）

- 实现错误类
- 添加边界检查
- 统一日志管理

### 第四阶段：设计模式（2-3天）

- 实现策略模式
- 添加事件总线
- 实现建造者模式

---

## 六、注意事项

1. **向后兼容**：保持现有 API 不变
2. **渐进式重构**：分阶段进行，避免大规模改动
3. **测试先行**：重构前先添加测试
4. **文档同步**：及时更新文档和注释
5. **性能监控**：重构后对比性能指标
