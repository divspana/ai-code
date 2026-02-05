<template>
  <div ref="wrapperRef" :style="wrapperStyle" class="vchart-scatter-wrapper">
    <div v-if="!isVisible && lazyLoad" class="vchart-scatter-placeholder">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>等待加载...</span>
    </div>
    
    <!-- 工具栏 -->
    <div v-if="showToolbar && (isVisible || !lazyLoad)" class="vchart-scatter-toolbar">
      <el-button-group>
        <el-button 
          v-if="enableBrush" 
          size="small" 
          :type="brushActive ? 'primary' : 'default'"
          @click="toggleBrush"
        >
          <el-icon><Crop /></el-icon>
          框选
        </el-button>
        <el-button 
          v-if="enableDownload" 
          size="small" 
          @click="handleDownloadData"
        >
          <el-icon><Download /></el-icon>
          下载数据
        </el-button>
        <el-button 
          v-if="enableImageExport" 
          size="small" 
          @click="handleExportImage"
        >
          <el-icon><Picture /></el-icon>
          导出图片
        </el-button>
        <el-button 
          size="small" 
          @click="handleReset"
        >
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </el-button-group>
      
      <!-- 选中信息 -->
      <div v-if="selectedCount > 0" class="selected-info">
        <el-tag type="success" closable @close="clearSelection">
          已选中 {{ selectedCount }} 个点
        </el-tag>
      </div>
    </div>
    
    <div
      v-show="isVisible || !lazyLoad"
      ref="containerRef"
      :style="containerStyle"
      class="vchart-scatter-container"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { ElMessage } from 'element-plus'
import type { VChartScatterProps, VChartScatterEmits, VChartScatterDataPoint } from './types'
import { useVChartScatter } from './hooks/useVChartScatter'

const props = withDefaults(defineProps<VChartScatterProps>(), {
  width: '100%',
  height: '600px',
  pointSize: 10,
  pointSizeRange: () => [5, 20],
  color: '#5B8FF9',
  enableLargeMode: true,
  largeThreshold: 10000,
  enableSampling: true,
  samplingThreshold: 100000,
  enableZoom: true,
  enableBrush: true,
  enableTooltip: true,
  showToolbar: true,
  enableDownload: true,
  enableImageExport: true,
  lazyLoad: true,
  rootMargin: '50px',
  threshold: 0.1
})

const emit = defineEmits<VChartScatterEmits>()

// DOM 引用
const containerRef = ref<HTMLElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)

// 状态
const brushActive = ref(false)
const selectedPoints = ref<VChartScatterDataPoint[]>([])
const selectedCount = computed(() => selectedPoints.value.length)

// 使用组合 Hook
const {
  isVisible,
  getStats,
  resize,
  exportImage,
  downloadImage,
  getChartInstance
} = useVChartScatter({
  data: toRef(props, 'data'),
  containerRef,
  wrapperRef,
  title: props.title,
  pointSize: props.pointSize,
  pointSizeRange: props.pointSizeRange,
  color: props.color,
  enableLargeMode: props.enableLargeMode,
  largeThreshold: props.largeThreshold,
  enableSampling: props.enableSampling,
  samplingThreshold: props.samplingThreshold,
  enableZoom: props.enableZoom,
  enableBrush: props.enableBrush,
  enableTooltip: props.enableTooltip,
  lazyLoad: props.lazyLoad,
  rootMargin: props.rootMargin,
  threshold: props.threshold,
  onPointClick: (data) => emit('point-click', data),
  onBrushSelect: (data) => {
    selectedPoints.value = data.points as VChartScatterDataPoint[]
    emit('brush-select', data)
  },
  onVisible: (visible) => emit('visible', visible),
  onReady: () => emit('ready'),
  onRenderStats: (stats) => emit('render-stats', stats)
})

// 样式
const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  position: 'relative' as const
}))

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%'
}))

/**
 * 切换框选模式
 */
const toggleBrush = () => {
  brushActive.value = !brushActive.value
  ElMessage.info(brushActive.value ? '框选模式已启用' : '框选模式已关闭')
}

/**
 * 清除选中
 */
const clearSelection = () => {
  selectedPoints.value = []
  ElMessage.info('已清除选中')
}

/**
 * 下载数据
 */
const handleDownloadData = () => {
  const dataToDownload = selectedPoints.value.length > 0 ? selectedPoints.value : props.data
  
  // 转换为 CSV
  const csv = convertToCSV(dataToDownload)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `scatter-data-${Date.now()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success(`已下载 ${dataToDownload.length} 条数据`)
}

/**
 * 转换为 CSV
 */
const convertToCSV = (data: VChartScatterDataPoint[]) => {
  if (data.length === 0) return ''
  
  // 表头
  const headers = ['x', 'y', 'value', 'name', 'category']
  const csvRows = [headers.join(',')]
  
  // 数据行
  data.forEach(point => {
    const row = [
      point.x,
      point.y,
      point.value || '',
      point.name || '',
      point.category || ''
    ]
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}

/**
 * 导出图片
 */
const handleExportImage = () => {
  downloadImage(`scatter-chart-${Date.now()}`, 'png')
  ElMessage.success('图片已导出')
}

/**
 * 重置
 */
const handleReset = () => {
  clearSelection()
  brushActive.value = false
  const instance = getChartInstance()
  if (instance) {
    // 重置缩放等状态
    instance.updateSpec({
      dataZoom: props.enableZoom ? [
        {
          orient: 'bottom',
          start: 0,
          end: 100,
          filterMode: 'axis'
        }
      ] : undefined
    })
  }
  ElMessage.info('已重置')
}

// 暴露方法
defineExpose({
  getStats,
  resize,
  exportImage,
  downloadImage,
  getSelectedPoints: () => selectedPoints.value,
  clearSelection
})
</script>

<style scoped>
.vchart-scatter-wrapper {
  overflow: hidden;
  position: relative;
}

.vchart-scatter-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.vchart-scatter-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.vchart-scatter-toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selected-info {
  margin-left: 10px;
}

.vchart-scatter-container {
  width: 100%;
  height: 100%;
}
</style>
