<template>
  <div class="scatter-chart-debug">
    <el-page-header @back="$router.back()" content="散点图性能调试" />

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 左侧控制面板 -->
      <el-col :span="6">
        <el-card header="控制面板">
          <el-form label-width="100px" size="default">
            <!-- 数据量 -->
            <el-form-item label="数据量">
              <el-input-number
                v-model="dataCount"
                :min="100"
                :max="1000000"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>

            <!-- 启用采样 -->
            <el-form-item label="启用采样">
              <el-switch v-model="config.enableSampling" @change="handleConfigChange" />
              <div style="margin-top: 5px">
                <el-text size="small" type="info">阈值: 5万，保留95%</el-text>
              </div>
            </el-form-item>

            <!-- 分多个Series -->
            <el-form-item label="多个Series">
              <el-switch v-model="config.enableMultiSeries" @change="handleConfigChange" />
              <div style="margin-top: 5px">
                <el-text size="small" type="info">每个1万条</el-text>
              </div>
            </el-form-item>

            <!-- 生成按钮 -->
            <el-form-item>
              <el-button type="primary" @click="generateData" style="width: 100%">
                生成数据
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 绘制统计 -->
        <el-card header="绘制统计" style="margin-top: 20px">
          <el-descriptions :column="1" size="default" border>
            <el-descriptions-item label="原始数据量">
              <el-text type="primary" size="large">{{ stats.totalCount.toLocaleString() }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="实际绘制点数">
              <el-text type="success" size="large" style="font-weight: bold">
                {{ stats.renderedCount.toLocaleString() }}
              </el-text>
            </el-descriptions-item>
            <el-descriptions-item label="Series 数量">
              <el-text type="warning" size="large">{{ stats.seriesCount }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="减少率" v-if="stats.reductionRate > 0">
              <el-text type="danger" size="large">{{ stats.reductionRate }}%</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 右侧图表区域 -->
      <el-col :span="18">
        <el-card header="散点图">
          <ScatterChart
            ref="chartRef"
            :data="chartData"
            :height="500"
            :color="'#5470c6'"
            :selected-color="'#ee6666'"
            :unselected-color="'#cccccc'"
            :enable-sampling="config.enableSampling"
            :enable-multi-series="config.enableMultiSeries"
            :lazy-load="false"
            :enable-large-mode="true"
            :enable-zoom="true"
            :enable-brush="true"
            :symbol-size="4"
            @render-stats="handleRenderStats"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { ScatterChart } from '@/components/scatter-chart'
import type { ScatterDataPoint } from '@/components/scatter-chart'

interface ChartConfig {
  enableSampling: boolean
  enableMultiSeries: boolean
}

// 配置
const dataCount = ref(50000)
const config = reactive<ChartConfig>({
  enableSampling: false,
  enableMultiSeries: true
})

// 数据
const chartData = ref<ScatterDataPoint[]>([])
const chartRef = ref()

// 统计信息
const stats = reactive({
  totalCount: 0,
  renderedCount: 0,
  seriesCount: 0,
  reductionRate: 0
})

/**
 * 生成随机数据
 */
const generateData = () => {
  const data: ScatterDataPoint[] = []
  for (let i = 0; i < dataCount.value; i++) {
    data.push({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      value: Math.random() * 100,
      name: `Point-${i}`
    })
  }

  chartData.value = data
  stats.totalCount = data.length
  
  ElMessage.success(`成功生成 ${dataCount.value.toLocaleString()} 个数据点`)
}

/**
 * 处理配置变化
 */
const handleConfigChange = () => {
  // 强制重新渲染图表
  if (chartRef.value && chartData.value.length > 0) {
    const tempData = chartData.value
    chartData.value = []
    
    nextTick(() => {
      chartData.value = tempData
    })
  }
}

/**
 * 处理渲染统计信息
 */
const handleRenderStats = (renderStats: { 
  totalCount: number
  renderedCount: number
  seriesCount: number
  reductionRate: number
}) => {
  stats.totalCount = renderStats.totalCount
  stats.renderedCount = renderStats.renderedCount
  stats.seriesCount = renderStats.seriesCount
  stats.reductionRate = renderStats.reductionRate
}

// 初始化
generateData()
</script>

<style scoped>
.scatter-chart-debug {
  padding: 20px;
}
</style>
