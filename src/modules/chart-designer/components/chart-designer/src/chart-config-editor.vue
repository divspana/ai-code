<template>
  <div class="config-editor">
    <div class="config-section">
      <h4>基础配置</h4>
      
      <div class="form-item">
        <label>图表标题</label>
        <input 
          v-model="localOption.title.text" 
          @input="emitUpdate"
          placeholder="输入标题"
        />
      </div>

      <div class="form-item" v-if="hasXAxis">
        <label>X轴类型</label>
        <select v-model="xAxisType" @change="updateXAxisType">
          <option value="category">类目轴</option>
          <option value="value">数值轴</option>
          <option value="time">时间轴</option>
        </select>
      </div>

      <div class="form-item" v-if="hasXAxis && xAxisType === 'category'">
        <label>X轴数据 (逗号分隔)</label>
        <input 
          v-model="xAxisDataStr" 
          @input="updateXAxisData"
          placeholder="Mon,Tue,Wed,Thu,Fri"
        />
      </div>

      <div class="form-item" v-if="hasYAxis">
        <label>Y轴名称</label>
        <input 
          v-model="yAxisName" 
          @input="updateYAxisName"
          placeholder="输入Y轴名称"
        />
      </div>
    </div>

    <div class="config-section" v-if="hasSeries">
      <h4>系列配置</h4>
      
      <div 
        v-for="(series, index) in seriesList" 
        :key="index"
        class="series-item"
      >
        <div class="series-header">
          <span>系列 {{ index + 1 }}</span>
          <button @click="removeSeries(index)" class="btn-remove">删除</button>
        </div>

        <div class="form-item">
          <label>系列名称</label>
          <input 
            v-model="series.name" 
            @input="emitUpdate"
            placeholder="系列名称"
          />
        </div>

        <div class="form-item">
          <label>数据 (逗号分隔)</label>
          <input 
            :value="getSeriesDataStr(series)"
            @input="updateSeriesData(index, $event)"
            placeholder="120,200,150,80,70"
          />
        </div>

        <div class="form-item" v-if="series.type === 'line'">
          <label>
            <input 
              type="checkbox" 
              v-model="series.smooth"
              @change="emitUpdate"
            />
            平滑曲线
          </label>
        </div>

        <div class="form-item" v-if="series.type === 'line' || series.type === 'bar'">
          <label>
            <input 
              type="checkbox" 
              :checked="series.stack !== undefined"
              @change="toggleStack(index)"
            />
            堆叠
          </label>
        </div>
      </div>

      <button @click="addSeries" class="btn-add">添加系列</button>
    </div>

    <div class="config-section">
      <h4>样式配置</h4>
      
      <div class="form-item">
        <label>
          <input 
            type="checkbox" 
            :checked="hasLegend"
            @change="toggleLegend"
          />
          显示图例
        </label>
      </div>

      <div class="form-item">
        <label>
          <input 
            type="checkbox" 
            :checked="hasTooltip"
            @change="toggleTooltip"
          />
          显示提示框
        </label>
      </div>

      <div class="form-item">
        <label>
          <input 
            type="checkbox" 
            :checked="hasGrid"
            @change="toggleGrid"
          />
          显示网格
        </label>
      </div>
    </div>

    <div class="config-actions">
      <button @click="resetConfig" class="btn-outline">重置配置</button>
      <button @click="applyConfig" class="btn-primary">应用配置</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import type { ChartInstance } from '../../../composables/useChartStore'

const props = defineProps<{
  chart: ChartInstance
}>()

const emit = defineEmits<{
  update: [option: EChartsOption]
}>()

// 本地配置副本
const localOption = ref<any>(JSON.parse(JSON.stringify(props.chart.option)))

// 监听 chart 变化
watch(() => props.chart, (newChart) => {
  localOption.value = JSON.parse(JSON.stringify(newChart.option))
}, { deep: true })

// 计算属性
const hasXAxis = computed(() => !!localOption.value.xAxis)
const hasYAxis = computed(() => !!localOption.value.yAxis)
const hasSeries = computed(() => !!localOption.value.series)
const hasLegend = computed(() => !!localOption.value.legend)
const hasTooltip = computed(() => !!localOption.value.tooltip)
const hasGrid = computed(() => !!localOption.value.grid)

const xAxisType = ref(localOption.value.xAxis?.type || 'category')
const xAxisDataStr = ref(
  Array.isArray(localOption.value.xAxis?.data) 
    ? localOption.value.xAxis.data.join(',') 
    : ''
)
const yAxisName = ref(localOption.value.yAxis?.name || '')

const seriesList = computed(() => {
  const series = localOption.value.series
  return Array.isArray(series) ? series : series ? [series] : []
})

// 更新方法
const emitUpdate = () => {
  emit('update', localOption.value)
}

const updateXAxisType = () => {
  if (localOption.value.xAxis) {
    localOption.value.xAxis.type = xAxisType.value
    emitUpdate()
  }
}

const updateXAxisData = () => {
  if (localOption.value.xAxis) {
    localOption.value.xAxis.data = xAxisDataStr.value.split(',').map(s => s.trim())
    emitUpdate()
  }
}

const updateYAxisName = () => {
  if (localOption.value.yAxis) {
    localOption.value.yAxis.name = yAxisName.value
    emitUpdate()
  }
}

const getSeriesDataStr = (series: any) => {
  if (!series.data) return ''
  return Array.isArray(series.data) 
    ? series.data.map((d: any) => Array.isArray(d) ? d.join(':') : d).join(',')
    : ''
}

const updateSeriesData = (index: number, event: Event) => {
  const value = (event.target as HTMLInputElement).value
  const data = value.split(',').map(s => {
    const trimmed = s.trim()
    return trimmed.includes(':') 
      ? trimmed.split(':').map(Number)
      : Number(trimmed) || 0
  })
  
  if (Array.isArray(localOption.value.series)) {
    localOption.value.series[index].data = data
  }
  emitUpdate()
}

const addSeries = () => {
  const newSeries = {
    name: `系列${seriesList.value.length + 1}`,
    type: props.chart.type,
    data: [0, 0, 0, 0, 0]
  }
  
  if (!localOption.value.series) {
    localOption.value.series = []
  }
  
  if (Array.isArray(localOption.value.series)) {
    localOption.value.series.push(newSeries)
  } else {
    localOption.value.series = [localOption.value.series, newSeries]
  }
  
  emitUpdate()
}

const removeSeries = (index: number) => {
  if (Array.isArray(localOption.value.series)) {
    localOption.value.series.splice(index, 1)
    emitUpdate()
  }
}

const toggleStack = (index: number) => {
  if (Array.isArray(localOption.value.series)) {
    const series = localOption.value.series[index]
    if (series.stack) {
      delete series.stack
    } else {
      series.stack = 'total'
    }
    emitUpdate()
  }
}

const toggleLegend = () => {
  if (localOption.value.legend) {
    delete localOption.value.legend
  } else {
    localOption.value.legend = { data: [] }
  }
  emitUpdate()
}

const toggleTooltip = () => {
  if (localOption.value.tooltip) {
    delete localOption.value.tooltip
  } else {
    localOption.value.tooltip = { trigger: 'axis' }
  }
  emitUpdate()
}

const toggleGrid = () => {
  if (localOption.value.grid) {
    delete localOption.value.grid
  } else {
    localOption.value.grid = { left: '3%', right: '4%', bottom: '3%', containLabel: true }
  }
  emitUpdate()
}

const resetConfig = () => {
  localOption.value = JSON.parse(JSON.stringify(props.chart.option))
  emitUpdate()
}

const applyConfig = () => {
  emitUpdate()
}
</script>

<style scoped>
.config-editor {
  font-size: 14px;
}

.config-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.config-section:last-child {
  border-bottom: none;
}

.config-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.form-item {
  margin-bottom: 12px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.form-item input[type="text"],
.form-item input:not([type]),
.form-item select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
}

.form-item input[type="checkbox"] {
  margin-right: 6px;
}

.series-item {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.series-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
}

.btn-remove {
  padding: 2px 8px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.btn-add {
  width: 100%;
  padding: 8px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.config-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  flex: 1;
  padding: 8px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-outline {
  flex: 1;
  padding: 8px;
  background: white;
  color: #409eff;
  border: 1px solid #409eff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
</style>
