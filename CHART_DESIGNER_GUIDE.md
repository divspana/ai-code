# 📊 图表可视化配置系统使用指南

## 🎯 系统概述

基于 vue-echarts 的图表可视化配置系统，支持多种图表类型的组件化封装和可视化编辑。

## ✨ 核心特性

### 1. 组件化图表库
- ✅ **折线图 (LineChart)** - 展示趋势变化
- ✅ **柱状图 (BarChart)** - 数据对比
- ✅ **饼图 (PieChart)** - 占比展示
- ✅ **散点图 (ScatterChart)** - 关系分析
- ✅ **雷达图 (RadarChart)** - 多维数据
- ✅ **仪表盘 (GaugeChart)** - 进度展示

### 2. 可视化编辑器
- ✅ 图表选择器 - 左侧图表库
- ✅ 画布容器 - 多图表展示
- ✅ 配置导出 - JSON 格式

### 3. 灵活的架构
- ✅ 每个图表类型独立组件
- ✅ 统一的 option 配置导出
- ✅ 支持多图表组合显示

## 📁 项目结构

```
src/modules/chart-designer/
├── components/
│   ├── charts/              # 图表组件库
│   │   ├── LineChart.vue    # 折线图
│   │   ├── BarChart.vue     # 柱状图
│   │   ├── PieChart.vue     # 饼图
│   │   ├── ScatterChart.vue # 散点图
│   │   ├── RadarChart.vue   # 雷达图
│   │   ├── GaugeChart.vue   # 仪表盘
│   │   └── index.ts         # 统一导出
│   ├── ChartSelector.vue    # 图表选择器
│   └── ChartCanvas.vue      # 画布容器
├── composables/
│   └── useChartLibrary.ts   # 图表库管理
├── types/
│   └── index.ts             # 类型定义
└── index.vue                # 主页面
```

## 🚀 快速开始

### 1. 访问图表设计器

```
http://localhost:5173/chart-designer
```

### 2. 使用流程

1. **选择图表** - 点击左侧图表库中的图表类型
2. **查看预览** - 图表自动添加到右侧画布
3. **多图组合** - 可以添加多个不同类型的图表
4. **导出配置** - 点击"导出配置"按钮下载 JSON

## 💡 使用示例

### 1. 独立使用图表组件

```vue
<template>
  <LineChart :option="lineOption" width="600px" height="400px" />
</template>

<script setup lang="ts">
import { LineChart } from '@/modules/chart-designer/components/charts'

const lineOption = {
  title: { text: '销售趋势' },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月']
  },
  yAxis: { type: 'value' },
  series: [{
    type: 'line',
    data: [120, 200, 150, 80, 70]
  }]
}
</script>
```

### 2. 使用图表库

```typescript
import { useChartLibrary } from '@/modules/chart-designer/composables/useChartLibrary'

const { chartLibrary, getChartDefaultOption } = useChartLibrary()

// 获取所有图表类型
console.log(chartLibrary.value)

// 获取默认配置
const lineOption = getChartDefaultOption('line')
```

### 3. 动态渲染图表

```vue
<template>
  <component
    :is="ChartComponents[chartType]"
    :option="chartOption"
    width="100%"
    height="400px"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChartComponents } from '@/modules/chart-designer/components/charts'
import type { ChartType } from '@/modules/chart-designer/types'

const chartType = ref<ChartType>('line')
const chartOption = ref({
  // ECharts 配置
})
</script>
```

## 📖 图表组件 API

### 通用 Props

所有图表组件都支持以下 props：

```typescript
interface ChartProps {
  option?: EChartsOption  // ECharts 配置对象
  width?: string          // 宽度，默认 '100%'
  height?: string         // 高度，默认 '400px'
}
```

### 导出的默认配置

每个图表组件都导出 `getDefaultOption` 函数：

```typescript
import { getDefaultOption } from './LineChart.vue'

const defaultOption = getDefaultOption()
```

## 🎨 自定义图表

### 1. 创建新图表组件

```vue
<!-- src/modules/chart-designer/components/charts/CustomChart.vue -->
<template>
  <v-chart :option="chartOption" :style="{ width, height }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
// 导入需要的图表类型和组件
import type { EChartsOption } from 'echarts'

// 注册 ECharts 组件
use([CanvasRenderer, /* 其他组件 */])

interface Props {
  option?: EChartsOption
  width?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px'
})

const defaultOption: EChartsOption = {
  // 默认配置
}

const chartOption = computed(() => props.option || defaultOption)

export const getDefaultOption = (): EChartsOption => defaultOption
</script>
```

### 2. 注册到图表库

```typescript
// src/modules/chart-designer/components/charts/index.ts
import CustomChart from './CustomChart.vue'

export const ChartComponents = {
  line: LineChart,
  bar: BarChart,
  custom: CustomChart  // 添加新图表
}
```

### 3. 添加到图表库

```typescript
// src/modules/chart-designer/composables/useChartLibrary.ts
const chartLibrary = ref<ChartLibraryItem[]>([
  // ...其他图表
  {
    type: 'custom',
    name: '自定义图表',
    icon: 'DataLine',
    description: '自定义图表描述',
    defaultOption: {
      // 默认配置
    }
  }
])
```

## 🔧 配置导出格式

导出的 JSON 配置格式：

```json
{
  "charts": [
    {
      "type": "line",
      "name": "折线图",
      "option": {
        "title": { "text": "折线图" },
        "xAxis": { "type": "category", "data": [...] },
        "yAxis": { "type": "value" },
        "series": [...]
      },
      "size": {
        "width": 500,
        "height": 400
      }
    }
  ],
  "exportTime": "2024-12-05T14:30:00.000Z"
}
```

## 🎯 高级用法

### 1. 图表联动

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const chart1Option = ref({...})
const chart2Option = ref({...})

// 监听图表1的数据变化，更新图表2
watch(() => chart1Option.value.series, (newSeries) => {
  // 更新 chart2Option
})
</script>
```

### 2. 数据实时更新

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

const chartOption = ref({...})

let timer: number

onMounted(() => {
  timer = setInterval(() => {
    // 更新数据
    chartOption.value.series[0].data = generateNewData()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
```

### 3. 响应式布局

```vue
<template>
  <div class="chart-grid">
    <LineChart
      v-for="chart in charts"
      :key="chart.id"
      :option="chart.option"
      :style="getChartStyle(chart)"
    />
  </div>
</template>

<style scoped>
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}
</style>
```

## 📊 ECharts 配置参考

### 常用配置项

```typescript
const option: EChartsOption = {
  // 标题
  title: {
    text: '主标题',
    subtext: '副标题',
    left: 'center'
  },
  
  // 提示框
  tooltip: {
    trigger: 'axis',  // 'item' | 'axis' | 'none'
    axisPointer: {
      type: 'shadow'  // 'line' | 'shadow' | 'cross'
    }
  },
  
  // 图例
  legend: {
    data: ['系列1', '系列2'],
    top: 'bottom'
  },
  
  // 网格
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  
  // X轴
  xAxis: {
    type: 'category',  // 'value' | 'category' | 'time' | 'log'
    data: ['周一', '周二', '周三']
  },
  
  // Y轴
  yAxis: {
    type: 'value'
  },
  
  // 系列
  series: [{
    name: '系列1',
    type: 'line',  // 'line' | 'bar' | 'pie' | 'scatter' | ...
    data: [120, 200, 150]
  }]
}
```

## 🎉 最佳实践

### 1. 性能优化

```typescript
// 使用 shallowRef 优化大数据
import { shallowRef } from 'vue'

const chartOption = shallowRef({...})

// 更新时使用新对象
chartOption.value = { ...newOption }
```

### 2. 类型安全

```typescript
import type { EChartsOption } from 'echarts'

const option: EChartsOption = {
  // TypeScript 会提供完整的类型提示
}
```

### 3. 按需引入

```typescript
// 只引入需要的 ECharts 组件
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, CanvasRenderer])
```

## 🔗 相关资源

- [ECharts 官方文档](https://echarts.apache.org/zh/index.html)
- [vue-echarts GitHub](https://github.com/ecomfe/vue-echarts)
- [ECharts 配置项手册](https://echarts.apache.org/zh/option.html)

## 🎊 总结

这个图表可视化配置系统提供了：

1. ✅ **组件化设计** - 每个图表类型独立封装
2. ✅ **可视化编辑** - 拖拽式图表配置
3. ✅ **灵活扩展** - 易于添加新图表类型
4. ✅ **配置导出** - 支持配置的导入导出
5. ✅ **类型安全** - 完整的 TypeScript 支持

开始创建你的数据可视化大屏吧！🚀
