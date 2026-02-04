<template>
  <div class="box-plot-debug">
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 左侧控制面板 -->
      <el-col :span="6">
        <el-card header="控制面板">
          <el-form label-width="120px">
            <!-- 分类数量 -->
            <el-form-item label="分类数量">
              <el-input-number
                v-model="categoryCount"
                :min="1"
                :max="100000"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
              <div style="margin-top: 5px">
                <el-text size="small" type="info">支持 1-100,000</el-text>
              </div>
            </el-form-item>

            <!-- 每个分类数据量 -->
            <el-form-item label="每分类数据量">
              <el-input-number
                v-model="dataPerCategory"
                :min="10"
                :max="1000"
                :step="10"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>

            <!-- 启用采样 -->
            <el-form-item label="启用采样">
              <el-switch v-model="config.enableSampling" @change="handleConfigChange" />
              <div style="margin-top: 5px">
                <el-text size="small" type="info">阈值: 1000，采样10%</el-text>
              </div>
            </el-form-item>

            <!-- 多个Series -->
            <el-form-item label="多个Series">
              <el-switch v-model="config.enableMultiSeries" @change="handleConfigChange" />
              <div style="margin-top: 5px">
                <el-text size="small" type="info">每个分类一个 series</el-text>
              </div>
            </el-form-item>

            <!-- 显示异常值 -->
            <el-form-item label="显示异常值">
              <el-switch v-model="config.showOutliers" @change="handleConfigChange" />
            </el-form-item>

            <!-- 生成数据按钮 -->
            <el-form-item>
              <el-button type="primary" @click="generateData" style="width: 100%">
                生成数据
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 绘制统计 -->
        <el-card header="绘制统计" style="margin-top: 20px">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="分类数量">
              <el-text type="primary" size="large">{{ stats.totalCategories }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="总数据点">
              <el-text type="success" size="large">{{ stats.totalDataPoints.toLocaleString() }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="Series 数量">
              <el-text type="warning" size="large">{{ stats.seriesCount }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 右侧图表区域 -->
      <el-col :span="18">
        <el-card header="箱线图">
          <BoxPlot
            ref="chartRef"
            :data="chartData"
            :height="500"
            :box-color="'#7cb5ec'"
            :outlier-color="'#f45b5b'"
            :show-outliers="config.showOutliers"
            :enable-sampling="config.enableSampling"
            :enable-multi-series="config.enableMultiSeries"
            :lazy-load="false"
            :enable-large-mode="true"
            :enable-zoom="true"
            :enable-data-view="true"
            @render-stats="handleRenderStats"
            @box-click="handleBoxClick"
            @outlier-click="handleOutlierClick"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { BoxPlot } from '@/components/box-plot'
import type { BoxPlotDataPoint } from '@/components/box-plot'

interface ChartConfig {
  enableSampling: boolean
  enableMultiSeries: boolean
  showOutliers: boolean
}

// 配置
const categoryCount = ref(10000) // 默认1万分类
const dataPerCategory = ref(100)
const config = reactive<ChartConfig>({
  enableSampling: true,  // 默认启用采样
  enableMultiSeries: true, // 默认启用多 series
  showOutliers: true
})

// 数据
const chartData = ref<BoxPlotDataPoint[]>([])
const chartRef = ref()

// 统计信息
const stats = reactive({
  totalCategories: 0,
  totalDataPoints: 0,
  seriesCount: 0
})

/**
 * 生成随机数据（正态分布）
 */
const generateNormalData = (mean: number, stdDev: number, count: number): number[] => {
  const data: number[] = []
  for (let i = 0; i < count; i++) {
    // Box-Muller 变换生成正态分布
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    data.push(mean + z0 * stdDev)
  }
  return data
}

/**
 * 生成随机数据
 */
const generateData = () => {
  const data: BoxPlotDataPoint[] = []
  
  for (let i = 0; i < categoryCount.value; i++) {
    // 每个分类使用不同的均值和标准差
    const mean = 50 + Math.random() * 50
    const stdDev = 5 + Math.random() * 10
    
    data.push({
      category: `分类 ${i + 1}`,
      values: generateNormalData(mean, stdDev, dataPerCategory.value)
    })
  }

  chartData.value = data
  stats.totalCategories = data.length
  stats.totalDataPoints = data.reduce((sum, item) => sum + item.values.length, 0)
  
  ElMessage.success(`成功生成 ${categoryCount.value} 个分类，共 ${stats.totalDataPoints.toLocaleString()} 个数据点`)
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
  totalCategories: number
  totalDataPoints: number
  seriesCount: number
}) => {
  stats.totalCategories = renderStats.totalCategories
  stats.totalDataPoints = renderStats.totalDataPoints
  stats.seriesCount = renderStats.seriesCount
}

/**
 * 处理箱体点击
 */
const handleBoxClick = (data: { category: string; statistics: unknown }) => {
  console.log('箱体点击:', data)
  ElMessage.info(`点击了 ${data.category}`)
}

/**
 * 处理异常值点击
 */
const handleOutlierClick = (data: { category: string; value: number }) => {
  console.log('异常值点击:', data)
  ElMessage.warning(`${data.category} 的异常值: ${data.value.toFixed(2)}`)
}

// 初始化
generateData()
</script>

<style scoped>
.box-plot-debug {
  padding: 20px;
}
</style>
