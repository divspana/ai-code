<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Plus, Delete, Refresh, Aim } from '@element-plus/icons-vue'
import ChartWrapper from './components/ChartWrapper.vue'

// 当前选中的图表类型
const currentChartType = ref<'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'gauge' | 'funnel' | 'heatmap'>('line')
const chartTheme = ref<'light' | 'dark'>('light')

// 图表配置表单
const chartConfig = ref({
  title: '销售数据统计',
  width: '100%',
  height: '400px'
})

// 数据配置
const dataConfig = ref({
  categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  series: [
    { name: '销售额', data: [120, 200, 150, 80, 70, 110, 130], color: '#5470c6' },
    { name: '访问量', data: [220, 182, 191, 234, 290, 330, 310], color: '#91cc75' }
  ]
})

// 饼图数据
const pieData = ref([
  { value: 1048, name: '搜索引擎' },
  { value: 735, name: '直接访问' },
  { value: 580, name: '邮件营销' },
  { value: 484, name: '联盟广告' },
  { value: 300, name: '视频广告' }
])

// 散点图数据
const scatterData = ref([
  {
    name: '数据集1',
    data: Array.from({ length: 50 }, () => [
      Math.random() * 100,
      Math.random() * 100
    ])
  },
  {
    name: '数据集2',
    data: Array.from({ length: 50 }, () => [
      Math.random() * 100,
      Math.random() * 100
    ])
  }
])

// 雷达图数据
const radarData = ref([
  {
    value: [85, 90, 75, 80, 95, 88],
    name: '产品A'
  },
  {
    value: [70, 85, 90, 75, 80, 85],
    name: '产品B'
  }
])

const radarIndicators = ref(['性能', '稳定性', '易用性', '功能', '价格', '服务'])

// 仪表盘数据
const gaugeData = ref([{ value: 75, name: '完成率' }])

// 漏斗图数据
const funnelData = ref([
  { value: 100, name: '访问' },
  { value: 80, name: '咨询' },
  { value: 60, name: '订单' },
  { value: 40, name: '点击' },
  { value: 20, name: '成交' }
])

// 热力图数据
const heatmapData = ref([
  {
    data: [
      [0, 0, 5], [0, 1, 1], [0, 2, 0], [0, 3, 0], [0, 4, 0],
      [1, 0, 1], [1, 1, 15], [1, 2, 0], [1, 3, 0], [1, 4, 0],
      [2, 0, 0], [2, 1, 0], [2, 2, 10], [2, 3, 5], [2, 4, 0],
      [3, 0, 0], [3, 1, 0], [3, 2, 5], [3, 3, 15], [3, 4, 3],
      [4, 0, 0], [4, 1, 0], [4, 2, 0], [4, 3, 3], [4, 4, 8]
    ],
    yAxisData: ['周一', '周二', '周三', '周四', '周五']
  }
])

const heatmapXAxis = ref(['9:00', '10:00', '11:00', '12:00', '13:00'])

// 根据图表类型获取数据
const currentChartData = computed(() => {
  switch (currentChartType.value) {
    case 'line':
    case 'bar':
      return dataConfig.value.series
    case 'pie':
      return pieData.value
    case 'scatter':
      return scatterData.value
    case 'radar':
      return radarData.value
    case 'gauge':
      return gaugeData.value
    case 'funnel':
      return funnelData.value
    case 'heatmap':
      return heatmapData.value
    default:
      return []
  }
})

const currentXAxisData = computed(() => {
  switch (currentChartType.value) {
    case 'line':
    case 'bar':
      return dataConfig.value.categories
    case 'radar':
      return radarIndicators.value
    case 'heatmap':
      return heatmapXAxis.value
    default:
      return []
  }
})

// 图表类型选项
const chartTypes = [
  { value: 'line', label: '折线图', icon: '📈' },
  { value: 'bar', label: '柱状图', icon: '📊' },
  { value: 'pie', label: '饼图', icon: '🥧' },
  { value: 'scatter', label: '散点图', icon: '⚫' },
  { value: 'radar', label: '雷达图', icon: '🎯' },
  { value: 'gauge', label: '仪表盘', icon: '⏱️' },
  { value: 'funnel', label: '漏斗图', icon: '🔻' },
  { value: 'heatmap', label: '热力图', icon: '🔥' }
]

// 添加数据系列
const addSeries = () => {
  dataConfig.value.series.push({
    name: `系列${dataConfig.value.series.length + 1}`,
    data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 300)),
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
  })
  ElMessage.success('已添加新系列')
}

// 删除数据系列
const removeSeries = (index: number) => {
  if (dataConfig.value.series.length <= 1) {
    ElMessage.warning('至少保留一个系列')
    return
  }
  dataConfig.value.series.splice(index, 1)
  ElMessage.success('已删除系列')
}

// 随机生成数据
const randomizeData = () => {
  dataConfig.value.series.forEach(series => {
    series.data = Array.from({ length: 7 }, () => Math.floor(Math.random() * 300))
  })
  ElMessage.success('数据已随机生成')
}

// 导出图表
const exportChart = () => {
  ElMessage.success('图表导出功能开发中...')
}
</script>

<template>
  <div class="charts-demo">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>📊 ECharts 图表配置器</h2>
        <el-tag type="info">{{ chartTypes.find(t => t.value === currentChartType)?.label }}</el-tag>
      </div>
      <div class="toolbar-right">
        <el-radio-group v-model="chartTheme" size="small">
          <el-radio-button label="light">浅色</el-radio-button>
          <el-radio-button label="dark">深色</el-radio-button>
        </el-radio-group>
        <el-button @click="exportChart">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <div class="content-area">
      <!-- 左侧：图表类型选择 -->
      <div class="chart-types">
        <el-card>
          <template #header>
            <h3>图表类型</h3>
          </template>
          
          <div class="type-list">
            <div
              v-for="type in chartTypes"
              :key="type.value"
              class="type-item"
              :class="{ active: currentChartType === type.value }"
              @click="currentChartType = type.value as any"
            >
              <span class="type-icon">{{ type.icon }}</span>
              <span class="type-label">{{ type.label }}</span>
            </div>
          </div>
        </el-card>

        <!-- 配置面板 -->
        <el-card style="margin-top: 16px">
          <template #header>
            <h3>图表配置</h3>
          </template>
          
          <el-form label-width="80px" size="small">
            <el-form-item label="标题">
              <el-input v-model="chartConfig.title" />
            </el-form-item>
            
            <el-form-item label="高度">
              <el-input v-model="chartConfig.height" />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 数据配置 -->
        <el-card v-if="currentChartType === 'line' || currentChartType === 'bar'" style="margin-top: 16px">
          <template #header>
            <div class="card-header">
              <h3>数据系列</h3>
              <el-button size="small" @click="addSeries">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </template>
          
          <div class="series-list">
            <div
              v-for="(series, index) in dataConfig.series"
              :key="index"
              class="series-item"
            >
              <el-input
                v-model="series.name"
                size="small"
                style="flex: 1"
              />
              <el-color-picker v-model="series.color" size="small" />
              <el-button
                size="small"
                type="danger"
                @click="removeSeries(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          
          <el-button
            type="primary"
            size="small"
            style="width: 100%; margin-top: 12px"
            @click="randomizeData"
          >
            随机生成数据
          </el-button>
        </el-card>
      </div>

      <!-- 中间：图表展示 -->
      <div class="chart-display">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>图表预览</span>
              <el-tag>{{ currentChartType }}</el-tag>
            </div>
          </template>
          
          <div class="chart-container">
            <ChartWrapper
              :type="currentChartType"
              :title="chartConfig.title"
              :data="currentChartData"
              :x-axis-data="currentXAxisData"
              :width="chartConfig.width"
              :height="chartConfig.height"
              :theme="chartTheme"
            />
          </div>
        </el-card>
      </div>

      <!-- 右侧：代码示例 -->
      <div class="code-panel">
        <el-card>
          <template #header>
            <h3>使用示例</h3>
          </template>
          
          <div class="code-example">
            <pre><code>&lt;ChartWrapper
  type="{{ currentChartType }}"
  title="{{ chartConfig.title }}"
  :data="chartData"
  :x-axis-data="xAxisData"
  width="{{ chartConfig.width }}"
  height="{{ chartConfig.height }}"
  theme="{{ chartTheme }}"
/&gt;</code></pre>
          </div>
        </el-card>

        <!-- 数据格式说明 -->
        <el-card style="margin-top: 16px">
          <template #header>
            <h3>数据格式</h3>
          </template>
          
          <div class="data-format">
            <el-collapse>
              <el-collapse-item title="折线图/柱状图" name="1">
                <pre><code>data: [
  { name: '系列1', data: [120, 200, 150] },
  { name: '系列2', data: [220, 182, 191] }
]
xAxisData: ['周一', '周二', '周三']</code></pre>
              </el-collapse-item>
              
              <el-collapse-item title="饼图" name="2">
                <pre><code>data: [
  { value: 1048, name: '搜索引擎' },
  { value: 735, name: '直接访问' }
]</code></pre>
              </el-collapse-item>
              
              <el-collapse-item title="散点图" name="3">
                <pre><code>data: [
  { name: '数据集1', data: [[10, 20], [30, 40]] },
  { name: '数据集2', data: [[15, 25], [35, 45]] }
]</code></pre>
              </el-collapse-item>
              
              <el-collapse-item title="雷达图" name="4">
                <pre><code>data: [
  { value: [85, 90, 75], name: '产品A' }
]
xAxisData: ['性能', '稳定性', '易用性']</code></pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>

        <!-- 特性说明 -->
        <el-card style="margin-top: 16px">
          <template #header>
            <h3>特性</h3>
          </template>
          
          <div class="features">
            <p>✅ 8 种常用图表类型</p>
            <p>✅ 浅色/深色主题切换</p>
            <p>✅ 响应式自适应</p>
            <p>✅ 工具栏（缩放、保存）</p>
            <p>✅ 自定义配置支持</p>
            <p>✅ 动画效果</p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.charts-demo {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.toolbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.content-area {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.chart-types {
  width: 280px;
  overflow-y: auto;
  flex-shrink: 0;
}

.chart-types h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.type-item:hover {
  background: #e6f7ff;
  transform: translateX(4px);
}

.type-item.active {
  background: #e6f7ff;
  border-color: #409eff;
}

.type-icon {
  font-size: 24px;
}

.type-label {
  font-size: 14px;
  font-weight: 500;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.series-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.series-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chart-display {
  flex: 1;
  overflow: auto;
}

.chart-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.code-panel {
  width: 350px;
  overflow-y: auto;
  flex-shrink: 0;
}

.code-panel h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.code-example {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}

.code-example pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.code-example code {
  color: #333;
}

.data-format {
  font-size: 12px;
}

.data-format pre {
  margin: 8px 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow-x: auto;
}

.features {
  font-size: 13px;
  line-height: 2;
}

.features p {
  margin: 4px 0;
}
</style>
