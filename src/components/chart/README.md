# Chart Components

可复用的图表组件库，基于 Vue 3 + ECharts。

## 📦 组件列表

- **LineChart** - 折线图
- **BarChart** - 柱状图
- **PieChart** - 饼图
- **ScatterChart** - 散点图
- **RadarChart** - 雷达图
- **GaugeChart** - 仪表盘

## 🎯 使用方式

### 1. 直接使用组件

```vue
<template>
  <LineChart :option="lineOption" width="600px" height="400px" />
</template>

<script setup>
import { LineChart } from '@/components/chart'

const lineOption = {
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [120, 200, 150] }]
}
</script>
```

### 2. 使用默认配置

```typescript
import { defaultLineChartOption } from '@/components/chart'

// 获取默认配置
const option = { ...defaultLineChartOption }

// 修改配置
option.title.text = '我的折线图'
```

### 3. 使用 useOption Hook

```typescript
import { useOption, defaultLineChartOption } from '@/components/chart'

const manager = useOption(defaultLineChartOption)

// 动态配置
manager.setTitle('销售数据')
manager.setXAxis({ type: 'category', data: ['一月', '二月', '三月'] })
manager.addSeries({ name: '销量', type: 'line', data: [120, 200, 150] })

// 使用配置
const finalOption = manager.getOption()
```

### 4. 使用 useChartStore（多图表管理）

```typescript
import { useChartStore } from '@/components/chart'

const store = useChartStore()

// 添加图表
const chartId = store.addChart({
  type: 'line',
  name: '折线图',
  option: lineOption
})

// 创建混合图表
store.createMixedChart([chartId1, chartId2], '混合图表')
```

## 📁 组件结构

每个图表组件都遵循统一的结构：

```
ComponentName/
├── props.ts           # Props 定义和默认配置
├── ComponentName.vue  # Vue 组件
└── index.ts           # 统一导出
```

## 🔧 API

### Props

所有图表组件都支持以下 Props：

- `option?: EChartsOption` - ECharts 配置对象
- `width?: string` - 图表宽度（默认 '100%'）
- `height?: string` - 图表高度（默认 '400px'）

### useOption Hook

提供的配置管理方法：

- `setTitle(title)` - 设置标题
- `setXAxis(xAxis)` - 设置 X 轴
- `setYAxis(yAxis)` - 设置 Y 轴
- `setSeries(series)` - 设置系列
- `addSeries(series)` - 添加系列
- `removeSeries(index)` - 删除系列
- `setLegend(legend)` - 设置图例
- `setTooltip(tooltip)` - 设置提示框
- `setGrid(grid)` - 设置网格
- `setColor(colors)` - 设置颜色
- `updateOption(updates)` - 深度合并更新
- `resetOption()` - 重置配置
- `getOption()` - 获取当前配置

## 📊 在 chart-designer 中使用

chart-designer 模块会自动导入这些组件和配置：

```typescript
import {
  defaultLineChartOption,
  defaultBarChartOption,
  // ... 其他默认配置
} from '@/components/chart'
```

## 🎨 扩展新图表

1. 在 `src/components/chart/` 下创建新文件夹
2. 按照现有结构创建 `props.ts`、`ComponentName.vue`、`index.ts`
3. 在 `src/components/chart/index.ts` 中导出
4. 在 chart-designer 中即可使用
