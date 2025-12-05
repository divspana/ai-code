<template>
  <div class="chart-selector">
    <h3 class="selector-title">图表库</h3>
    <div class="chart-list">
      <div
        v-for="chart in chartLibrary"
        :key="chart.type"
        class="chart-item"
        :class="{ active: selectedType === chart.type }"
        @click="selectChart(chart.type)"
      >
        <el-icon class="chart-icon" :size="32">
          <component :is="chart.icon" />
        </el-icon>
        <div class="chart-name">{{ chart.name }}</div>
        <div class="chart-desc">{{ chart.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChartLibrary } from '../composables/useChartLibrary'
import type { ChartType } from '../types'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 注册所有图标
const icons = ElementPlusIconsVue

const emit = defineEmits<{
  select: [type: ChartType]
}>()

const { chartLibrary } = useChartLibrary()
const selectedType = ref<ChartType | null>(null)

const selectChart = (type: ChartType) => {
  selectedType.value = type
  emit('select', type)
}
</script>

<style scoped lang="scss">
.chart-selector {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e4e7ed;
}

.selector-title {
  padding: 16px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
}

.chart-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.chart-item {
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
    transform: translateY(-2px);
  }

  &.active {
    border-color: #409eff;
    background: #ecf5ff;
  }
}

.chart-icon {
  color: #409eff;
  margin-bottom: 8px;
}

.chart-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.chart-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>
