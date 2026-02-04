# BoxPlot 箱线图组件

基于 ECharts 的高性能箱线图组件，采用 Composition API 和 Hooks 架构设计。

## ✨ 特性

- 🎯 **Hooks 架构** - 完全基于 Composition API，逻辑清晰可复用
- 📊 **统计计算** - 自动计算四分位数、中位数、异常值
- 🚀 **性能优化** - 支持多 Series 模式，优化大数据渲染
- 🎨 **高度可定制** - 丰富的配置选项和样式定制
- 📱 **响应式设计** - 自适应容器大小
- 🔍 **交互支持** - 缩放、数据视图、点击事件
- 👁️ **懒加载** - 支持可见性检测，按需加载

## 📦 安装

```bash
npm install echarts
```

## 🚀 快速开始

### 基础用法

```vue
<template>
  <BoxPlot :data="chartData" :height="400" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BoxPlot } from '@/components/box-plot'
import type { BoxPlotDataPoint } from '@/components/box-plot'

const chartData = ref<BoxPlotDataPoint[]>([
  {
    category: '分类A',
    values: [12, 15, 18, 20, 22, 25, 28, 30, 35, 40]
  },
  {
    category: '分类B',
    values: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
  }
])
</script>
```

### 多 Series 模式（大数据优化）

```vue
<template>
  <BoxPlot
    :data="chartData"
    :enable-multi-series="true"
    :height="500"
  />
</template>

<script setup lang="ts">
// 当分类数量较多时（> 20），启用多 Series 模式
// 每个分类一个 series，优化渲染性能
const chartData = ref<BoxPlotDataPoint[]>([
  // ... 50 个分类
])
</script>
```

### 完整配置

```vue
<template>
  <BoxPlot
    :data="chartData"
    title="数据分布箱线图"
    :width="800"
    :height="500"
    :box-color="'#7cb5ec'"
    :outlier-color="'#f45b5b'"
    :show-outliers="true"
    :enable-multi-series="false"
    :enable-zoom="true"
    :enable-data-view="true"
    :lazy-load="true"
    @box-click="handleBoxClick"
    @outlier-click="handleOutlierClick"
    @chart-ready="handleChartReady"
  />
</template>

<script setup lang="ts">
const handleBoxClick = (data: { category: string; statistics: unknown }) => {
  console.log('点击箱体:', data)
}

const handleOutlierClick = (data: { category: string; value: number }) => {
  console.log('点击异常值:', data)
}

const handleChartReady = () => {
  console.log('图表加载完成')
}
</script>
```

## 📚 API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| data | 箱线图数据 | `BoxPlotDataPoint[]` | `[]` |
| title | 图表标题 | `string` | - |
| width | 图表宽度 | `string \| number` | `'100%'` |
| height | 图表高度 | `string \| number` | `400` |
| boxColor | 箱体颜色 | `string` | `'#7cb5ec'` |
| outlierColor | 异常值颜色 | `string` | `'#f45b5b'` |
| showOutliers | 是否显示异常值 | `boolean` | `true` |
| enableMultiSeries | 是否启用多 Series 模式 | `boolean` | `false` |
| enableZoom | 是否启用缩放 | `boolean` | `true` |
| enableDataView | 是否启用数据视图 | `boolean` | `true` |
| enableLargeMode | 是否启用大数据模式 | `boolean` | `true` |
| largeThreshold | 大数据模式阈值 | `number` | `2000` |
| lazyLoad | 是否启用懒加载 | `boolean` | `true` |
| rootMargin | IntersectionObserver rootMargin | `string` | `'50px'` |
| threshold | IntersectionObserver threshold | `number` | `0.1` |

### Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| box-click | 点击箱体时触发 | `{ category: string, statistics: BoxPlotStatistics }` |
| outlier-click | 点击异常值时触发 | `{ category: string, value: number }` |
| visible | 可见性变化时触发 | `boolean` |
| chart-ready | 图表加载完成时触发 | - |
| render-stats | 渲染统计信息 | `{ totalCategories, totalDataPoints, seriesCount }` |

### 数据类型

```typescript
interface BoxPlotDataPoint {
  category: string      // 分类名称
  values: number[]      // 原始数据值
}

interface BoxPlotStatistics {
  min: number          // 最小值（不含异常值）
  q1: number           // 下四分位数
  median: number       // 中位数
  q3: number           // 上四分位数
  max: number          // 最大值（不含异常值）
  outliers: number[]   // 异常值列表
}
```

### 暴露的方法

```typescript
// 通过 ref 访问
const chartRef = ref()

// 重置图表
chartRef.value?.resetChart()

// 获取统计信息
const stats = chartRef.value?.getStatistics()
```

## 🏗️ 架构设计

### Hooks 层次结构

```
useBoxPlot (组合 Hook)
    ├── useBoxPlotData (数据处理)
    │   └── 统计计算、数据转换、分片管理
    ├── useBoxPlotOptions (配置生成)
    │   └── ECharts 配置对象生成
    ├── useBoxPlotInstance (实例管理)
    │   └── 图表创建、更新、销毁、事件处理
    └── useChartVisibility (可见性检测)
        └── IntersectionObserver 懒加载
```

### 文件结构

```
box-plot/
├── BoxPlot.vue              # 组件（只负责模板）
├── types.ts                 # 类型定义
├── index.ts                 # 导出
├── hooks/
│   ├── useBoxPlotData.ts    # 数据处理 Hook
│   ├── useBoxPlotOptions.ts # 配置生成 Hook
│   ├── useBoxPlotInstance.ts# 实例管理 Hook
│   ├── useBoxPlot.ts        # 组合 Hook
│   └── index.ts             # Hooks 导出
└── README.md                # 文档
```

## 🎯 性能优化

### 多 Series 模式

当分类数量较多时（建议 > 20），启用多 Series 模式：

```vue
<BoxPlot
  :data="manyCategories"
  :enable-multi-series="true"
/>
```

**优势：**
- 分批渲染，避免主线程长时间阻塞
- 浏览器有机会响应用户交互
- 内存分配更均匀

**适用场景：**
- 分类数量 > 20
- 每个分类数据量较大
- 需要流畅的用户体验

### 性能建议

| 分类数量 | 推荐配置 |
|---------|---------|
| < 10 | 单 Series |
| 10-20 | 单 Series |
| 20-50 | 多 Series |
| > 50 | 多 Series + 考虑分页 |

## 📊 统计算法

### 箱线图统计

1. **四分位数计算**
   - Q1: 25% 分位数
   - Q2 (中位数): 50% 分位数
   - Q3: 75% 分位数

2. **异常值检测**
   - IQR = Q3 - Q1
   - 下界 = Q1 - 1.5 × IQR
   - 上界 = Q3 + 1.5 × IQR
   - 异常值 = 值 < 下界 或 值 > 上界

3. **箱线图范围**
   - 最小值 = min(正常值)
   - 最大值 = max(正常值)

## 🎨 样式定制

### 自定义颜色

```vue
<BoxPlot
  :box-color="'#5470c6'"
  :outlier-color="'#ee6666'"
/>
```

### 自定义尺寸

```vue
<BoxPlot
  :width="1000"
  :height="600"
/>
```

## 🔍 调试

访问调试页面查看完整示例：

```
/box-plot-debug
```

## 📝 示例

### 生成正态分布数据

```typescript
const generateNormalData = (mean: number, stdDev: number, count: number) => {
  const data: number[] = []
  for (let i = 0; i < count; i++) {
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    data.push(mean + z0 * stdDev)
  }
  return data
}

const chartData = [
  {
    category: '组A',
    values: generateNormalData(50, 10, 100)
  },
  {
    category: '组B',
    values: generateNormalData(60, 15, 100)
  }
]
```

## 🤝 参考

- [ECharts 箱线图文档](https://echarts.apache.org/zh/option.html#series-boxplot)
- [箱线图统计原理](https://en.wikipedia.org/wiki/Box_plot)

## 📄 License

MIT
