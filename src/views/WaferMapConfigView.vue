<template>
  <div class="wafer-map-config-view">
    <div class="page-header">
      <h2>Wafer Map 配置</h2>
      <p class="description">根据参数生成 Wafer Map</p>
    </div>

    <div class="content-wrapper">
      <!-- 左侧配置面板 -->
      <div class="config-panel">
        <WaferConfigForm v-model="config" />
      </div>

      <!-- 右侧 Wafer Map 显示区域 -->
      <div class="wafer-display">
        <WaferMapCanvas :config="config" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WaferConfigForm from '@/components/WaferConfigForm.vue'
import WaferMapCanvas from '@/components/WaferMapCanvas.vue'
import type { WaferConfig } from '@/components/WaferConfigForm.vue'

const config = ref<WaferConfig>({
  diameter: 300,
  dieWidth: 20,
  dieHeight: 20,
  reticleX: 3,
  reticleY: 3,
  scribeLineX: 0.08,
  scribeLineY: 0.08,
  offsetBy: 'By Die',
  dieOffsetX: 0,
  dieOffsetY: 0,
  reticleOffsetX: 15.03,
  reticleOffsetY: 10.05,
  notch: 'DOWN',
  xPositive: 'RIGHT',
  yPositive: 'UP',
  centerX: 0,
  centerY: 0,
  bevel: 3,
  showReticleBorder: false,
  // 缺陷相关配置
  showDefects: false,
  defectSize: 2,
  defectData: generateTestDefects(1000) // 生成1000个测试缺陷
})

// 生成测试缺陷数据
function generateTestDefects(count: number) {
  const defects = []
  const defectTypes = ['scratch', 'particle', 'void', 'crack', 'contamination']

  for (let i = 0; i < count; i++) {
    // 随机生成 Die 位置（在 -6 到 6 的范围内）
    const dieRow = Math.floor(Math.random() * 13) - 6
    const dieCol = Math.floor(Math.random() * 13) - 6

    // 随机生成 Die 内的位置（0-1）
    const x = Math.random()
    const y = Math.random()

    // 随机选择缺陷类型
    const type = defectTypes[Math.floor(Math.random() * defectTypes.length)]

    // 随机生成缺陷大小（1.5-3）
    const size = 1.5 + Math.random() * 1.5

    defects.push({ dieRow, dieCol, x, y, type, size })
  }

  console.log(`Generated ${count} test defects`)
  return defects
}
</script>

<style scoped lang="scss">
.wafer-map-config-view {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: auto;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #303133;
  }

  .description {
    margin: 0;
    font-size: 14px;
    color: #909399;
  }
}

.content-wrapper {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.config-panel {
  width: 400px;
  flex-shrink: 0;
  overflow-y: auto;

  .config-card {
    height: 100%;

    .card-header {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .unit {
    margin-left: 8px;
    color: #909399;
    font-size: 14px;
  }
}

.wafer-display {
  flex: 1;
  overflow: hidden;

  .display-card {
    height: 100%;
    display: flex;
    flex-direction: column;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 16px;

      .stats {
        display: flex;
        gap: 20px;
        font-size: 14px;
        font-weight: normal;
        color: #606266;

        span {
          &:first-child {
            color: #909399;
          }

          &:last-child {
            color: #409eff;
            font-weight: 600;
          }
        }
      }
    }

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
  }
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  canvas {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: #fff;
    cursor: crosshair;
  }
}

:deep(.el-input-number) {
  width: 180px;
}

:deep(.el-divider) {
  margin: 20px 0;
}
</style>
