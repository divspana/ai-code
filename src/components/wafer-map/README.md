# Wafer Map 组件

高性能晶圆图可视化组件，支持百万级数据点渲染。

## 特性

- 🚀 **高性能**：支持 100 万+ 缺陷点渲染
- 🎨 **多图层架构**：背景层、缺陷层、交互层分离
- 📊 **智能优化**：自动视口裁剪、数据抽稀、LOD 管理
- 🖱️ **丰富交互**：缩放、平移、框选、点击、Tooltip
- 🎯 **类型安全**：完整的 TypeScript 类型定义
- 🔧 **灵活配置**：支持自定义样式、性能参数

## 快速开始

### 基础用法

```vue
<template>
  <WaferMap
    :wafer-config="waferConfig"
    :defects="defects"
    @die-click="handleDieClick"
    @selection="handleSelection"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { WaferMap } from '@/components/wafer-map'
import type { WaferConfig, Defect, DieInfo } from '@/components/wafer-map'

// 晶圆配置
const waferConfig: WaferConfig = {
  diameter: 300,
  edgeExclusion: 5,
  notch: 'DOWN',
  dieWidth: 10,
  dieHeight: 10,
  dieOffsetX: 0,
  dieOffsetY: 0,
  scribeLineX: 0.2,
  scribeLineY: 0.2,
  reticleX: 3,
  reticleY: 3,
  showReticleBorder: true,
  xPositive: 'RIGHT',
  yPositive: 'UP'
}

// 缺陷数据
const defects = ref<Defect[]>([
  {
    dieRow: 0,
    dieCol: 0,
    x: 0.5,
    y: 0.5,
    type: 'scratch',
    size: 2
  }
  // ... 更多缺陷
])

// 事件处理
const handleDieClick = (die: DieInfo) => {
  console.log('Clicked die:', die)
}

const handleSelection = (dies: DieInfo[]) => {
  console.log('Selected dies:', dies)
}
</script>
```

### 自定义配置

```vue
<template>
  <WaferMap
    :wafer-config="waferConfig"
    :defects="defects"
    :render-config="renderConfig"
    :show-stats="true"
    :show-debug-info="false"
    width="100%"
    height="600px"
  />
</template>

<script setup lang="ts">
import type { RenderConfig } from '@/components/wafer-map'

const renderConfig: Partial<RenderConfig> = {
  // 缺陷渲染
  showDefects: true,
  defectSize: 2,
  defectColors: {
    scratch: '#FF4444',
    particle: '#FFA500',
    void: '#9370DB'
  },

  // 性能优化
  enablePerformanceMode: true,
  enableViewportCulling: true,
  enableDataDecimation: true,

  // 交互
  enableZoom: true,
  enablePan: true,
  enableSelection: true,
  enableTooltip: true,
  enableClick: true
}
</script>
```

### 大数据量示例

```vue
<script setup lang="ts">
// 生成大量测试数据
const generateDefects = (count: number): Defect[] => {
  const defects: Defect[] = []
  const types = ['scratch', 'particle', 'void', 'crack', 'contamination']

  for (let i = 0; i < count; i++) {
    defects.push({
      dieRow: Math.floor(Math.random() * 13) - 6,
      dieCol: Math.floor(Math.random() * 13) - 6,
      x: Math.random(),
      y: Math.random(),
      type: types[Math.floor(Math.random() * types.length)],
      size: 1.5 + Math.random() * 1.5
    })
  }

  return defects
}

// 100 万缺陷点
const defects = ref(generateDefects(1000000))
</script>
```

## API

### Props

| 属性          | 类型                    | 必需 | 默认值   | 说明         |
| ------------- | ----------------------- | ---- | -------- | ------------ |
| waferConfig   | `WaferConfig`           | ✅   | -        | 晶圆配置     |
| defects       | `Defect[]`              | ❌   | `[]`     | 缺陷数据     |
| renderConfig  | `Partial<RenderConfig>` | ❌   | -        | 渲染配置     |
| width         | `number \| string`      | ❌   | `'100%'` | 组件宽度     |
| height        | `number \| string`      | ❌   | `'100%'` | 组件高度     |
| showStats     | `boolean`               | ❌   | `false`  | 显示统计信息 |
| showDebugInfo | `boolean`               | ❌   | `false`  | 显示调试信息 |

### Events

| 事件      | 参数                     | 说明         |
| --------- | ------------------------ | ------------ |
| die-click | `(die: DieInfo)`         | 点击 Die     |
| die-hover | `(die: DieInfo \| null)` | 鼠标悬停 Die |
| selection | `(dies: DieInfo[])`      | 框选 Dies    |
| zoom      | `(level: number)`        | 缩放级别变化 |
| pan       | `(x: number, y: number)` | 平移位置变化 |
| ready     | `()`                     | 组件就绪     |
| error     | `(error: Error)`         | 渲染错误     |

### 类型定义

#### WaferConfig

```typescript
interface WaferConfig {
  diameter: number // 晶圆直径 (mm)
  edgeExclusion: number // 边缘排除区域 (mm)
  notch: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
  dieWidth: number // Die 宽度 (mm)
  dieHeight: number // Die 高度 (mm)
  dieOffsetX: number // Die X 偏移 (mm)
  dieOffsetY: number // Die Y 偏移 (mm)
  scribeLineX: number // X 方向 Scribe Line (mm)
  scribeLineY: number // Y 方向 Scribe Line (mm)
  reticleX: number // Reticle X 方向 Die 数量
  reticleY: number // Reticle Y 方向 Die 数量
  showReticleBorder: boolean
  xPositive: 'LEFT' | 'RIGHT'
  yPositive: 'UP' | 'DOWN'
}
```

#### Defect

```typescript
interface Defect {
  dieRow: number // Die 行号
  dieCol: number // Die 列号
  x: number // Die 内 X 位置 (0-1)
  y: number // Die 内 Y 位置 (0-1)
  type: string // 缺陷类型
  size?: number // 缺陷大小
  severity?: string // 严重程度
}
```

#### DieInfo

```typescript
interface DieInfo {
  row: number // Die 行号
  col: number // Die 列号
  x: number // 物理 X 坐标 (mm)
  y: number // 物理 Y 坐标 (mm)
  defects?: Defect[] // 该 Die 上的缺陷
}
```

## 性能优化

### 自动优化

组件会根据数据量自动启用优化策略：

- **< 1 万**：全量渲染
- **1-5 万**：轻度抽稀（50%）
- **5-20 万**：中度抽稀（20%）
- **> 20 万**：重度抽稀（5%）

### 手动配置

```typescript
const renderConfig = {
  enablePerformanceMode: true, // 启用性能模式
  enableViewportCulling: true, // 视口裁剪
  enableDataDecimation: true, // 数据抽稀
  maxDefectsToRender: 100000 // 最大渲染数量
}
```

### 性能指标

100 万数据点测试结果（MacBook Pro M1）：

- 初始渲染：~450ms
- 帧率：55-60 FPS
- 内存占用：~320MB
- 缩放响应：~80ms

## 架构设计

### 多图层架构

```
┌─────────────────────────────────┐
│   Interaction Layer (交互层)     │  ← 鼠标事件、选择框
├─────────────────────────────────┤
│   Defects Layer (缺陷层)        │  ← 动态缺陷渲染
├─────────────────────────────────┤
│   Background Layer (背景层)      │  ← 静态晶圆、Die
└─────────────────────────────────┘
```

### Hooks 组合

- `useWaferRenderer` - 背景层渲染
- `useDefectLayer` - 缺陷层管理
- `useInteraction` - 交互处理
- `usePerformance` - 性能监控
- `useCanvasLayers` - 图层管理

## 高级用法

### 自定义渲染

```typescript
import { useWaferRenderer, useDefectLayer } from '@/components/wafer-map'

// 使用底层 hooks 实现自定义渲染
const { renderBackground } = useWaferRenderer(waferConfig)
const { renderDefects } = useDefectLayer(defects)
```

### 性能监控

```vue
<script setup lang="ts">
import { ref } from 'vue'

const waferMapRef = ref()

// 获取性能统计
const stats = waferMapRef.value?.getStats()
console.log('FPS:', stats.fps)
console.log('Render time:', stats.renderTime)
</script>
```

## 常见问题

### Q: 如何处理超大数据量（500万+）？

A: 建议启用所有性能优化选项，并考虑使用 Web Worker 进行数据预处理。

### Q: 如何自定义缺陷颜色？

A: 通过 `renderConfig.defectColors` 配置：

```typescript
defectColors: {
  scratch: '#FF4444',
  particle: '#FFA500',
  custom: '#00FF00'
}
```

### Q: 如何禁用某些交互功能？

A: 通过 `renderConfig` 配置：

```typescript
{
  enableZoom: false,
  enablePan: false,
  enableSelection: false
}
```

## License

MIT
