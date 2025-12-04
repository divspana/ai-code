<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Aim, Download } from '@element-plus/icons-vue'
import WaferMap from './components/WaferMap.vue'

interface Die {
  x: number
  y: number
  bin: number
  value?: number
}

// 生成测试数据
const dataSize = ref(10000) // 默认 1 万，可调整到 500 万
const waferData = ref<Die[]>([])
const selectedDies = ref<Die[]>([])
const clickedDie = ref<Die | null>(null)
const isGenerating = ref(false)

// 放大显示相关
const showZoomDialog = ref(false)
const zoomedData = ref<Die[]>([])
const zoomRegion = ref({ minX: 0, maxX: 0, minY: 0, maxY: 0 })

// 颜色映射
const colorMap: Record<number, string> = {
  0: '#424242',  // 未测试 - 深灰
  1: '#4caf50',  // Pass - 绿色
  2: '#f44336',  // Fail - 红色
  3: '#ff9800',  // Warning - 橙色
  4: '#2196f3',  // Special - 蓝色
  5: '#9c27b0',  // Other - 紫色
}

// 统计信息
const statistics = computed(() => {
  const binCount: Record<number, number> = {}
  waferData.value.forEach(die => {
    binCount[die.bin] = (binCount[die.bin] || 0) + 1
  })
  
  const total = waferData.value.length
  const pass = binCount[1] || 0
  const fail = binCount[2] || 0
  const yield_rate = total > 0 ? ((pass / total) * 100).toFixed(2) : '0.00'
  
  return {
    total,
    pass,
    fail,
    yield: yield_rate,
    binCount
  }
})

// 生成 Wafer 数据
const generateWaferData = () => {
  isGenerating.value = true
  waferData.value = []
  
  // 使用 setTimeout 避免阻塞 UI
  setTimeout(() => {
    const data: Die[] = []
    const radius = Math.sqrt(dataSize.value / Math.PI) // 计算半径
    
    // 生成圆形 wafer 数据
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        // 只生成圆形区域内的点
        if (x * x + y * y <= radius * radius) {
          // 模拟不同的 bin 分布
          let bin = 1 // 默认 Pass
          const distanceFromCenter = Math.sqrt(x * x + y * y)
          const normalizedDistance = distanceFromCenter / radius
          
          // 边缘区域更容易 Fail
          if (normalizedDistance > 0.9) {
            bin = Math.random() < 0.6 ? 2 : 1
          } else if (normalizedDistance > 0.7) {
            bin = Math.random() < 0.3 ? 2 : (Math.random() < 0.1 ? 3 : 1)
          } else {
            // 随机分布一些 Fail 和 Warning
            const rand = Math.random()
            if (rand < 0.05) bin = 2
            else if (rand < 0.08) bin = 3
            else if (rand < 0.10) bin = 4
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
  
  if (dies.length === 0) {
    ElMessage.warning('未选中任何 Die')
    return
  }
  
  // 计算选中区域的范围
  const minX = Math.min(...dies.map(d => d.x))
  const maxX = Math.max(...dies.map(d => d.x))
  const minY = Math.min(...dies.map(d => d.y))
  const maxY = Math.max(...dies.map(d => d.y))
  
  zoomRegion.value = { minX, maxX, minY, maxY }
  
  // 重新映射坐标，使其从 (0,0) 开始
  zoomedData.value = dies.map(die => ({
    ...die,
    x: die.x - minX,
    y: die.y - minY
  }))
  
  // 显示放大弹窗
  showZoomDialog.value = true
  ElMessage.success(`已选中 ${dies.length} 个 Die，正在放大显示`)
}

// 处理点击
const handleClick = (die: Die | null) => {
  clickedDie.value = die
  if (die) {
    console.log('Clicked Die:', die)
  }
}

// Wafer Map 引用
const waferMapRef = ref()

// 重置视图
const resetView = () => {
  waferMapRef.value?.resetView()
  ElMessage.success('视图已重置')
}

// 导出选中数据
const exportSelection = () => {
  if (selectedDies.value.length === 0) {
    ElMessage.warning('请先框选区域')
    return
  }
  
  const csv = [
    'X,Y,Bin,Value',
    ...selectedDies.value.map(d => `${d.x},${d.y},${d.bin},${d.value?.toFixed(2) || ''}`)
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wafer-selection.csv'
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据已导出')
}

// 初始化
generateWaferData()
</script>

<template>
  <div class="wafer-demo">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>🔬 Wafer Map 可视化</h2>
        <el-tag type="info">{{ statistics.total.toLocaleString() }} Dies</el-tag>
        <el-tag type="success">良率: {{ statistics.yield }}%</el-tag>
      </div>
      <div class="toolbar-right">
        <el-input-number
          v-model="dataSize"
          :min="1000"
          :max="5000000"
          :step="10000"
          :disabled="isGenerating"
          style="width: 180px"
        />
        <el-tag v-if="dataSize > 100000" type="warning" size="small">
          数据量较大，可能影响性能
        </el-tag>
        <el-button
          type="primary"
          :loading="isGenerating"
          @click="generateWaferData"
        >
          <el-icon><Refresh /></el-icon>
          生成数据
        </el-button>
        <el-button @click="resetView">
          <el-icon><Aim /></el-icon>
          重置视图
        </el-button>
        <el-button
          :disabled="selectedDies.length === 0"
          @click="exportSelection"
        >
          <el-icon><Download /></el-icon>
          导出选中
        </el-button>
      </div>
    </div>

    <div class="content-area">
      <!-- 左侧：Wafer Map -->
      <div class="map-container">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Wafer Map</span>
              <el-tag v-if="selectedDies.length > 0" type="primary">
                已选中: {{ selectedDies.length }} Dies
              </el-tag>
            </div>
          </template>
          
          <div class="map-wrapper">
            <WaferMap
              ref="waferMapRef"
              :data="waferData"
              :width="800"
              :height="800"
              :color-map="colorMap"
              :show-grid="true"
              :enable-selection="true"
              @select="handleSelect"
              @click="handleClick"
            />
          </div>
          
          <div class="map-tips">
            <el-alert type="info" :closable="false">
              <p><strong>操作提示：</strong></p>
              <ul>
                <li>🖱️ <strong>鼠标滚轮</strong>：缩放视图</li>
                <li>🖱️ <strong>左键拖拽</strong>：平移视图</li>
                <li>🔍 <strong>Shift + 左键拖拽</strong>：框选区域，自动弹窗放大显示</li>
                <li>🖱️ <strong>点击 Die</strong>：查看详细信息</li>
                <li>⚡ <strong>性能提示</strong>：缩小视图时自动采样渲染，放大时显示详细网格</li>
              </ul>
            </el-alert>
          </div>
        </el-card>
      </div>

      <!-- 右侧：信息面板 -->
      <div class="info-panel">
        <!-- 统计信息 -->
        <el-card class="stats-card">
          <template #header>
            <h3>📊 统计信息</h3>
          </template>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">总数</span>
              <span class="stat-value">{{ statistics.total.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">良品</span>
              <span class="stat-value" style="color: #4caf50">{{ statistics.pass.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">不良</span>
              <span class="stat-value" style="color: #f44336">{{ statistics.fail.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">良率</span>
              <span class="stat-value">{{ statistics.yield }}%</span>
            </div>
          </div>
        </el-card>

        <!-- Bin 分布 -->
        <el-card class="bin-card">
          <template #header>
            <h3>🎨 Bin 分布</h3>
          </template>
          
          <div class="bin-list">
            <div
              v-for="(count, bin) in statistics.binCount"
              :key="bin"
              class="bin-item"
            >
              <div class="bin-color" :style="{ backgroundColor: colorMap[Number(bin)] }"></div>
              <span class="bin-label">Bin {{ bin }}</span>
              <span class="bin-count">{{ count.toLocaleString() }}</span>
              <span class="bin-percent">
                {{ ((count / statistics.total) * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </el-card>

        <!-- 点击的 Die 信息 -->
        <el-card v-if="clickedDie" class="die-card">
          <template #header>
            <h3>📍 Die 详情</h3>
          </template>
          
          <el-descriptions :column="1" border>
            <el-descriptions-item label="坐标">
              ({{ clickedDie.x }}, {{ clickedDie.y }})
            </el-descriptions-item>
            <el-descriptions-item label="Bin">
              <el-tag :color="colorMap[clickedDie.bin]">
                Bin {{ clickedDie.bin }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="数值">
              {{ clickedDie.value?.toFixed(2) || 'N/A' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 选中区域信息 -->
        <el-card v-if="selectedDies.length > 0" class="selection-card">
          <template #header>
            <h3>📦 选中区域</h3>
          </template>
          
          <div class="selection-stats">
            <p><strong>选中数量：</strong>{{ selectedDies.length }} Dies</p>
            <p><strong>良品：</strong>{{ selectedDies.filter(d => d.bin === 1).length }}</p>
            <p><strong>不良：</strong>{{ selectedDies.filter(d => d.bin === 2).length }}</p>
            <p><strong>区域良率：</strong>
              {{ ((selectedDies.filter(d => d.bin === 1).length / selectedDies.length) * 100).toFixed(2) }}%
            </p>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 放大显示弹窗 -->
    <el-dialog
      v-model="showZoomDialog"
      title="框选区域放大显示"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="zoom-dialog-content">
        <div class="zoom-info">
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="区域范围">
              X: {{ zoomRegion.minX }}-{{ zoomRegion.maxX }}, 
              Y: {{ zoomRegion.minY }}-{{ zoomRegion.maxY }}
            </el-descriptions-item>
            <el-descriptions-item label="Die 数量">
              {{ zoomedData.length }}
            </el-descriptions-item>
            <el-descriptions-item label="良品">
              {{ zoomedData.filter(d => d.bin === 1).length }}
            </el-descriptions-item>
            <el-descriptions-item label="区域良率">
              {{ ((zoomedData.filter(d => d.bin === 1).length / zoomedData.length) * 100).toFixed(2) }}%
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="zoom-map-wrapper">
          <WaferMap
            :data="zoomedData"
            :width="850"
            :height="600"
            :color-map="colorMap"
            :show-grid="true"
            :enable-selection="false"
            @click="handleClick"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="showZoomDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportSelection">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.wafer-demo {
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

.map-tips {
  margin-top: 20px;
}

.map-tips ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.map-tips li {
  margin: 4px 0;
  font-size: 13px;
}

.info-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex-shrink: 0;
}

.stats-card h3,
.bin-card h3,
.die-card h3,
.selection-card h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.bin-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bin-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.bin-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.bin-label {
  flex: 1;
  font-size: 13px;
  color: #606266;
}

.bin-count {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.bin-percent {
  font-size: 12px;
  color: #909399;
  min-width: 50px;
  text-align: right;
}

.selection-stats {
  font-size: 13px;
  line-height: 1.8;
}

.selection-stats p {
  margin: 8px 0;
}

/* 放大弹窗样式 */
.zoom-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.zoom-info {
  margin-bottom: 10px;
}

.zoom-map-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
}
</style>
