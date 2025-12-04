# Wafer Map 可视化组件使用指南

## 功能概述

Wafer Map 是一个高性能的半导体晶圆可视化组件，支持百万级数据点的实时渲染和交互操作。

## 核心特性

### 🚀 高性能渲染

- ✅ 支持 **500 万级** 数据点
- ✅ Canvas 离屏渲染优化
- ✅ 视口裁剪（只渲染可见区域）
- ✅ 60 FPS 流畅交互
- ✅ 高 DPI 屏幕支持

### 🎯 交互功能

- ✅ **鼠标滚轮缩放**（0.1x - 10x）
- ✅ **拖拽平移**视图
- ✅ **框选区域**（Shift + 拖拽）
- ✅ **点击查看** Die 详情
- ✅ **智能缩放**（以鼠标为中心）

### 📊 数据可视化

- ✅ 自定义颜色映射
- ✅ 可选网格显示
- ✅ 圆形 Wafer 布局
- ✅ Bin 分布统计
- ✅ 良率计算

## 组件 API

### Props

```typescript
interface Props {
  data: Die[] // 必需：Die 数据数组
  width?: number // 可选：画布宽度，默认 800
  height?: number // 可选：画布高度，默认 800
  colorMap?: Record<number, string> // 可选：Bin 颜色映射
  showGrid?: boolean // 可选：显示网格，默认 true
  enableSelection?: boolean // 可选：启用框选，默认 true
}

interface Die {
  x: number // X 坐标
  y: number // Y 坐标
  bin: number // Bin 编号
  value?: number // 可选：数值
}
```

### Events

```typescript
// 框选事件
@select="handleSelect"
// 参数：selectedDies: Die[]

// 点击事件
@click="handleClick"
// 参数：die: Die | null
```

### Methods

```typescript
// 重置视图到初始状态
resetView(): void
```

## 使用示例

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import WaferMap from '@/components/WaferMap/WaferMap.vue'

const waferData = ref([
  { x: 0, y: 0, bin: 1 },
  { x: 1, y: 0, bin: 1 },
  { x: 0, y: 1, bin: 2 }
  // ... 更多数据
])

const colorMap = {
  1: '#4caf50', // Pass - 绿色
  2: '#f44336' // Fail - 红色
}

const handleSelect = dies => {
  console.log('Selected:', dies.length, 'dies')
}
</script>

<template>
  <WaferMap :data="waferData" :color-map="colorMap" @select="handleSelect" />
</template>
```

### 完整示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import WaferMap from '@/components/WaferMap/WaferMap.vue'

const waferMapRef = ref()
const waferData = ref([])
const selectedDies = ref([])

// 生成测试数据
const generateData = () => {
  const data = []
  const radius = 100

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        data.push({
          x: x + radius,
          y: y + radius,
          bin: Math.random() < 0.9 ? 1 : 2,
          value: Math.random() * 100
        })
      }
    }
  }

  waferData.value = data
}

const handleSelect = dies => {
  selectedDies.value = dies
}

const handleClick = die => {
  if (die) {
    console.log('Clicked die:', die)
  }
}

const resetView = () => {
  waferMapRef.value?.resetView()
}

generateData()
</script>

<template>
  <div>
    <el-button @click="resetView">重置视图</el-button>

    <WaferMap
      ref="waferMapRef"
      :data="waferData"
      :width="800"
      :height="800"
      :color-map="{
        1: '#4caf50',
        2: '#f44336'
      }"
      @select="handleSelect"
      @click="handleClick"
    />

    <p v-if="selectedDies.length > 0">已选中 {{ selectedDies.length }} 个 Die</p>
  </div>
</template>
```

## 操作指南

### 缩放视图

- **鼠标滚轮向上**：放大
- **鼠标滚轮向下**：缩小
- 缩放范围：0.1x - 10x
- 缩放以鼠标位置为中心

### 平移视图

- **左键拖拽**：平移画布
- **右键拖拽**：平移画布（备选）
- 可以拖拽到任意位置

### 框选区域

1. 按住 **Shift** 键
2. 按下鼠标左键并拖拽
3. 松开鼠标，触发 `select` 事件
4. 选中区域内的所有 Die 会被返回

### 查看 Die 详情

- **单击** 任意 Die
- 触发 `click` 事件
- 返回被点击的 Die 对象

### 重置视图

- 调用 `resetView()` 方法
- 恢复到初始缩放和位置

## 性能优化

### 1. 视口裁剪

只渲染可见区域内的 Die，大幅减少渲染开销：

```typescript
const visibleDies = props.data.filter(die => {
  const screen = worldToScreen(die.x, die.y)
  return (
    screen.x + scaledDw >= 0 &&
    screen.x <= canvas.width &&
    screen.y + scaledDh >= 0 &&
    screen.y <= canvas.height
  )
})
```

### 2. 离屏渲染

使用离屏 Canvas 缓存渲染结果：

```typescript
// 只在数据变化或视图变化时重新渲染
if (!offscreenCanvas || needsRedraw) {
  // 渲染到离屏 Canvas
  renderToOffscreen()
  needsRedraw = false
}

// 快速复制到主 Canvas
ctx.drawImage(offscreenCanvas, 0, 0)
```

### 3. 批量渲染

使用原生 Canvas API 批量绘制，避免频繁的状态切换：

```typescript
visibleDies.forEach(die => {
  ctx.fillStyle = colorMap[die.bin]
  ctx.fillRect(x, y, width, height)
})
```

### 4. 条件渲染

根据缩放级别决定是否渲染网格：

```typescript
if (props.showGrid && scale.value > 0.5) {
  // 只在放大时显示网格
  ctx.strokeRect(x, y, width, height)
}
```

## 数据格式

### Die 数据结构

```typescript
interface Die {
  x: number // X 坐标（整数）
  y: number // Y 坐标（整数）
  bin: number // Bin 编号（用于颜色映射）
  value?: number // 可选：测试值或其他数据
}
```

### 坐标系统

- 原点：左上角 (0, 0)
- X 轴：向右递增
- Y 轴：向下递增
- 坐标为整数（Die 索引）

### 颜色映射

```typescript
const colorMap = {
  0: '#e0e0e0', // 未测试 - 灰色
  1: '#4caf50', // Pass - 绿色
  2: '#f44336', // Fail - 红色
  3: '#ff9800', // Warning - 橙色
  4: '#2196f3', // Special - 蓝色
  5: '#9c27b0' // Other - 紫色
}
```

## 生成测试数据

### 圆形 Wafer

```typescript
const generateCircularWafer = (totalDies: number) => {
  const data: Die[] = []
  const radius = Math.sqrt(totalDies / Math.PI)

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        data.push({
          x: Math.floor(x + radius),
          y: Math.floor(y + radius),
          bin: Math.random() < 0.9 ? 1 : 2
        })
      }
    }
  }

  return data
}
```

### 矩形 Wafer

```typescript
const generateRectangularWafer = (rows: number, cols: number) => {
  const data: Die[] = []

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      data.push({
        x,
        y,
        bin: Math.random() < 0.9 ? 1 : 2
      })
    }
  }

  return data
}
```

### 模拟真实分布

```typescript
const generateRealisticWafer = (radius: number) => {
  const data: Die[] = []

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const distance = Math.sqrt(x * x + y * y)

      if (distance <= radius) {
        const normalized = distance / radius

        // 边缘区域更容易 Fail
        let bin = 1
        if (normalized > 0.9) {
          bin = Math.random() < 0.6 ? 2 : 1
        } else if (normalized > 0.7) {
          bin = Math.random() < 0.3 ? 2 : 1
        } else {
          bin = Math.random() < 0.05 ? 2 : 1
        }

        data.push({
          x: Math.floor(x + radius),
          y: Math.floor(y + radius),
          bin,
          value: Math.random() * 100
        })
      }
    }
  }

  return data
}
```

## 常见问题

### Q: 如何处理超大数据集（500万+）？

A: 组件已优化支持 500 万级数据：

- 使用视口裁剪只渲染可见区域
- 使用离屏 Canvas 缓存
- 避免在缩小视图时渲染网格

### Q: 框选性能如何？

A: 框选使用简单的坐标范围过滤，即使在百万级数据下也能快速响应（<100ms）。

### Q: 可以自定义 Die 形状吗？

A: 当前版本使用矩形 Die，如需自定义形状，可以修改 `renderWaferMap` 函数中的绘制逻辑。

### Q: 如何导出选中的数据？

A: 在 `select` 事件回调中处理：

```typescript
const handleSelect = (dies: Die[]) => {
  const csv = dies.map(d => `${d.x},${d.y},${d.bin},${d.value}`).join('\n')

  // 下载 CSV
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'selection.csv'
  a.click()
}
```

### Q: 如何添加热力图模式？

A: 可以根据 `value` 字段动态计算颜色：

```typescript
const getHeatmapColor = (value: number) => {
  const normalized = value / 100
  const r = Math.floor(255 * normalized)
  const g = Math.floor(255 * (1 - normalized))
  return `rgb(${r}, ${g}, 0)`
}
```

## 技术实现

### Canvas 双层架构

```
┌─────────────────────┐
│  Overlay Canvas     │  ← 框选层（透明）
├─────────────────────┤
│  Main Canvas        │  ← 渲染层
└─────────────────────┘
```

### 坐标转换

```typescript
// 世界坐标 → 屏幕坐标
worldToScreen(x, y) {
  return {
    x: (x - minX) * dieWidth * scale + offsetX,
    y: (y - minY) * dieHeight * scale + offsetY
  }
}

// 屏幕坐标 → 世界坐标
screenToWorld(screenX, screenY) {
  return {
    x: (screenX - offsetX) / (dieWidth * scale) + minX,
    y: (screenY - offsetY) / (dieHeight * scale) + minY
  }
}
```

### 事件处理流程

```
用户操作
  ↓
事件监听 (mousedown/mousemove/wheel)
  ↓
坐标转换 (screen → world)
  ↓
状态更新 (scale/offset/selection)
  ↓
重新渲染 (renderWaferMap/renderSelection)
  ↓
触发事件 (select/click)
```

## 未来计划

- [ ] 热力图模式
- [ ] 多选模式（Ctrl + 点击）
- [ ] 缩略图导航
- [ ] Die 标注功能
- [ ] 导出为图片
- [ ] 3D 视图
- [ ] 动画过渡
- [ ] WebGL 渲染（更高性能）

## 相关文档

- [项目功能总览](./FEATURES.md)
- [README](./README.md)
