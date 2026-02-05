<template>
  <div class="vchart-scatter-debug">
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 左侧控制面板 -->
      <el-col :span="6">
        <el-card header="控制面板">
          <el-form label-width="120px">
            <!-- 数据量 -->
            <el-form-item label="数据量">
              <el-input-number
                v-model="dataCount"
                :min="1000"
                :max="1000000"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
              <div style="margin-top: 5px">
                <el-text size="small" type="info">支持 1-100万</el-text>
              </div>
            </el-form-item>

            <!-- 启用采样 -->
            <el-form-item label="启用采样">
              <el-switch v-model="config.enableSampling" />
              <div style="margin-top: 5px">
                <el-text size="small" type="info">超过10万自动采样</el-text>
              </div>
            </el-form-item>

            <!-- 大数据模式 -->
            <el-form-item label="大数据模式">
              <el-switch v-model="config.enableLargeMode" />
              <div style="margin-top: 5px">
                <el-text size="small" type="info">超过1万自动启用</el-text>
              </div>
            </el-form-item>

            <!-- 启用缩放 -->
            <el-form-item label="启用缩放">
              <el-switch v-model="config.enableZoom" />
            </el-form-item>

            <!-- 启用框选 -->
            <el-form-item label="启用框选">
              <el-switch v-model="config.enableBrush" />
            </el-form-item>

            <!-- 生成数据按钮 -->
            <el-form-item>
              <el-button type="primary" @click="generateData" style="width: 100%">
                生成数据
              </el-button>
            </el-form-item>

            <el-form-item>
              <el-button @click="generate100K" style="width: 100%">
                生成10万数据
              </el-button>
            </el-form-item>

            <el-form-item>
              <el-button @click="generate1M" style="width: 100%">
                生成100万数据
              </el-button>
            </el-form-item>

            <el-divider />

            <!-- 导出功能 -->
            <el-form-item label="导出功能">
              <el-button-group style="width: 100%">
                <el-button @click="exportData" style="flex: 1">
                  导出数据
                </el-button>
                <el-button @click="exportChart" style="flex: 1">
                  导出图片
                </el-button>
              </el-button-group>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 性能统计 -->
        <el-card header="性能统计" style="margin-top: 20px">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="原始数据">
              <el-text type="primary" size="large">{{ stats.totalCount.toLocaleString() }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="渲染数据">
              <el-text type="success" size="large">{{ stats.renderedCount.toLocaleString() }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="渲染耗时">
              <el-text type="warning" size="large">{{ stats.renderTime }} ms</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="生成耗时">
              <el-text>{{ stats.generateTime }} ms</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="采样率">
              <el-text>{{ stats.samplingRate }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 操作日志 -->
        <el-card header="操作日志" style="margin-top: 20px">
          <div class="log-container">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <el-text size="small">{{ log }}</el-text>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧图表区域 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>VChart 散点图 - 支持百万级数据</span>
              <el-tag type="success">高性能</el-tag>
            </div>
          </template>
          <VChartScatter
            ref="chartRef"
            :data="chartData"
            :height="700"
            title="VChart 散点图性能测试"
            :enable-sampling="config.enableSampling"
            :enable-large-mode="config.enableLargeMode"
            :enable-zoom="config.enableZoom"
            :enable-brush="config.enableBrush"
            :lazy-load="false"
            @point-click="handlePointClick"
            @brush-select="handleBrushSelect"
            @ready="handleReady"
            @render-stats="handleRenderStats"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { VChartScatter } from '@/components/vchart-scatter'
import type { VChartScatterDataPoint } from '@/components/vchart-scatter'

interface ChartConfig {
  enableSampling: boolean
  enableLargeMode: boolean
  enableZoom: boolean
  enableBrush: boolean
}

// 配置
const dataCount = ref(100000) // 默认10万
const config = reactive<ChartConfig>({
  enableSampling: true,
  enableLargeMode: true,
  enableZoom: true,
  enableBrush: true
})

// 数据
const chartData = ref<VChartScatterDataPoint[]>([])
const chartRef = ref()

// 统计信息
const stats = reactive({
  totalCount: 0,
  renderedCount: 0,
  renderTime: 0,
  generateTime: 0,
  samplingRate: '100%'
})

// 日志
const logs = ref<string[]>([])

/**
 * 添加日志
 */
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.unshift(`[${timestamp}] ${message}`)
  if (logs.value.length > 10) {
    logs.value.pop()
  }
}

/**
 * 生成数据
 */
const generateData = () => {
  addLog(`开始生成 ${dataCount.value.toLocaleString()} 个数据点...`)
  
  const startTime = performance.now()
  const data: VChartScatterDataPoint[] = []
  
  for (let i = 0; i < dataCount.value; i++) {
    data.push({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      value: Math.random() * 100,
      name: `Point-${i}`
    })
  }
  
  const endTime = performance.now()
  stats.generateTime = Math.round(endTime - startTime)
  stats.totalCount = data.length
  
  chartData.value = data
  
  addLog(`✅ 生成完成，耗时 ${stats.generateTime} ms`)
  ElMessage.success(`成功生成 ${dataCount.value.toLocaleString()} 个数据点`)
}

/**
 * 生成10万数据
 */
const generate100K = () => {
  dataCount.value = 100000
  addLog('生成 10万 数据点...')
  setTimeout(() => generateData(), 100)
}

/**
 * 生成100万数据
 */
const generate1M = () => {
  dataCount.value = 1000000
  addLog('⚠️  生成 100万 数据点（压力测试）...')
  ElMessage.warning('生成100万数据可能需要几秒钟...')
  setTimeout(() => generateData(), 100)
}

/**
 * 处理点击事件
 */
const handlePointClick = (data: { point: VChartScatterDataPoint; index: number }) => {
  addLog(`🖱️  点击: ${data.point.name}`)
  ElMessage.info(`点击了 ${data.point.name}`)
}

/**
 * 处理框选事件
 */
const handleBrushSelect = (data: { points: VChartScatterDataPoint[] }) => {
  addLog(`📦 框选了 ${data.points.length} 个点`)
  ElMessage.info(`框选了 ${data.points.length} 个点`)
}

/**
 * 处理就绪事件
 */
const handleReady = () => {
  addLog('✅ VChart 初始化完成')
  ElMessage.success('图表加载完成')
  
  // 获取统计信息
  if (chartRef.value) {
    const chartStats = chartRef.value.getStats()
    stats.samplingRate = chartStats.samplingRate
    addLog(`📊 采样率: ${chartStats.samplingRate}`)
  }
}

/**
 * 处理渲染统计
 */
const handleRenderStats = (renderStats: {
  totalCount: number
  renderedCount: number
  renderTime: number
}) => {
  stats.totalCount = renderStats.totalCount
  stats.renderedCount = renderStats.renderedCount
  stats.renderTime = renderStats.renderTime
}

/**
 * 导出数据
 */
const exportData = () => {
  if (chartRef.value) {
    const selectedPoints = chartRef.value.getSelectedPoints()
    if (selectedPoints && selectedPoints.length > 0) {
      addLog(`📥 导出选中的 ${selectedPoints.length} 个点`)
      ElMessage.success(`导出选中的 ${selectedPoints.length} 个点`)
    } else {
      addLog(`📥 导出全部 ${chartData.value.length} 个点`)
      ElMessage.success(`导出全部 ${chartData.value.length} 个点`)
    }
  }
}

/**
 * 导出图片
 */
const exportChart = () => {
  if (chartRef.value) {
    chartRef.value.downloadImage('vchart-scatter', 'png')
    addLog('🖼️  导出图片')
  }
}

// 初始化
generateData()
</script>

<style scoped>
.vchart-scatter-debug {
  padding: 20px;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}
</style>
