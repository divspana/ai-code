<template>
  <div class="large-data-example">
    <div class="controls">
      <el-button @click="loadLargeData(10000)">加载 1w 坏点</el-button>
      <el-button @click="loadLargeData(100000)">加载 10w 坏点</el-button>
      <el-button @click="loadLargeData(1000000)">加载 100w 坏点</el-button>
      <el-button @click="clearSelection" type="danger">清空选择</el-button>

      <el-divider direction="vertical" />

      <div class="optimization-controls">
        <span>优化策略:</span>
        <el-select v-model="samplingStrategy" @change="updateStrategy" style="width: 120px">
          <el-option label="密度采样" value="density" />
          <el-option label="网格采样" value="grid" />
          <el-option label="随机采样" value="random" />
          <el-option label="优先级采样" value="priority" />
        </el-select>

        <span style="margin-left: 12px">最大信息框:</span>
        <el-input-number
          v-model="maxInfoBoxes"
          :min="10"
          :max="200"
          :step="10"
          @change="updateStrategy"
          style="width: 120px"
        />

        <el-checkbox v-model="enableClustering" @change="updateStrategy" style="margin-left: 12px">
          启用聚类
        </el-checkbox>
      </div>
    </div>

    <div class="stats">
      <el-tag>总坏点数: {{ totalDefects }}</el-tag>
      <el-tag type="success">选中坏点数: {{ selectedCount }}</el-tag>
      <el-tag type="warning">显示信息框: {{ displayedInfoBoxes }}</el-tag>
      <el-tag type="info">渲染时间: {{ renderTime }}ms</el-tag>
    </div>

    <div ref="containerRef" class="canvas-container">
      <canvas ref="backgroundCanvasRef"></canvas>
      <canvas ref="defectsCanvasRef"></canvas>
      <canvas ref="interactionCanvasRef"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDefectInfoBox } from '../hooks/useDefectInfoBox'
import type { DefectArrayData } from '../types/defectData'

const containerRef = ref<HTMLDivElement>()
const backgroundCanvasRef = ref<HTMLCanvasElement>()
const defectsCanvasRef = ref<HTMLCanvasElement>()
const interactionCanvasRef = ref<HTMLCanvasElement>()

const canvasSize = 800

// 优化配置
const samplingStrategy = ref<'random' | 'grid' | 'density' | 'priority'>('density')
const maxInfoBoxes = ref(50)
const enableClustering = ref(true)

// 创建信息框管理器（启用优化）
const infoBox = useDefectInfoBox({
  canvasSize,
  enableOptimization: true,
  optimizationConfig: {
    maxInfoBoxes: maxInfoBoxes.value,
    samplingStrategy: samplingStrategy.value,
    enableClustering: enableClustering.value,
    clusterThreshold: 30
  }
})

// 数据状态
const defectData = ref<DefectArrayData>({
  logicx: [],
  logicy: [],
  defectType: []
})

const renderTime = ref(0)

const totalDefects = computed(() => defectData.value.logicx.length)
const selectedCount = computed(() => infoBox.totalDefectsCount.value)
const displayedInfoBoxes = computed(() => infoBox.selectedDefects.value.length)

/**
 * 加载大数据量
 */
const loadLargeData = (count: number) => {
  console.time(`Load ${count} defects`)

  const logicx: number[] = []
  const logicy: number[] = []
  const defectType: string[] = []

  // 生成模拟数据
  for (let i = 0; i < count; i++) {
    logicx.push(Math.random() * 300)
    logicy.push(Math.random() * 300)
    defectType.push(`type${Math.floor(Math.random() * 5) + 1}`)
  }

  defectData.value = { logicx, logicy, defectType }

  console.timeEnd(`Load ${count} defects`)

  // 模拟选中一些坏点
  simulateSelection(Math.min(count, 10000))
}

/**
 * 模拟选中坏点
 */
const simulateSelection = (count: number) => {
  console.time('Selection and rendering')
  const startTime = performance.now()

  // 模拟选中的坏点数据
  const selected = []
  for (let i = 0; i < count; i++) {
    selected.push({
      x: defectData.value.logicx[i],
      y: defectData.value.logicy[i],
      canvasX: Math.random() * canvasSize,
      canvasY: Math.random() * canvasSize,
      type: defectData.value.defectType?.[i] || 'unknown',
      index: i
    })
  }

  // 设置选中的坏点（会自动应用优化）
  infoBox.setSelectedDefects(selected)

  // 绘制
  const canvas = interactionCanvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize, canvasSize)
      infoBox.render(ctx)
    }
  }

  const endTime = performance.now()
  renderTime.value = Math.round(endTime - startTime)

  console.timeEnd('Selection and rendering')
  console.log(`优化前: ${count} 个坏点`)
  console.log(`优化后: ${displayedInfoBoxes.value} 个信息框`)
  console.log(`渲染时间: ${renderTime.value}ms`)
}

/**
 * 更新优化策略
 */
const updateStrategy = () => {
  infoBox.updateOptimizationConfig({
    maxInfoBoxes: maxInfoBoxes.value,
    samplingStrategy: samplingStrategy.value,
    enableClustering: enableClustering.value
  })

  // 重新应用优化
  if (selectedCount.value > 0) {
    simulateSelection(selectedCount.value)
  }
}

/**
 * 清空选择
 */
const clearSelection = () => {
  infoBox.clearSelectedDefects()
  const canvas = interactionCanvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize, canvasSize)
    }
  }
  renderTime.value = 0
}

// 初始化 Canvas
const initCanvas = () => {
  const canvases = [backgroundCanvasRef.value, defectsCanvasRef.value, interactionCanvasRef.value]

  canvases.forEach(canvas => {
    if (canvas) {
      canvas.width = canvasSize
      canvas.height = canvasSize
    }
  })
}

// 组件挂载
import { onMounted } from 'vue'
onMounted(() => {
  initCanvas()
})
</script>

<style scoped>
.large-data-example {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.optimization-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.stats {
  display: flex;
  gap: 12px;
}

.canvas-container {
  position: relative;
  width: 800px;
  height: 800px;
  border: 1px solid #ddd;
  background: #f9f9f9;
}

.canvas-container canvas {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
