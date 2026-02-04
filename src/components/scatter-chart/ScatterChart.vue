<template>
  <div ref="containerRef" :style="containerStyle" class="scatter-chart-container">
    <div v-if="!isVisible && lazyLoad" class="scatter-chart-placeholder">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>等待加载...</span>
    </div>
    <div
      v-show="isVisible || !lazyLoad"
      ref="chartRef"
      :style="chartStyle"
      class="scatter-chart"
    ></div>
    <div v-if="showSamplingInfo && samplingInfo.enabled" class="sampling-info">
      <el-tag type="info" size="small">
        数据采样: {{ samplingInfo.sampledCount.toLocaleString() }} / {{ samplingInfo.originalCount.toLocaleString() }}
        (减少 {{ samplingInfo.reductionRate.toFixed(1) }}%)
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import type { ScatterChartProps, ScatterChartEmits } from './types'
import { useScatterChart } from './hooks/useScatterChart'

const props = withDefaults(defineProps<ScatterChartProps>(), {
  width: '100%',
  height: '400px',
  enableLargeMode: true,
  largeThreshold: 2000,
  enableSampling: false,
  enableMultiSeries: true,
  enableZoom: true,
  enableBrush: true,
  symbolSize: 4,
  color: '#5470c6',
  selectedColor: '#ee6666',
  unselectedColor: '#cccccc',
  lazyLoad: true,
  rootMargin: '50px',
  threshold: 0.1
})

const emit = defineEmits<ScatterChartEmits>()

// DOM 引用
const chartRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// 使用组合 Hook
const {
  isVisible,
  clearSelection,
  resetChart,
  getSelectedData,
  getSamplingStats
} = useScatterChart({
  data: toRef(props, 'data'),
  chartRef,
  containerRef,
  color: props.color,
  selectedColor: props.selectedColor,
  unselectedColor: props.unselectedColor,
  symbolSize: props.symbolSize,
  title: props.title,
  enableZoom: toRef(props, 'enableZoom'),
  enableBrush: toRef(props, 'enableBrush'),
  enableSampling: toRef(props, 'enableSampling'),
  enableMultiSeries: toRef(props, 'enableMultiSeries'),
  enableLargeMode: props.enableLargeMode,
  largeThreshold: props.largeThreshold,
  lazyLoad: props.lazyLoad,
  rootMargin: props.rootMargin,
  threshold: props.threshold,
  onBrushSelected: (data) => emit('brush-selected', data),
  onBrushEnd: (data) => emit('brush-end', data),
  onVisible: (visible) => emit('visible', visible),
  onChartReady: () => emit('chart-ready'),
  onRenderStats: (stats) => emit('render-stats', stats)
})

// 样式
const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  position: 'relative' as const
}))

const chartStyle = computed(() => ({
  width: '100%',
  height: '100%'
}))

// 采样信息
const samplingInfo = computed(() => {
  if (getSamplingStats) {
    return getSamplingStats()
  }
  return {
    enabled: false,
    originalCount: 0,
    sampledCount: 0,
    reductionRate: 0
  }
})

const showSamplingInfo = computed(() => props.enableSampling && samplingInfo.value.enabled)

// 暴露方法给父组件
defineExpose({
  clearSelection,
  resetChart,
  getSelectedData
})
</script>

<style scoped>
.scatter-chart-container {
  overflow: hidden;
  position: relative;
}

.scatter-chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.scatter-chart-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.scatter-chart {
  width: 100%;
  height: 100%;
}

.sampling-info {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}
</style>
