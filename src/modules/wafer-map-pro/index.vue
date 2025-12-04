<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Aim, Refresh } from '@element-plus/icons-vue'
import WaferMapPro from './components/WaferMapPro.vue'

interface Die {
  x: number
  y: number
  bin: number
  value?: number
}

// 专业 Bin 配置
const binConfig = {
  0: { name: 'Not Tested', color: '#9E9E9E', category: 'test' },
  1: { name: 'Pass', color: '#4CAF50', category: 'pass' },
  2: { name: 'Functional Fail', color: '#F44336', category: 'fail' },
  3: { name: 'Parametric Fail', color: '#FF5722', category: 'fail' },
  4: { name: 'Retest Pass', color: '#2196F3', category: 'pass' },
  5: { name: 'Ink Mark', color: '#9C27B0', category: 'special' },
  6: { name: 'Edge Die', color: '#607D8B', category: 'special' },
  7: { name: 'Probe Mark', color: '#795548', category: 'special' },
  8: { name: 'Short', color: '#E91E63', category: 'fail' },
  9: { name: 'Open', color: '#FF9800', category: 'fail' }
}

// 数据
const waferData = ref<Die[]>([])
const selectedDies = ref<Die[]>([])
const clickedDie = ref<Die | null>(null)
const isGenerating = ref(false)

// 设置
const dataSize = ref(10000)
const waferSize = ref(12) // 12 英寸
const displayMode = ref<'bin' | 'heatmap' | 'yield'>('bin')
const showNotch = ref(true)
const showCoordinates = ref(true)
const showGrid = ref(true)

// Wafer Map 引用
const waferMapRef = ref()

// 统计信息
const statistics = computed(() => {
  if (!waferMapRef.value) return null
  return {
    binStats: waferMapRef.value.binStatistics || [],
    yield: waferMapRef.value.yieldRate || '0.00'
  }
})

// 生成专业的 Wafer 数据
const generateWaferData = () => {
  isGenerating.value = true
  waferData.value = []
  
  setTimeout(() => {
    const data: Die[] = []
    const radius = Math.sqrt(dataSize.value / Math.PI)
    
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const distance = Math.sqrt(x * x + y * y)
        
        if (distance <= radius) {
          const normalized = distance / radius
          
          // 模拟真实的晶圆分布模式
          let bin = 1 // 默认 Pass
          const rand = Math.random()
          
          // 边缘效应
          if (normalized > 0.95) {
            bin = 6 // Edge Die
          } else if (normalized > 0.9) {
            if (rand < 0.4) bin = 2 // Functional Fail
            else if (rand < 0.5) bin = 3 // Parametric Fail
            else if (rand < 0.6) bin = 6 // Edge Die
          } else if (normalized > 0.7) {
            if (rand < 0.2) bin = 2
            else if (rand < 0.3) bin = 3
            else if (rand < 0.35) bin = 8 // Short
            else if (rand < 0.4) bin = 9 // Open
          } else {
            // 中心区域 - 模拟缺陷簇
            const clusterX = Math.floor(x / 10)
            const clusterY = Math.floor(y / 10)
            const clusterHash = (clusterX * 31 + clusterY * 17) % 100
            
            if (clusterHash < 3) {
              // 缺陷簇
              bin = 2
            } else if (clusterHash < 5) {
              bin = 3
            } else if (rand < 0.02) {
              bin = 2
            } else if (rand < 0.03) {
              bin = 3
            } else if (rand < 0.04) {
              bin = 8
            } else if (rand < 0.05) {
              bin = 9
            } else if (rand < 0.08) {
              bin = 4 // Retest Pass
            }
          }
          
          data.push({
            x: Math.floor(x + radius),
            y: Math.floor(y + radius),
            bin,
            value: Math.random() * 100
          })
        }
      }
    }
    
    waferData.value = data
    isGenerating.value = false
    ElMessage.success(`已生成 ${data.length.toLocaleString()} 个 Die`)
  }, 100)
}

// 处理框选
const handleSelect = (dies: Die[]) => {
  selectedDies.value = dies
  if (dies.length > 0) {
    const pass = dies.filter(d => binConfig[d.bin as keyof typeof binConfig]?.category === 'pass').length
    const yieldRate = ((pass / dies.length) * 100).toFixed(2)
    ElMessage.info(`已选中 ${dies.length} 个 Die，区域良率: ${yieldRate}%`)
  }
}

// 处理点击
const handleClick = (die: Die | null) => {
  clickedDie.value = die
}

// 处理 Bin 点击
const handleBinClick = (bin: number) => {
  const binDies = waferData.value.filter(d => d.bin === bin)
  ElMessage.info(`Bin ${bin}: ${binDies.length} 个 Die`)
}

// 重置视图
const resetView = () => {
  waferMapRef.value?.resetView()
  ElMessage.success('视图已重置')
}

// 导出数据
const exportData = (format: 'csv' | 'sinf' | 'stdf') => {
  if (waferData.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  let content = ''
  let filename = ''
  
  if (format === 'csv') {
    content = [
      'X,Y,Bin,Value,BinName',
      ...waferData.value.map(d => {
        const binInfo = binConfig[d.bin as keyof typeof binConfig]
        return `${d.x},${d.y},${d.bin},${d.value?.toFixed(2) || ''},${binInfo?.name || ''}`
      })
    ].join('\n')
    filename = 'wafer-map.csv'
  } else if (format === 'sinf') {
    // 简化的 SINF 格式
    content = `FileType: SINF\nWaferSize: ${waferSize.value}\nDieCount: ${waferData.value.length}\n\n`
    content += waferData.value.map(d => `${d.x},${d.y},${d.bin}`).join('\n')
    filename = 'wafer-map.sinf'
  }
  
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success(`已导出为 ${format.toUpperCase()} 格式`)
}

// 初始化
generateWaferData()
</script>

<template>
  <div class="wafer-pro-demo">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>🔬 专业 Wafer Map 分析系统</h2>
        <el-tag type="info">{{ waferData.length.toLocaleString() }} Dies</el-tag>
        <el-tag type="success">良率: {{ statistics?.yield || '0.00' }}%</el-tag>
        <el-tag>{{ waferSize }}" Wafer</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-button 
            :type="displayMode === 'bin' ? 'primary' : ''"
            @click="displayMode = 'bin'"
          >
            Bin Map
          </el-button>
          <el-button 
            :type="displayMode === 'heatmap' ? 'primary' : ''"
            @click="displayMode = 'heatmap'"
          >
            Heat Map
          </el-button>
        </el-button-group>
        
        <el-dropdown @command="exportData">
          <el-button>
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="csv">CSV 格式</el-dropdown-item>
              <el-dropdown-item command="sinf">SINF 格式</el-dropdown-item>
              <el-dropdown-item command="stdf" disabled>STDF 格式</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <el-button @click="resetView">
          <el-icon><Aim /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <div class="content-area">
      <!-- 左侧：控制面板 -->
      <div class="control-panel">
        <el-card>
          <template #header>
            <h3>⚙️ 控制面板</h3>
          </template>
          
          <el-form label-width="100px" label-position="top" size="small">
            <el-form-item label="数据量">
              <el-input-number
                v-model="dataSize"
                :min="1000"
                :max="1000000"
                :step="10000"
                :disabled="isGenerating"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="晶圆尺寸">
              <el-select v-model="waferSize" style="width: 100%">
                <el-option :value="4" label='4"' />
                <el-option :value="6" label='6"' />
                <el-option :value="8" label='8"' />
                <el-option :value="12" label='12"' />
                <el-option :value="18" label='18"' />
              </el-select>
            </el-form-item>
            
            <el-form-item label="显示选项">
              <el-checkbox v-model="showNotch">显示缺口</el-checkbox>
              <el-checkbox v-model="showCoordinates">显示坐标</el-checkbox>
              <el-checkbox v-model="showGrid">显示网格</el-checkbox>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                :loading="isGenerating"
                @click="generateWaferData"
                style="width: 100%"
              >
                <el-icon><Refresh /></el-icon>
                生成数据
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Bin 图例 -->
        <el-card style="margin-top: 16px">
          <template #header>
            <h3>📊 Bin 图例</h3>
          </template>
          
          <div class="bin-legend">
            <div
              v-for="stat in statistics?.binStats || []"
              :key="stat.bin"
              class="bin-legend-item"
              @click="handleBinClick(stat.bin)"
            >
              <div class="bin-color" :style="{ backgroundColor: stat.color }"></div>
              <div class="bin-info">
                <div class="bin-name">{{ stat.name }}</div>
                <div class="bin-stats">
                  <span class="bin-count">{{ stat.count.toLocaleString() }}</span>
                  <span class="bin-percent">{{ stat.percentage.toFixed(2) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 中间：Wafer Map -->
      <div class="map-container">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Wafer Map - {{ displayMode === 'bin' ? 'Bin 模式' : '热力图模式' }}</span>
              <el-tag v-if="selectedDies.length > 0" type="primary">
                已选中: {{ selectedDies.length }} Dies
              </el-tag>
            </div>
          </template>
          
          <div class="map-wrapper">
            <WaferMapPro
              ref="waferMapRef"
              :data="waferData"
              :width="800"
              :height="800"
              :bin-config="binConfig"
              :mode="displayMode"
              :wafer-size="waferSize"
              :show-notch="showNotch"
              :show-coordinates="showCoordinates"
              :show-grid="showGrid"
              @select="handleSelect"
              @click="handleClick"
              @bin-click="handleBinClick"
            />
          </div>
        </el-card>
      </div>

      <!-- 右侧：详细信息 -->
      <div class="info-panel">
        <!-- Die 详情 -->
        <el-card v-if="clickedDie">
          <template #header>
            <h3>📍 Die 详情</h3>
          </template>
          
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="坐标">
              ({{ clickedDie.x }}, {{ clickedDie.y }})
            </el-descriptions-item>
            <el-descriptions-item label="Bin">
              <el-tag :color="binConfig[clickedDie.bin as keyof typeof binConfig]?.color">
                {{ clickedDie.bin }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Bin 名称">
              {{ binConfig[clickedDie.bin as keyof typeof binConfig]?.name || 'Unknown' }}
            </el-descriptions-item>
            <el-descriptions-item label="分类">
              {{ binConfig[clickedDie.bin as keyof typeof binConfig]?.category || 'N/A' }}
            </el-descriptions-item>
            <el-descriptions-item label="测试值">
              {{ clickedDie.value?.toFixed(2) || 'N/A' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 选中区域统计 -->
        <el-card v-if="selectedDies.length > 0" style="margin-top: 16px">
          <template #header>
            <h3>📦 选中区域统计</h3>
          </template>
          
          <div class="selection-stats">
            <p><strong>总数：</strong>{{ selectedDies.length }} Dies</p>
            <p><strong>良品：</strong>{{ selectedDies.filter(d => binConfig[d.bin as keyof typeof binConfig]?.category === 'pass').length }}</p>
            <p><strong>不良：</strong>{{ selectedDies.filter(d => binConfig[d.bin as keyof typeof binConfig]?.category === 'fail').length }}</p>
            <p><strong>区域良率：</strong>
              {{ ((selectedDies.filter(d => binConfig[d.bin as keyof typeof binConfig]?.category === 'pass').length / selectedDies.length) * 100).toFixed(2) }}%
            </p>
          </div>
        </el-card>

        <!-- 操作提示 -->
        <el-card style="margin-top: 16px">
          <template #header>
            <h3>💡 操作提示</h3>
          </template>
          
          <div class="tips">
            <p>🖱️ <strong>滚轮</strong>：缩放视图</p>
            <p>🖱️ <strong>拖拽</strong>：平移视图</p>
            <p>🔍 <strong>Shift+拖拽</strong>：框选区域</p>
            <p>🖱️ <strong>点击</strong>：查看 Die 详情</p>
            <p>🎨 <strong>点击图例</strong>：查看 Bin 信息</p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wafer-pro-demo {
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

.control-panel {
  width: 280px;
  overflow-y: auto;
  flex-shrink: 0;
}

.control-panel h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.bin-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bin-legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.bin-legend-item:hover {
  background: #e6f7ff;
  transform: translateX(4px);
}

.bin-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  flex-shrink: 0;
}

.bin-info {
  flex: 1;
  min-width: 0;
}

.bin-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bin-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.map-container {
  flex: 1;
  overflow: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #1a1a1a;
  border-radius: 8px;
}

.info-panel {
  width: 300px;
  overflow-y: auto;
  flex-shrink: 0;
}

.info-panel h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.selection-stats {
  font-size: 13px;
  line-height: 1.8;
}

.selection-stats p {
  margin: 8px 0;
}

.tips {
  font-size: 13px;
  line-height: 1.8;
}

.tips p {
  margin: 8px 0;
}
</style>
