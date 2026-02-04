<template>
  <div class="scatter-chart-demo">
    <el-page-header @back="$router.back()" content="散点图组件示例" />

    <div class="demo-controls">
      <el-space wrap>
        <el-button type="primary" @click="generateData">生成数据</el-button>
        <el-input-number
          v-model="dataCount"
          :min="1000"
          :max="500000"
          :step="10000"
          controls-position="right"
        />
        <span>个数据点</span>
        <el-button @click="clearAllSelections">清除所有选择</el-button>
        <el-button @click="resetAllCharts">重置所有图表</el-button>
      </el-space>
    </div>

    <el-divider />

    <div class="charts-grid">
      <el-card
        v-for="(chart, index) in charts"
        :key="index"
        class="chart-card"
        :body-style="{ padding: '20px', height: '100%' }"
      >
        <template #header>
          <div class="card-header">
            <span>{{ chart.title }}</span>
            <el-tag v-if="chart.visible" type="success" size="small">可见</el-tag>
            <el-tag v-else type="info" size="small">不可见</el-tag>
          </div>
        </template>

        <ScatterChart
          :ref="el => setChartRef(el, index)"
          :data="chart.data"
          :title="chart.title"
          :height="400"
          :color="chart.color"
          :enable-zoom="true"
          :enable-brush="true"
          :enable-sampling="false"
          :lazy-load="true"
          :root-margin="'100px'"
          :threshold="0.1"
          @brush-selected="data => handleBrushSelected(index, data)"
          @brush-end="data => handleBrushEnd(index, data)"
          @visible="visible => handleVisible(index, visible)"
          @chart-ready="handleChartReady(index)"
        />

        <div v-if="chart.selectedCount > 0" class="selection-info">
          <el-tag type="warning">已选择 {{ chart.selectedCount }} 个点</el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ScatterChart } from '@/components/scatter-chart'
import type { ScatterDataPoint } from '@/components/scatter-chart'

interface ChartData {
  title: string
  data: ScatterDataPoint[]
  color: string
  visible: boolean
  selectedCount: number
}

// 数据配置
const dataCount = ref(10000)
const charts = ref<ChartData[]>([])
const chartRefs = ref<any[]>([])

// 颜色配置
const colors = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272'
]

/**
 * 生成随机数据
 */
const generateRandomData = (count: number): ScatterDataPoint[] => {
  const data: ScatterDataPoint[] = []
  for (let i = 0; i < count; i++) {
    data.push({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      value: Math.random() * 100,
      name: `Point-${i}`
    })
  }
  return data
}

/**
 * 生成数据
 */
const generateData = () => {
  const startTime = performance.now()
  
  // 减少到 6 个图表，避免内存爆炸
  charts.value = Array.from({ length: 6 }, (_, index) => ({
    title: `散点图 ${index + 1}`,
    data: generateRandomData(dataCount.value),
    color: colors[index],
    visible: false,
    selectedCount: 0
  }))

  const endTime = performance.now()
  ElMessage.success(
    `成功生成 ${charts.value.length} 个图表，每个包含 ${dataCount.value.toLocaleString()} 个数据点，耗时 ${(
      (endTime - startTime) /
      1000
    ).toFixed(2)}s`
  )
}

/**
 * 设置图表引用
 */
const setChartRef = (el: any, index: number) => {
  if (el) {
    chartRefs.value[index] = el
  }
}

/**
 * 处理框选事件
 */
const handleBrushSelected = (index: number, data: ScatterDataPoint[]) => {
  charts.value[index].selectedCount = data.length
}

/**
 * 处理框选结束事件
 */
const handleBrushEnd = (index: number, data: ScatterDataPoint[]) => {
  console.log(`图表 ${index + 1} 框选结束，选中 ${data.length} 个点`)
}

/**
 * 处理可见性变化
 */
const handleVisible = (index: number, visible: boolean) => {
  charts.value[index].visible = visible
  console.log(`图表 ${index + 1} ${visible ? '进入' : '离开'}可见区域`)
}

/**
 * 处理图表就绪
 */
const handleChartReady = (index: number) => {
  console.log(`图表 ${index + 1} 已就绪`)
}

/**
 * 清除所有选择
 */
const clearAllSelections = () => {
  chartRefs.value.forEach((chart, index) => {
    if (chart) {
      chart.clearSelection()
      charts.value[index].selectedCount = 0
    }
  })
  ElMessage.success('已清除所有选择')
}

/**
 * 重置所有图表
 */
const resetAllCharts = () => {
  chartRefs.value.forEach((chart, index) => {
    if (chart) {
      chart.resetChart()
      charts.value[index].selectedCount = 0
    }
  })
  ElMessage.success('已重置所有图表')
}

// 初始化
onMounted(() => {
  generateData()
})
</script>

<style scoped>
.scatter-chart-demo {
  padding: 20px;
}

.demo-controls {
  margin-top: 20px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.chart-card {
  height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-info {
  margin-top: 12px;
  text-align: center;
}

@media (max-width: 1400px) {
  .charts-grid {
    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  }
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
