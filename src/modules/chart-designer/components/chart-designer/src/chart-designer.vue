<template>
  <div class="chart-designer">
    <!-- 工具栏 -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <button @click="addNewChart" class="btn-primary">
          添加图表
        </button>
        <button @click="createMixed" class="btn-secondary" :disabled="selectedCharts.length < 2">
          创建混合图表 ({{ selectedCharts.length }})
        </button>
      </div>
      <div class="toolbar-right">
        <button @click="exportConfig" class="btn-outline">
          导出配置
        </button>
      </div>
    </div>

    <div class="designer-content">
      <!-- 左侧：图表库 -->
      <div class="chart-library">
        <h3>图表库</h3>
        <div class="chart-types">
          <div 
            v-for="type in chartTypes" 
            :key="type.type"
            class="chart-type-item"
            @click="selectChartType(type)"
          >
            <div class="chart-icon">{{ type.icon }}</div>
            <div class="chart-name">{{ type.name }}</div>
          </div>
        </div>

        <h3 style="margin-top: 20px;">已添加图表</h3>
        <div class="chart-list">
          <div 
            v-for="chart in store.charts.value" 
            :key="chart.id"
            class="chart-item"
            :class="{ selected: chart.selected }"
            @click="handleChartClick(chart)"
          >
            <input 
              type="checkbox" 
              :checked="selectedCharts.includes(chart.id)"
              @change="toggleChartSelection(chart.id)"
              @click.stop
            />
            <span class="chart-item-name">{{ chart.name }}</span>
            <div class="chart-item-actions">
              <button @click.stop="editChart(chart)" class="btn-icon">✏️</button>
              <button @click.stop="deleteChart(chart.id)" class="btn-icon">🗑️</button>
            </div>
          </div>
        </div>

        <h3 v-if="store.mixedCharts.value.length > 0" style="margin-top: 20px;">混合图表</h3>
        <div class="chart-list">
          <div 
            v-for="mixed in store.mixedCharts.value" 
            :key="mixed.id"
            class="chart-item mixed"
          >
            <span class="chart-item-name">{{ mixed.name }}</span>
            <div class="chart-item-actions">
              <button @click.stop="splitMixed(mixed.id)" class="btn-icon">📊</button>
              <button @click.stop="deleteMixed(mixed.id)" class="btn-icon">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：画布区域 -->
      <div class="chart-canvas">
        <div v-if="store.visibleCharts.value.length === 0 && store.mixedCharts.value.length === 0" class="empty-state">
          <p>从左侧选择图表类型开始设计</p>
        </div>
        
        <!-- 独立图表 -->
        <div 
          v-for="chart in store.visibleCharts.value" 
          :key="chart.id"
          class="chart-container"
          :class="{ selected: chart.selected }"
          @click="store.selectChart(chart.id)"
        >
          <div class="chart-header">
            <span>{{ chart.name }}</span>
            <button @click.stop="store.toggleChartVisibility(chart.id)" class="btn-icon">
              {{ chart.visible ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <component 
            :is="getChartComponent(chart.type)" 
            :option="chart.option"
            width="100%"
            height="300px"
          />
        </div>

        <!-- 混合图表 -->
        <div 
          v-for="mixed in store.mixedCharts.value" 
          :key="mixed.id"
          class="chart-container mixed"
        >
          <div class="chart-header">
            <span>{{ mixed.name }} ({{ mixed.charts.length }} 个图表)</span>
          </div>
          <v-chart 
            :option="mixed.mergedOption"
            style="width: 100%; height: 300px"
            autoresize
          />
        </div>
      </div>

      <!-- 右侧：配置面板 -->
      <div class="config-panel" v-if="store.selectedChart.value">
        <h3>配置面板</h3>
        <div class="config-content">
          <chart-config-editor 
            :chart="store.selectedChart.value"
            @update="handleConfigUpdate"
          />
        </div>
      </div>
    </div>

    <!-- 添加图表对话框 -->
    <teleport to="body">
      <div v-if="showAddDialog" class="modal-overlay" @click="showAddDialog = false">
        <div class="modal-content" @click.stop>
          <h3>添加 {{ selectedType?.name }}</h3>
          <div class="form-group">
            <label>图表名称</label>
            <input v-model="newChartName" placeholder="输入图表名称" />
          </div>
          <div class="modal-actions">
            <button @click="showAddDialog = false" class="btn-outline">取消</button>
            <button @click="confirmAddChart" class="btn-primary">确定</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, shallowRef } from 'vue'
import VChart from 'vue-echarts'
import { useChartStore } from '../../../composables'
import ChartConfigEditor from './chart-config-editor.vue'
import { YLineChart } from '../../line-chart'
import type { ChartInstance } from '../../../composables/useChartStore'

// 图表类型定义
const chartTypes = [
  { type: 'line', name: '折线图', icon: '📈' },
  { type: 'bar', name: '柱状图', icon: '📊' },
  { type: 'pie', name: '饼图', icon: '🥧' },
  { type: 'scatter', name: '散点图', icon: '⚫' },
  { type: 'radar', name: '雷达图', icon: '🎯' },
  { type: 'gauge', name: '仪表盘', icon: '⏱️' }
]

const store = useChartStore()
const showAddDialog = ref(false)
const selectedType = ref<any>(null)
const newChartName = ref('')
const selectedCharts = ref<string[]>([])

// 获取图表组件
const getChartComponent = (type: string) => {
  const components: Record<string, any> = {
    line: YLineChart
    // 其他组件待添加
  }
  return components[type] || YLineChart
}

// 选择图表类型
const selectChartType = (type: any) => {
  selectedType.value = type
  newChartName.value = `${type.name}_${store.charts.value.length + 1}`
  showAddDialog.value = true
}

// 确认添加图表
const confirmAddChart = () => {
  if (!selectedType.value || !newChartName.value) return

  // 获取默认配置
  const defaultOptions: Record<string, any> = {
    line: {
      title: { text: newChartName.value },
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [120, 200, 150, 80, 70, 110, 130] }]
    }
  }

  store.addChart({
    type: selectedType.value.type,
    name: newChartName.value,
    option: defaultOptions[selectedType.value.type] || {}
  })

  showAddDialog.value = false
  selectedType.value = null
  newChartName.value = ''
}

// 添加新图表
const addNewChart = () => {
  if (chartTypes.length > 0) {
    selectChartType(chartTypes[0])
  }
}

// 处理图表点击
const handleChartClick = (chart: ChartInstance) => {
  store.selectChart(chart.id)
}

// 编辑图表
const editChart = (chart: ChartInstance) => {
  store.selectChart(chart.id)
}

// 删除图表
const deleteChart = (id: string) => {
  if (confirm('确定要删除这个图表吗？')) {
    store.removeChart(id)
  }
}

// 切换图表选择
const toggleChartSelection = (id: string) => {
  const index = selectedCharts.value.indexOf(id)
  if (index > -1) {
    selectedCharts.value.splice(index, 1)
  } else {
    selectedCharts.value.push(id)
  }
}

// 创建混合图表
const createMixed = () => {
  if (selectedCharts.value.length < 2) return
  
  const name = `混合图表_${store.mixedCharts.value.length + 1}`
  store.createMixedChart(selectedCharts.value, name)
  selectedCharts.value = []
}

// 拆分混合图表
const splitMixed = (id: string) => {
  if (confirm('确定要拆分这个混合图表吗？')) {
    store.splitMixedChart(id)
  }
}

// 删除混合图表
const deleteMixed = (id: string) => {
  if (confirm('确定要删除这个混合图表吗？')) {
    store.removeMixedChart(id)
  }
}

// 更新配置
const handleConfigUpdate = (option: any) => {
  if (store.selectedChart.value) {
    store.updateChart(store.selectedChart.value.id, option)
  }
}

// 导出配置
const exportConfig = () => {
  const config = {
    charts: store.charts.value,
    mixedCharts: store.mixedCharts.value
  }
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart-config.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.chart-designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.designer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
}

.designer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chart-library {
  width: 250px;
  background: white;
  border-right: 1px solid #e0e0e0;
  padding: 20px;
  overflow-y: auto;
}

.chart-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.chart-type-item {
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-type-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.chart-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.chart-name {
  font-size: 12px;
  color: #606266;
}

.chart-list {
  margin-top: 10px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-item:hover {
  background: #f5f5f5;
}

.chart-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.chart-item.mixed {
  border-color: #67c23a;
}

.chart-item-name {
  flex: 1;
  font-size: 14px;
}

.chart-item-actions {
  display: flex;
  gap: 4px;
}

.chart-canvas {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 16px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.chart-container:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-container.selected {
  border-color: #409eff;
}

.chart-container.mixed {
  border-color: #67c23a;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
}

.config-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e0e0e0;
  padding: 20px;
  overflow-y: auto;
}

.config-content {
  margin-top: 15px;
}

/* 按钮样式 */
.btn-primary {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-primary:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #85ce61;
}

.btn-secondary:disabled {
  background: #b3e19d;
  cursor: not-allowed;
}

.btn-outline {
  padding: 8px 16px;
  background: white;
  color: #409eff;
  border: 1px solid #409eff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-outline:hover {
  background: #ecf5ff;
}

.btn-icon {
  padding: 4px 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn-icon:hover {
  opacity: 0.7;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
}

.form-group {
  margin: 20px 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
