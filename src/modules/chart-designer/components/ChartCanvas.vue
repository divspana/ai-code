<template>
  <div class="chart-canvas">
    <div class="canvas-header">
      <h3>画布</h3>
      <div class="actions">
        <el-button size="small" @click="clearAll">清空</el-button>
        <el-button type="primary" size="small" @click="exportConfig">导出配置</el-button>
      </div>
    </div>
    
    <div class="canvas-content" ref="canvasRef">
      <div
        v-for="chart in charts"
        :key="chart.id"
        class="chart-wrapper"
        :style="{
          width: chart.size.width + 'px',
          height: chart.size.height + 'px'
        }"
      >
        <div class="chart-header">
          <span>{{ chart.name }}</span>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            @click="removeChart(chart.id)"
          />
        </div>
        <component
          :is="ChartComponents[chart.type]"
          :option="chart.option"
          width="100%"
          height="calc(100% - 40px)"
        />
      </div>

      <el-empty
        v-if="charts.length === 0"
        description="从左侧选择图表类型开始设计"
        :image-size="200"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ChartComponents } from './charts'
import type { ChartInstance } from '../types'

interface Props {
  charts: ChartInstance[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  remove: [id: string]
  clear: []
  export: []
}>()

const canvasRef = ref<HTMLElement>()

const removeChart = (id: string) => {
  emit('remove', id)
}

const clearAll = () => {
  emit('clear')
}

const exportConfig = () => {
  if (props.charts.length === 0) {
    ElMessage.warning('画布为空，无法导出')
    return
  }
  
  const config = {
    charts: props.charts.map(chart => ({
      type: chart.type,
      name: chart.name,
      option: chart.option,
      size: chart.size
    })),
    exportTime: new Date().toISOString()
  }
  
  // 下载 JSON 文件
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chart-config-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('配置已导出')
}
</script>

<style scoped lang="scss">
.chart-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.canvas-header {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.canvas-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
  align-content: start;
}

.chart-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

.chart-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
