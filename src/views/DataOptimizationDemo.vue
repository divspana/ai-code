<template>
  <div class="data-optimization-demo">
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 左侧控制面板 -->
      <el-col :span="6">
        <el-card header="数据生成">
          <el-form label-width="120px">
            <el-form-item label="数据量">
              <el-input-number
                v-model="dataCount"
                :min="1000"
                :max="200000"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="数据类型">
              <el-radio-group v-model="dataType">
                <el-radio value="simple">简单数据</el-radio>
                <el-radio value="complex">复杂数据</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="generateData" style="width: 100%">
                生成数据
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card header="优化配置" style="margin-top: 20px">
          <el-form label-width="120px">
            <el-form-item label="启用优化">
              <el-switch v-model="enableOptimization" />
            </el-form-item>

            <el-form-item label="保留字段" v-if="enableOptimization">
              <el-select
                v-model="selectedFields"
                multiple
                placeholder="选择字段"
                style="width: 100%"
              >
                <el-option label="x" value="x" />
                <el-option label="y" value="y" />
                <el-option label="value" value="value" />
                <el-option label="name" value="name" />
                <el-option label="binCode" value="binCode" />
                <el-option label="waferID" value="waferID" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button @click="analyzeData" style="width: 100%">
                分析数据
              </el-button>
            </el-form-item>

            <el-form-item>
              <el-button type="success" @click="applyOptimization" style="width: 100%">
                应用优化
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 性能对比 -->
        <el-card header="性能对比" style="margin-top: 20px">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="原始数据">
              <el-text>{{ stats.original.count.toLocaleString() }} 条</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="原始内存">
              <el-text type="danger">{{ stats.original.memory }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="原始字段">
              <el-text>{{ stats.original.fields }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="优化后内存">
              <el-text type="success">{{ stats.optimized.memory }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="优化后字段">
              <el-text>{{ stats.optimized.fields }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="减少率">
              <el-text type="primary" size="large">{{ stats.reductionRate }}%</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 右侧图表区域 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>散点图 - {{ enableOptimization ? '优化后' : '原始数据' }}</span>
              <el-tag :type="enableOptimization ? 'success' : 'danger'">
                {{ enableOptimization ? '已优化' : '未优化' }}
              </el-tag>
            </div>
          </template>
          <ScatterChart
            ref="chartRef"
            :data="chartData"
            :height="600"
            :enable-sampling="true"
            :enable-multi-series="true"
            :lazy-load="false"
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
import { ScatterChart } from '@/components/scatter-chart'
import type { ScatterDataPoint } from '@/components/scatter-chart'
import { analyzeDataset, optimizeDataset } from '@/utils/dataOptimizer'

// 配置
const dataCount = ref(50000)
const dataType = ref<'simple' | 'complex'>('complex')
const enableOptimization = ref(false)
const selectedFields = ref(['x', 'y', 'value', 'name'])

// 数据
const rawData = ref<unknown[]>([])
const chartData = ref<ScatterDataPoint[]>([])
const chartRef = ref()

// 统计信息
const stats = reactive({
  original: {
    count: 0,
    memory: '0 B',
    fields: 0
  },
  optimized: {
    memory: '0 B',
    fields: 0
  },
  reductionRate: '0'
})

/**
 * 生成简单数据（类似随机测试数据）
 */
const generateSimpleData = (count: number) => {
  const data: ScatterDataPoint[] = []
  for (let i = 0; i < count; i++) {
    data.push({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      value: Math.random() * 100,
      name: `Point-${i}`
    })
  }
  return data
}

/**
 * 生成复杂数据（模拟真实业务数据）
 */
const generateComplexData = (count: number) => {
  const data: Array<Record<string, unknown>> = []
  const bins = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const operators = ['Alice', 'Bob', 'Charlie', 'David', 'Eve']
  const equipments = ['Tester-001', 'Tester-002', 'Tester-003']
  
  for (let i = 0; i < count; i++) {
    data.push({
      // 图表必需字段
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      value: Math.random() * 100,
      name: `Point-${i}`,
      
      // 业务字段（会增加内存占用）
      waferID: `W${String(i).padStart(9, '0')}-LOT-2024-${Math.floor(i / 1000)}`,
      lotID: `LOT-2024-${Math.floor(i / 1000)}-BATCH-${String.fromCharCode(65 + (i % 26))}`,
      binCode: bins[Math.floor(Math.random() * bins.length)],
      
      // 嵌套对象（会显著增加内存）
      testData: {
        voltage: (3.0 + Math.random() * 0.5).toFixed(3),
        current: (0.3 + Math.random() * 0.4).toFixed(3),
        temperature: (20 + Math.random() * 10).toFixed(1),
        resistance: (100 + Math.random() * 50).toFixed(2)
      },
      
      // 时间戳
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      
      // 更多元数据
      metadata: {
        operator: operators[Math.floor(Math.random() * operators.length)],
        equipment: equipments[Math.floor(Math.random() * equipments.length)],
        testProgram: `TP-${Math.floor(Math.random() * 100)}`,
        remarks: `Test remark for point ${i} with some additional information`
      },
      
      // 数组数据
      history: [
        { step: 1, result: 'PASS' },
        { step: 2, result: Math.random() > 0.9 ? 'FAIL' : 'PASS' }
      ],
      
      // 长字符串
      description: `This is a detailed description for data point ${i} containing various information about the test results and conditions. It might be quite long in real scenarios.`
    })
  }
  return data
}

/**
 * 生成数据
 */
const generateData = () => {
  console.log(`🔄 生成 ${dataType.value} 数据...`)
  console.time('数据生成')
  
  if (dataType.value === 'simple') {
    rawData.value = generateSimpleData(dataCount.value)
  } else {
    rawData.value = generateComplexData(dataCount.value)
  }
  
  console.timeEnd('数据生成')
  
  // 更新统计
  updateStats()
  
  // 应用当前优化设置
  applyOptimization()
  
  ElMessage.success(`成功生成 ${dataCount.value.toLocaleString()} 条${dataType.value === 'simple' ? '简单' : '复杂'}数据`)
}

/**
 * 分析数据
 */
const analyzeData = () => {
  if (rawData.value.length === 0) {
    ElMessage.warning('请先生成数据')
    return
  }
  
  console.log('=' .repeat(60))
  analyzeDataset(rawData.value)
  console.log('=' .repeat(60))
  
  ElMessage.info('分析完成，请查看控制台')
}

/**
 * 应用优化
 */
const applyOptimization = () => {
  if (rawData.value.length === 0) {
    ElMessage.warning('请先生成数据')
    return
  }
  
  if (enableOptimization.value) {
    console.log('🔧 应用数据优化...')
    const { optimizedData, report } = optimizeDataset(rawData.value, {
      essentialFields: selectedFields.value,
      simplifyStrings: true,
      maxStringLength: 30,
      numericPrecision: 2,
      flattenNested: true
    })
    
    chartData.value = optimizedData as ScatterDataPoint[]
    
    // 更新优化统计
    stats.optimized.memory = report.memoryEstimate.after
    stats.optimized.fields = report.fieldCount.after
    stats.reductionRate = report.reductionRate.toFixed(1)
    
    ElMessage.success(`优化完成，内存减少 ${report.reductionRate.toFixed(1)}%`)
  } else {
    console.log('⏭️  使用原始数据（未优化）')
    chartData.value = rawData.value as ScatterDataPoint[]
    
    // 重置优化统计
    stats.optimized.memory = stats.original.memory
    stats.optimized.fields = stats.original.fields
    stats.reductionRate = '0'
  }
}

/**
 * 更新统计信息
 */
const updateStats = () => {
  if (rawData.value.length === 0) return
  
  const sample = rawData.value[0] as Record<string, unknown>
  const sampleStr = JSON.stringify(sample)
  const sampleSize = sampleStr.length * 2 // UTF-16
  const totalSize = sampleSize * rawData.value.length
  
  stats.original.count = rawData.value.length
  stats.original.fields = Object.keys(sample).length
  
  // 格式化内存大小
  if (totalSize < 1024) {
    stats.original.memory = `${totalSize} B`
  } else if (totalSize < 1024 * 1024) {
    stats.original.memory = `${(totalSize / 1024).toFixed(2)} KB`
  } else {
    stats.original.memory = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
  }
}

/**
 * 处理渲染统计
 */
const handleRenderStats = (renderStats: {
  totalCount: number
  renderedCount: number
  seriesCount: number
}) => {
  console.log('📊 渲染统计:', renderStats)
}

// 初始化
generateData()
</script>

<style scoped>
.data-optimization-demo {
  padding: 20px;
}
</style>
