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
            @die-click="handleDieClick"
            @selection="handleSelection"
            @zoom="handleZoom"
            @ready="handleReady"
            @error="handleError"
          />
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

// Web Worker 实例
let dataWorker: Worker | null = null

/**
 * 生成测试缺陷数据（使用 Web Worker）
 */
const generateDefects = () => {
  // 如果数据量小于 10 万，直接在主线程生成
  if (defectCount.value < 100000) {
    generateDefectsSync()
    return
  }

  // 大数据量使用 Web Worker
  ElMessage.info('正在生成数据，请稍候...')

  // 创建 Worker
  if (!dataWorker) {
    dataWorker = new Worker(new URL('../workers/dataGenerator.ts', import.meta.url), {
      type: 'module'
    })
  }

  // 监听 Worker 消息
  dataWorker.onmessage = e => {
    if (e.data.type === 'progress') {
      console.log(`生成进度: ${e.data.percentage}% (${e.data.current}/${e.data.total})`)
    } else if (e.data.type === 'complete') {
      defects.value = e.data.defects
      ElMessage.success(
        `生成 ${defectCount.value} 个缺陷，分布在 ${e.data.possibleDiesCount} 个 Die 上，耗时 ${e.data.generateTime.toFixed(2)}ms`
      )
    }
  }

  dataWorker.onerror = error => {
    console.error('Worker error:', error)
    ElMessage.error('数据生成失败，请重试')
  }

  // 发送生成请求
  dataWorker.postMessage({
    type: 'generate',
    count: defectCount.value,
    waferConfig: {
      diameter: waferConfig.diameter,
      dieWidth: waferConfig.dieWidth,
      dieHeight: waferConfig.dieHeight,
      scribeLineX: waferConfig.scribeLineX,
      scribeLineY: waferConfig.scribeLineY,
      dieOffsetX: waferConfig.dieOffsetX,
      dieOffsetY: waferConfig.dieOffsetY,
      edgeExclusion: waferConfig.edgeExclusion
    }
  })
}

/**
 * 同步生成数据（小数据量）
 */
const generateDefectsSync = () => {
  const newDefects: Defect[] = []
  const defectTypes = ['scratch', 'particle', 'void', 'crack', 'contamination']

  const startTime = performance.now()

  // 计算晶圆上可能的 Die 范围
  const waferRadius = waferConfig.diameter / 2
  const dieWidthWithScribe = waferConfig.dieWidth + waferConfig.scribeLineX
  const dieHeightWithScribe = waferConfig.dieHeight + waferConfig.scribeLineY

  // 计算最大行列数
  const maxRows = Math.ceil(waferRadius / dieHeightWithScribe) * 2
  const maxCols = Math.ceil(waferRadius / dieWidthWithScribe) * 2

  // 生成所有可能的 Die 位置
  const possibleDies: Array<{ row: number; col: number }> = []
  for (let row = -Math.floor(maxRows / 2); row <= Math.floor(maxRows / 2); row++) {
    for (let col = -Math.floor(maxCols / 2); col <= Math.floor(maxCols / 2); col++) {
      // 简单的圆形检测：Die 中心到晶圆中心的距离
      const centerX_mm = col * dieWidthWithScribe + waferConfig.dieOffsetX
      const centerY_mm = row * dieHeightWithScribe + waferConfig.dieOffsetY
      const distanceToCenter = Math.sqrt(centerX_mm * centerX_mm + centerY_mm * centerY_mm)

      // 如果 Die 中心在有效区域内，认为是有效 Die
      if (distanceToCenter <= waferRadius - waferConfig.edgeExclusion) {
        possibleDies.push({ row, col })
      }
    }
  }

  // 在有效 Die 上随机生成缺陷
  for (let i = 0; i < defectCount.value; i++) {
    // 随机选择一个有效 Die
    const randomDie = possibleDies[Math.floor(Math.random() * possibleDies.length)]

    newDefects.push({
      dieRow: randomDie.row,
      dieCol: randomDie.col,
      x: Math.random(),
      y: Math.random(),
      type: defectTypes[Math.floor(Math.random() * defectTypes.length)],
      size: 0.5
    })
  }

  defects.value = newDefects

  const generateTime = performance.now() - startTime
  ElMessage.success(
    `生成 ${defectCount.value} 个缺陷，分布在 ${possibleDies.length} 个 Die 上，耗时 ${generateTime.toFixed(2)}ms`
  )
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

  // 调用 WaferMap 组件的清除选择方法
  if (waferMapRef.value) {
    waferMapRef.value.clearSelection()
  }
}

// 初始化：生成默认缺陷数据
generateDefects()
</script>

<style scoped lang="scss">
.wafer-map-demo {
  padding: 20px;
  background: #f5f7fa;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  :deep(.el-row) {
    flex: 1;
    overflow: hidden;
    margin: 0 !important;
  }

  :deep(.el-col) {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding-left: 10px !important;
    padding-right: 10px !important;

    &:first-child {
      padding-left: 0 !important;
    }

    &:last-child {
      padding-right: 0 !important;
    }
  }
}

.config-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    padding: 15px;
    flex: 1;
    overflow-y: auto;
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
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    overflow: hidden;
    padding: 0;
  }

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
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 500px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

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
