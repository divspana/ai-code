# ScatterChart 散点图组件

基于 ECharts 的高性能散点图组件，支持 20 万级别数据渲染、缩放、框选高亮等功能。

## 特性

- ✅ **高性能渲染** - 支持 20 万+数据点的流畅渲染
- ✅ **智能数据采样** - 使用网格算法自动过滤重叠点，大幅提升性能
- ✅ **多 Series 优化** - 自动将大数据分成多个 series，每个 1 万条数据
- ✅ **懒加载** - 使用 IntersectionObserver 实现可见性检测，只在可见时渲染
- ✅ **缩放功能** - 支持鼠标滚轮缩放和滑块缩放
- ✅ **框选高亮** - 支持矩形和多边形框选，选中区域高亮，其他区域置灰
- ✅ **渐进式渲染** - 大数据量时自动启用渐进式渲染
- ✅ **响应式** - 自动适应容器大小变化

## 安装

组件已内置在项目中，无需额外安装。

## 基础用法

```vue
<template>
  <ScatterChart
    :data="chartData"
    title="散点图示例"
    :height="400"
    @brush-selected="handleBrushSelected"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ScatterChart } from '@/components/scatter-chart'
import type { ScatterDataPoint } from '@/components/scatter-chart'

const chartData = ref<ScatterDataPoint[]>([
  { x: 10, y: 20, name: 'Point 1' },
  { x: 30, y: 40, name: 'Point 2' },
  // ... 更多数据
])

const handleBrushSelected = (data: ScatterDataPoint[]) => {
  console.log('选中的数据:', data)
}
</script>
```

## Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| data | 散点数据 | `ScatterDataPoint[]` | `[]` |
| title | 图表标题 | `string` | - |
| width | 图表宽度 | `string \| number` | `'100%'` |
| height | 图表高度 | `string \| number` | `400` |
| enableLargeMode | 是否启用大数据模式 | `boolean` | `true` |
| largeThreshold | 大数据模式阈值 | `number` | `2000` |
| enableSampling | 是否启用数据采样 | `boolean` | `true` |
| gridSize | 网格大小（像素），不设置则自动计算 | `number` | - |
| samplingThreshold | 启用采样的数据量阈值 | `number` | `50000` |
| keepStrategy | 网格内保留策略 | `'first' \| 'last' \| 'random' \| 'center'` | `'center'` |
| showSamplingInfo | 是否显示采样信息 | `boolean` | `false` |
| enableZoom | 是否启用缩放 | `boolean` | `true` |
| enableBrush | 是否启用框选 | `boolean` | `true` |
| symbolSize | 点的大小 | `number \| Function` | `4` |
| color | 点的颜色 | `string` | `'#5470c6'` |
| selectedColor | 选中点的颜色 | `string` | `'#ee6666'` |
| unselectedColor | 未选中点的颜色 | `string` | `'#cccccc'` |
| lazyLoad | 是否启用懒加载 | `boolean` | `true` |
| rootMargin | IntersectionObserver 的 rootMargin | `string` | `'50px'` |
| threshold | IntersectionObserver 的 threshold | `number` | `0.1` |

## Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| brush-selected | 框选时触发 | `(data: ScatterDataPoint[])` |
| brush-end | 框选结束时触发 | `(data: ScatterDataPoint[])` |
| visible | 可见性变化时触发 | `(visible: boolean)` |
| chart-ready | 图表初始化完成时触发 | - |

## Methods

通过 ref 可以调用以下方法：

| 方法名 | 说明 | 参数 |
|--------|------|------|
| clearSelection | 清除选择 | - |
| resetChart | 重置图表 | - |
| resize | 调整图表大小 | - |
| getChartInstance | 获取 ECharts 实例 | - |

## 数据格式

```typescript
interface ScatterDataPoint {
  x: number          // X 坐标
  y: number          // Y 坐标
  value?: number     // 值（可选）
  name?: string      // 名称（可选）
  [key: string]: any // 其他自定义属性
}
```

## 高级用法

### 大数据量渲染

```vue
<template>
  <ScatterChart
    :data="largeData"
    :enable-large-mode="true"
    :large-threshold="2000"
    :height="600"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 生成 20 万数据点
const largeData = ref(
  Array.from({ length: 200000 }, (_, i) => ({
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    name: `Point-${i}`
  }))
)
</script>
```

### 框选高亮

```vue
<template>
  <ScatterChart
    :data="chartData"
    :enable-brush="true"
    selected-color="#ee6666"
    unselected-color="#cccccc"
    @brush-selected="handleBrushSelected"
    @brush-end="handleBrushEnd"
  />
</template>

<script setup lang="ts">
const handleBrushSelected = (data: ScatterDataPoint[]) => {
  console.log(`选中了 ${data.length} 个点`)
}

const handleBrushEnd = (data: ScatterDataPoint[]) => {
  console.log('框选结束，选中数据:', data)
}
</script>
```

### 懒加载（多图表场景）

```vue
<template>
  <div class="charts-container">
    <ScatterChart
      v-for="(chart, index) in charts"
      :key="index"
      :data="chart.data"
      :title="chart.title"
      :lazy-load="true"
      :root-margin="'100px'"
      @visible="visible => handleVisible(index, visible)"
    />
  </div>
</template>

<script setup lang="ts">
const handleVisible = (index: number, visible: boolean) => {
  console.log(`图表 ${index} ${visible ? '进入' : '离开'}可见区域`)
}
</script>
```

### 调用组件方法

```vue
<template>
  <div>
    <ScatterChart ref="chartRef" :data="chartData" />
    <el-button @click="clearSelection">清除选择</el-button>
    <el-button @click="resetChart">重置图表</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const chartRef = ref()

const clearSelection = () => {
  chartRef.value?.clearSelection()
}

const resetChart = () => {
  chartRef.value?.resetChart()
}
</script>
```

### 数据采样（推荐用于超大数据量）

```vue
<template>
  <ScatterChart
    :data="largeData"
    :enable-sampling="true"
    :sampling-threshold="50000"
    :keep-strategy="'center'"
    :show-sampling-info="true"
    :height="600"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 生成 100 万数据点
const largeData = ref(
  Array.from({ length: 1000000 }, (_, i) => ({
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    name: `Point-${i}`
  }))
)
</script>
```

**采样策略说明：**
- `first` - 保留网格中第一个点
- `last` - 保留网格中最后一个点
- `random` - 随机保留网格中一个点
- `center` - 保留最接近网格中心的点（推荐，分布更均匀）

**工作原理：**
1. 将数据空间划分为网格
2. 每个网格只保留一个点（根据策略选择）
3. 自动过滤重叠点，减少渲染数据量
4. 数据量超过 `samplingThreshold` 时自动启用

## 性能优化

1. **智能数据采样** - 使用网格算法过滤重叠点，100 万数据可减少到 5 万左右
2. **多 Series 分片** - 自动将数据分成多个 series，每个 1 万条数据，避免单个 series 过大
3. **大数据模式** - 当数据量超过 `largeThreshold` 时自动启用，使用更高效的渲染方式
4. **渐进式渲染** - 数据量超过 10000 时启用，分批渲染避免阻塞
5. **懒加载** - 只在图表进入可见区域时才初始化和渲染
6. **防抖处理** - 框选事件使用 300ms 防抖，避免频繁触发

## 注意事项

1. 数据量超过 20 万时，建议启用大数据模式
2. 多图表场景建议启用懒加载，避免一次性渲染所有图表
3. 框选后的数据会触发重新渲染以应用高亮效果
4. 组件会自动监听窗口大小变化并调整图表尺寸

## 示例

完整示例请查看 `/scatter-chart` 路由页面。
