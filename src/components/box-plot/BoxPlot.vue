<template>
  <div ref="containerRef" :style="containerStyle" class="box-plot-container">
    <div v-if="!isVisible && lazyLoad" class="box-plot-placeholder">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>等待加载...</span>
    </div>
    <div
      v-show="isVisible || !lazyLoad"
      ref="chartRef"
      :style="chartStyle"
      class="box-plot"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import type { BoxPlotProps, BoxPlotEmits } from './types'
import { useBoxPlot } from './hooks/useBoxPlot'

const props = withDefaults(defineProps<BoxPlotProps>(), {
  width: '100%',
  height: '400px',
  enableLargeMode: true,
  largeThreshold: 2000,
  enableSampling: false,
  samplingThreshold: 1000,
  samplingRate: 0.1,
  enableMultiSeries: false,
  enableZoom: true,
  enableDataView: true,
  boxColor: '#7cb5ec',
  outlierColor: '#f45b5b',
  showOutliers: true,
  lazyLoad: true,
  rootMargin: '50px',
  threshold: 0.1
})

const emit = defineEmits<BoxPlotEmits>()

// DOM 引用
const chartRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// 使用组合 Hook
const {
  isVisible,
  resetChart,
  getStatistics
} = useBoxPlot({
  data: toRef(props, 'data'),
  chartRef,
  containerRef,
  boxColor: props.boxColor,
  outlierColor: props.outlierColor,
  showOutliers: props.showOutliers,
  title: props.title,
  enableZoom: toRef(props, 'enableZoom'),
  enableDataView: toRef(props, 'enableDataView'),
  enableSampling: toRef(props, 'enableSampling'),
  samplingThreshold: props.samplingThreshold,
  samplingRate: props.samplingRate,
  enableMultiSeries: toRef(props, 'enableMultiSeries'),
  enableLargeMode: props.enableLargeMode,
  largeThreshold: props.largeThreshold,
  lazyLoad: props.lazyLoad,
  rootMargin: props.rootMargin,
  threshold: props.threshold,
  onBoxClick: (data) => emit('box-click', data),
  onOutlierClick: (data) => emit('outlier-click', data),
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

// 暴露方法给父组件
defineExpose({
  resetChart,
  getStatistics
})
</script>

<style scoped>
.box-plot-container {
  overflow: hidden;
  position: relative;
}

.box-plot-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.box-plot-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.box-plot {
  width: 100%;
  height: 100%;
}
</style>
