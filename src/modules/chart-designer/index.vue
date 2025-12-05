<template>
  <div class="chart-designer">
    <!-- 左侧图表选择器 -->
    <div class="designer-sidebar">
      <ChartSelector @select="handleChartSelect" />
    </div>

    <!-- 右侧画布区域 -->
    <div class="designer-main">
      <div class="toolbar">
        <el-radio-group v-model="addMode" size="small">
          <el-radio-button value="independent">独立显示</el-radio-button>
          <el-radio-button value="mixed">合并到混合图表</el-radio-button>
        </el-radio-group>
      </div>
      <ChartCanvas
        :charts="charts"
        @remove="removeChart"
        @clear="clearCharts"
        @clear-mixed="clearMixedCharts"
        @split="splitMixedCharts"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChartSelector from './components/ChartSelector.vue'
import ChartCanvas from './components/ChartCanvas.vue'
import { useChartLibrary } from './composables/useChartLibrary'
import type { ChartInstance, ChartType } from './types'

const { getChartDefaultOption } = useChartLibrary()
const charts = ref<ChartInstance[]>([])
const addMode = ref<'independent' | 'mixed'>('independent')

// 选择图表类型
const handleChartSelect = (type: ChartType) => {
  const chartNames: Record<ChartType, string> = {
    line: '折线图',
    bar: '柱状图',
    pie: '饼图',
    scatter: '散点图',
    radar: '雷达图',
    gauge: '仪表盘',
    funnel: '漏斗图',
    candlestick: 'K线图'
  }

  const newChart: ChartInstance = {
    id: `chart-${Date.now()}`,
    type,
    name: chartNames[type] || '图表',
    option: getChartDefaultOption(type),
    position: { x: 0, y: 0 },
    size: { width: 500, height: 400 },
    mixed: addMode.value === 'mixed'
  }

  charts.value.push(newChart)
}

// 移除图表
const removeChart = (id: string) => {
  const index = charts.value.findIndex(chart => chart.id === id)
  if (index > -1) {
    charts.value.splice(index, 1)
  }
}

// 清空所有图表
const clearCharts = () => {
  charts.value = []
}

// 清空混合图表
const clearMixedCharts = () => {
  charts.value = charts.value.filter(chart => !chart.mixed)
}

// 拆分混合图表
const splitMixedCharts = () => {
  charts.value = charts.value.map(chart => ({
    ...chart,
    mixed: false
  }))
}
</script>

<style scoped lang="scss">
.chart-designer {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.designer-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.designer-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
