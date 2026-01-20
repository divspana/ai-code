<!--
  Wafer Map 组件使用示例
  展示如何使用新的组件化 WaferMap
-->
<template>
  <div class="wafer-map-demo">
    <el-row :gutter="20">
      <!-- 配置面板 -->
      <el-col :span="6">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>配置参数</span>
            </div>
          </template>

          <el-form label-width="120px" size="small">
            <el-divider content-position="left">晶圆参数</el-divider>

            <el-form-item label="直径 (mm)">
              <el-input-number v-model="waferConfig.diameter" :min="100" :max="450" />
            </el-form-item>

            <el-form-item label="边缘排除 (mm)">
              <el-input-number v-model="waferConfig.edgeExclusion" :min="0" :max="20" />
            </el-form-item>

            <el-form-item label="Notch 位置">
              <el-select v-model="waferConfig.notch">
                <el-option label="上" value="UP" />
                <el-option label="下" value="DOWN" />
                <el-option label="左" value="LEFT" />
                <el-option label="右" value="RIGHT" />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">Die 参数</el-divider>

            <el-form-item label="Die 宽度 (mm)">
              <el-input-number v-model="waferConfig.dieWidth" :min="1" :max="50" :step="0.1" />
            </el-form-item>

            <el-form-item label="Die 高度 (mm)">
              <el-input-number v-model="waferConfig.dieHeight" :min="1" :max="50" :step="0.1" />
            </el-form-item>

            <el-divider content-position="left">缺陷参数</el-divider>

            <el-form-item label="显示缺陷">
              <el-switch v-model="renderConfig.showDefects" />
            </el-form-item>

            <el-form-item label="缺陷数量">
              <el-input-number v-model="defectCount" :min="0" :max="1000000" :step="1000" />
              <el-button
                type="primary"
                size="small"
                @click="generateDefects"
                style="margin-top: 8px"
              >
                生成缺陷
              </el-button>
            </el-form-item>

            <el-divider content-position="left">性能优化</el-divider>

            <el-form-item label="视口裁剪">
              <el-switch v-model="renderConfig.enableViewportCulling" />
            </el-form-item>

            <el-form-item label="数据抽稀">
              <el-switch v-model="renderConfig.enableDataDecimation" />
            </el-form-item>

            <el-divider content-position="left">交互功能</el-divider>

            <el-form-item label="启用缩放">
              <el-switch v-model="renderConfig.enableZoom" />
            </el-form-item>

            <el-form-item label="启用 Tooltip">
              <el-switch v-model="renderConfig.enableTooltip" />
            </el-form-item>

            <el-form-item label="显示统计">
              <el-switch v-model="showStats" />
            </el-form-item>

            <el-form-item label="显示调试">
              <el-switch v-model="showDebugInfo" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- Wafer Map 显示区域 -->
      <el-col :span="18">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <span>Wafer Map 可视化</span>
              <div class="header-actions">
                <el-tag v-if="selectedDies.length > 0" type="success">
                  已选择 {{ selectedDies.length }} 个 Die
                </el-tag>
                <el-button size="small" @click="clearSelection">清除选择</el-button>
              </div>
            </div>
          </template>

          <WaferMap
            ref="waferMapRef"
            :wafer-config="waferConfig"
            :defects="defects"
            :render-config="renderConfig"
            :show-stats="showStats"
            :show-debug-info="showDebugInfo"
            height="700px"
            @die-click="handleDieClick"
            @selection="handleSelection"
            @zoom="handleZoom"
            @ready="handleReady"
            @error="handleError"
          />
        </el-card>

        <!-- 选中的 Die 信息 -->
        <el-card v-if="clickedDie" class="info-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>Die 详细信息</span>
              <el-button size="small" @click="clickedDie = null">关闭</el-button>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="行号">{{ clickedDie.row }}</el-descriptions-item>
            <el-descriptions-item label="列号">{{ clickedDie.col }}</el-descriptions-item>
            <el-descriptions-item label="X 坐标"
              >{{ clickedDie.x.toFixed(2) }} mm</el-descriptions-item
            >
            <el-descriptions-item label="Y 坐标"
              >{{ clickedDie.y.toFixed(2) }} mm</el-descriptions-item
            >
            <el-descriptions-item label="缺陷数量" :span="2">
              <el-tag :type="clickedDie.defects?.length ? 'danger' : 'success'">
                {{ clickedDie.defects?.length || 0 }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider v-if="clickedDie.defects && clickedDie.defects.length > 0"
            >缺陷列表</el-divider
          >

          <el-table
            v-if="clickedDie.defects && clickedDie.defects.length > 0"
            :data="clickedDie.defects"
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="x" label="X 位置" width="100">
              <template #default="{ row }">{{ row.x.toFixed(3) }}</template>
            </el-table-column>
            <el-table-column prop="y" label="Y 位置" width="100">
              <template #default="{ row }">{{ row.y.toFixed(3) }}</template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="100">
              <template #default="{ row }">{{ row.size?.toFixed(2) || '-' }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { WaferMap } from '@/components/wafer-map'
import type { WaferConfig, RenderConfig, Defect, DieInfo } from '@/components/wafer-map'

// Wafer 配置
const waferConfig = reactive<WaferConfig>({
  diameter: 300,
  edgeExclusion: 5,
  notch: 'DOWN',
  dieWidth: 10,
  dieHeight: 10,
  dieOffsetX: 0,
  dieOffsetY: 0,
  scribeLineX: 0.2,
  scribeLineY: 0.2,
  reticleX: 3,
  reticleY: 3,
  showReticleBorder: true,
  xPositive: 'RIGHT',
  yPositive: 'UP'
})

// 渲染配置
const renderConfig = reactive<Partial<RenderConfig>>({
  showDefects: true,
  defectSize: 2,
  enablePerformanceMode: true,
  enableViewportCulling: true,
  enableDataDecimation: true,
  enableZoom: true,
  enablePan: true,
  enableSelection: true,
  enableTooltip: true,
  enableClick: true
})

// 缺陷数据
const defects = ref<Defect[]>([])
const defectCount = ref(10000)

// 组件引用
const waferMapRef = ref()

// 显示选项
const showStats = ref(true)
const showDebugInfo = ref(false)

// 交互状态
const clickedDie = ref<DieInfo | null>(null)
const selectedDies = ref<DieInfo[]>([])

/**
 * 生成测试缺陷数据
 */
const generateDefects = () => {
  const newDefects: Defect[] = []
  const defectTypes = ['scratch', 'particle', 'void', 'crack', 'contamination']

  const startTime = performance.now()

  for (let i = 0; i < defectCount.value; i++) {
    newDefects.push({
      dieRow: Math.floor(Math.random() * 13) - 6,
      dieCol: Math.floor(Math.random() * 13) - 6,
      x: Math.random(),
      y: Math.random(),
      type: defectTypes[Math.floor(Math.random() * defectTypes.length)],
      size: 1.5 + Math.random() * 1.5
    })
  }

  defects.value = newDefects

  const generateTime = performance.now() - startTime
  ElMessage.success(`生成 ${defectCount.value} 个缺陷，耗时 ${generateTime.toFixed(2)}ms`)
}

/**
 * Die 点击事件
 */
const handleDieClick = (die: DieInfo) => {
  clickedDie.value = die
  console.log('Clicked die:', die)
}

/**
 * 框选事件
 */
const handleSelection = (dies: DieInfo[]) => {
  selectedDies.value = dies
  ElMessage.info(`选中了 ${dies.length} 个 Die`)
  console.log('Selected dies:', dies)
}

/**
 * 缩放事件
 */
const handleZoom = (level: number) => {
  console.log('Zoom level:', level)
}

/**
 * 就绪事件
 */
const handleReady = () => {
  console.log('Wafer map ready')
}

/**
 * 错误事件
 */
const handleError = (error: Error) => {
  ElMessage.error(`渲染错误: ${error.message}`)
  console.error('Render error:', error)
}

/**
 * 清除选择
 */
const clearSelection = () => {
  selectedDies.value = []
  clickedDie.value = null
}

// 初始化：生成默认缺陷数据
generateDefects()
</script>

<style scoped lang="scss">
.wafer-map-demo {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.config-card {
  height: calc(100vh - 40px);
  overflow-y: auto;

  :deep(.el-card__body) {
    padding: 15px;
  }

  .el-form-item {
    margin-bottom: 16px;
  }

  .el-input-number {
    width: 100%;
  }

  .el-select {
    width: 100%;
  }
}

.map-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }
}

.info-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}
</style>
