# ECharts 图表组件使用指南

## 概述

基于 `vue-echarts` 封装的通用图表组件，支持 8 种常用图表类型，提供可视化配置界面和灵活的自定义选项。

## 功能特性

### ✅ 支持的图表类型

1. **折线图 (Line Chart)** 📈
   - 适用于趋势分析
   - 支持多系列
   - 平滑曲线

2. **柱状图 (Bar Chart)** 📊
   - 适用于数据对比
   - 支持多系列
   - 堆叠模式

3. **饼图 (Pie Chart)** 🥧
   - 适用于占比展示
   - 环形/实心可选
   - 标签自动布局

4. **散点图 (Scatter Chart)** ⚫
   - 适用于相关性分析
   - 支持多数据集
   - 自定义点大小

5. **雷达图 (Radar Chart)** 🎯
   - 适用于多维度对比
   - 自定义指标
   - 填充/线条模式

6. **仪表盘 (Gauge Chart)** ⏱️
   - 适用于进度展示
   - 动画效果
   - 自定义范围

7. **漏斗图 (Funnel Chart)** 🔻
   - 适用于转化分析
   - 自动排序
   - 标签显示

8. **热力图 (Heatmap)** 🔥
   - 适用于矩阵数据
   - 颜色映射
   - 数值标签

### ✅ 核心特性

- 🎨 **主题切换**: 浅色/深色主题
- 📱 **响应式**: 自适应容器大小
- 🛠️ **工具栏**: 缩放、保存、还原
- ⚡ **高性能**: 基于 Canvas 渲染
- 🎯 **易用性**: 简洁的 API 设计
- 🔧 **可扩展**: 支持自定义配置

## 快速开始

### 1. 基本使用

```vue
<template>
  <ChartWrapper
    type="line"
    title="销售数据"
    :data="chartData"
    :x-axis-data="xAxisData"
    width="100%"
    height="400px"
  />
</template>

<script setup>
import ChartWrapper from '@/components/Charts/ChartWrapper.vue'

const chartData = [{ name: '销售额', data: [120, 200, 150, 80, 70, 110, 130] }]

const xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
</script>
```

### 2. 多系列折线图

```vue
<template>
  <ChartWrapper type="line" title="多系列对比" :data="multiSeriesData" :x-axis-data="categories" />
</template>

<script setup>
const multiSeriesData = [
  {
    name: '销售额',
    data: [120, 200, 150, 80, 70, 110, 130],
    color: '#5470c6'
  },
  {
    name: '访问量',
    data: [220, 182, 191, 234, 290, 330, 310],
    color: '#91cc75'
  }
]

const categories = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
</script>
```

### 3. 饼图

```vue
<template>
  <ChartWrapper type="pie" title="流量来源" :data="pieData" />
</template>

<script setup>
const pieData = [
  { value: 1048, name: '搜索引擎' },
  { value: 735, name: '直接访问' },
  { value: 580, name: '邮件营销' },
  { value: 484, name: '联盟广告' },
  { value: 300, name: '视频广告' }
]
</script>
```

### 4. 雷达图

```vue
<template>
  <ChartWrapper type="radar" title="产品对比" :data="radarData" :x-axis-data="indicators" />
</template>

<script setup>
const radarData = [
  { value: [85, 90, 75, 80, 95, 88], name: '产品A' },
  { value: [70, 85, 90, 75, 80, 85], name: '产品B' }
]

const indicators = ['性能', '稳定性', '易用性', '功能', '价格', '服务']
</script>
```

## API 参考

### Props

| 参数          | 类型                                                                                   | 默认值    | 说明                         |
| ------------- | -------------------------------------------------------------------------------------- | --------- | ---------------------------- |
| type          | `'line' \| 'bar' \| 'pie' \| 'scatter' \| 'radar' \| 'gauge' \| 'funnel' \| 'heatmap'` | -         | 图表类型                     |
| title         | `string`                                                                               | -         | 图表标题                     |
| data          | `any[]`                                                                                | -         | 图表数据                     |
| xAxisData     | `string[]`                                                                             | -         | X 轴数据（部分图表类型需要） |
| width         | `string`                                                                               | `'100%'`  | 图表宽度                     |
| height        | `string`                                                                               | `'400px'` | 图表高度                     |
| theme         | `'light' \| 'dark'`                                                                    | `'light'` | 主题                         |
| customOptions | `any`                                                                                  | -         | 自定义 ECharts 配置          |

### 方法

```typescript
// 获取图表实例
const chartRef = ref()
const chartInstance = chartRef.value?.getChartInstance()

// 使用 ECharts 原生方法
chartInstance?.setOption(newOption)
chartInstance?.resize()
```

## 数据格式

### 折线图/柱状图

```typescript
interface LineBarData {
  name: string // 系列名称
  data: number[] // 数据数组
  color?: string // 自定义颜色
}

// 示例
const data: LineBarData[] = [{ name: '系列1', data: [120, 200, 150], color: '#5470c6' }]

const xAxisData = ['类目1', '类目2', '类目3']
```

### 饼图

```typescript
interface PieData {
  value: number // 数值
  name: string // 名称
}

// 示例
const data: PieData[] = [
  { value: 1048, name: '搜索引擎' },
  { value: 735, name: '直接访问' }
]
```

### 散点图

```typescript
interface ScatterData {
  name: string // 数据集名称
  data: number[][] // 坐标点数组 [[x1, y1], [x2, y2]]
}

// 示例
const data: ScatterData[] = [
  {
    name: '数据集1',
    data: [
      [10, 20],
      [30, 40],
      [50, 60]
    ]
  }
]
```

### 雷达图

```typescript
interface RadarData {
  value: number[] // 各维度数值
  name: string // 数据名称
}

// 示例
const data: RadarData[] = [{ value: [85, 90, 75, 80, 95], name: '产品A' }]

const xAxisData = ['维度1', '维度2', '维度3', '维度4', '维度5']
```

### 仪表盘

```typescript
interface GaugeData {
  value: number // 当前值
  name: string // 名称
}

// 示例
const data: GaugeData[] = [{ value: 75, name: '完成率' }]
```

### 漏斗图

```typescript
interface FunnelData {
  value: number // 数值
  name: string // 阶段名称
}

// 示例
const data: FunnelData[] = [
  { value: 100, name: '访问' },
  { value: 80, name: '咨询' },
  { value: 60, name: '订单' }
]
```

### 热力图

```typescript
interface HeatmapData {
  data: number[][] // 数据点 [[x, y, value]]
  yAxisData: string[] // Y 轴类目
}

// 示例
const data: HeatmapData[] = [
  {
    data: [
      [0, 0, 5], // x=0, y=0, value=5
      [0, 1, 10],
      [1, 0, 15]
    ],
    yAxisData: ['类目1', '类目2']
  }
]

const xAxisData = ['类目A', '类目B']
```

## 高级用法

### 1. 自定义配置

```vue
<template>
  <ChartWrapper type="line" :data="chartData" :custom-options="customOptions" />
</template>

<script setup>
const customOptions = {
  grid: {
    left: '10%',
    right: '10%'
  },
  xAxis: {
    axisLabel: {
      rotate: 45
    }
  },
  series: [
    {
      lineStyle: {
        width: 3
      },
      areaStyle: {
        opacity: 0.3
      }
    }
  ]
}
</script>
```

### 2. 主题切换

```vue
<template>
  <el-radio-group v-model="theme">
    <el-radio-button label="light">浅色</el-radio-button>
    <el-radio-button label="dark">深色</el-radio-button>
  </el-radio-group>

  <ChartWrapper type="line" :data="chartData" :theme="theme" />
</template>

<script setup>
const theme = (ref < 'light') | ('dark' > 'light')
</script>
```

### 3. 响应式尺寸

```vue
<template>
  <div class="chart-container">
    <ChartWrapper type="bar" :data="chartData" width="100%" height="100%" />
  </div>
</template>

<style>
.chart-container {
  width: 100%;
  height: 500px;
}
</style>
```

### 4. 获取图表实例

```vue
<template>
  <ChartWrapper ref="chartRef" type="line" :data="chartData" />
  <el-button @click="exportImage">导出图片</el-button>
</template>

<script setup>
const chartRef = ref()

const exportImage = () => {
  const instance = chartRef.value?.getChartInstance()
  const url = instance?.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })

  // 下载图片
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart.png'
  a.click()
}
</script>
```

## 可视化配置器

访问 `/charts` 路由可以使用可视化配置器：

### 功能

- ✅ 实时预览
- ✅ 图表类型切换
- ✅ 数据系列管理
- ✅ 主题切换
- ✅ 代码示例
- ✅ 数据格式说明

### 操作步骤

1. 选择图表类型
2. 配置标题和尺寸
3. 添加/编辑数据系列
4. 切换主题查看效果
5. 复制代码示例使用

## 最佳实践

### 1. 数据准备

```typescript
// ✅ 推荐：使用计算属性
const chartData = computed(() => {
  return rawData.value.map(item => ({
    name: item.label,
    data: item.values
  }))
})

// ❌ 避免：直接使用原始数据
const chartData = rawData
```

### 2. 性能优化

```typescript
// 大数据量时使用采样
const sampledData = computed(() => {
  if (rawData.value.length > 1000) {
    return rawData.value.filter((_, i) => i % 10 === 0)
  }
  return rawData.value
})
```

### 3. 错误处理

```typescript
// 确保数据有效
const safeData = computed(() => {
  return chartData.value.filter(item => item.data && Array.isArray(item.data))
})
```

### 4. 响应式布局

```vue
<template>
  <div class="responsive-chart">
    <ChartWrapper type="line" :data="chartData" width="100%" :height="chartHeight" />
  </div>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'

const { height } = useWindowSize()
const chartHeight = computed(() => `${height.value * 0.6}px`)
</script>
```

## 常见问题

### Q: 图表不显示？

A: 检查以下几点：

1. 确保数据格式正确
2. 确保容器有明确的宽高
3. 检查控制台是否有错误

### Q: 如何自定义颜色？

A:

```typescript
// 方式1：在数据中指定
const data = [
  { name: '系列1', data: [...], color: '#ff0000' }
]

// 方式2：使用 customOptions
const customOptions = {
  color: ['#ff0000', '#00ff00', '#0000ff']
}
```

### Q: 如何导出图表？

A:

```typescript
const instance = chartRef.value?.getChartInstance()
const url = instance?.getDataURL()
// 下载或上传 url
```

### Q: 如何实现动态更新？

A:

```typescript
// 使用响应式数据，图表会自动更新
const chartData = ref([...])

// 更新数据
chartData.value = newData
```

## 扩展开发

### 添加新图表类型

1. 在 `ChartWrapper.vue` 中导入图表类型

```typescript
import { TreemapChart } from 'echarts/charts'
use([TreemapChart])
```

2. 添加类型定义

```typescript
type: 'line' | 'bar' | ... | 'treemap'
```

3. 添加配置生成逻辑

```typescript
case 'treemap':
  return {
    series: [{
      type: 'treemap',
      data: props.data
    }]
  }
```

## 参考资源

- [ECharts 官方文档](https://echarts.apache.org/zh/index.html)
- [vue-echarts GitHub](https://github.com/ecomfe/vue-echarts)
- [ECharts 配置项手册](https://echarts.apache.org/zh/option.html)

## 总结

这个图表组件提供了：

1. ✅ **8 种常用图表类型**
2. ✅ **简洁的 API 设计**
3. ✅ **可视化配置器**
4. ✅ **主题切换**
5. ✅ **响应式支持**
6. ✅ **自定义扩展**
7. ✅ **完整的文档**

适用于各种数据可视化场景，快速构建专业的图表应用。
