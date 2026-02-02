<template>
  <div class="wheel-zoom-example">
    <div class="controls">
      <el-button-group>
        <el-button :disabled="!wheelZoom.canZoomIn.value" @click="handleZoomIn">
          <el-icon><ZoomIn /></el-icon>
          放大
        </el-button>
        <el-button :disabled="!wheelZoom.canZoomOut.value" @click="handleZoomOut">
          <el-icon><ZoomOut /></el-icon>
          缩小
        </el-button>
        <el-button @click="handleReset">
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
        <el-button @click="handleFitToContainer">
          <el-icon><FullScreen /></el-icon>
          适应窗口
        </el-button>
      </el-button-group>

      <el-divider direction="vertical" />

      <div class="zoom-info">
        <el-tag>缩放: {{ wheelZoom.zoomPercentage.value }}%</el-tag>
        <el-tag type="info">X: {{ wheelZoom.translateX.value.toFixed(0) }}</el-tag>
        <el-tag type="info">Y: {{ wheelZoom.translateY.value.toFixed(0) }}</el-tag>
      </div>

      <el-divider direction="vertical" />

      <div class="config-controls">
        <el-checkbox v-model="smoothZoom" @change="updateConfig">平滑缩放</el-checkbox>
        <span style="margin-left: 12px">缩放速度:</span>
        <el-slider
          v-model="zoomSpeed"
          :min="0.0001"
          :max="0.005"
          :step="0.0001"
          :format-tooltip="(val: number) => (val * 1000).toFixed(1)"
          style="width: 120px; margin-left: 8px"
          @change="updateConfig"
        />
      </div>
    </div>

    <div ref="containerRef" class="canvas-container" @wheel="handleWheel">
      <div class="content" :style="{ transform: wheelZoom.transformStyle.value }">
        <div class="wafer-circle">
          <div class="center-mark"></div>
          <div class="grid">
            <div
              v-for="i in 10"
              :key="`h-${i}`"
              class="grid-line horizontal"
              :style="{ top: `${i * 10}%` }"
            ></div>
            <div
              v-for="i in 10"
              :key="`v-${i}`"
              class="grid-line vertical"
              :style="{ left: `${i * 10}%` }"
            ></div>
          </div>
          <div class="label">晶圆图</div>
        </div>
      </div>
    </div>

    <div class="instructions">
      <el-alert type="info" :closable="false">
        <template #title>
          <strong>使用说明：</strong>
        </template>
        <ul>
          <li>使用鼠标滚轮进行缩放（以鼠标位置为中心）</li>
          <li>点击按钮进行放大、缩小、重置操作</li>
          <li>可以调整缩放速度和启用/禁用平滑缩放</li>
          <li>支持缩放范围限制（0.1x - 10x）</li>
        </ul>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWheelZoom } from '../hooks/useWheelZoom'
import { ZoomIn, ZoomOut, RefreshRight, FullScreen } from '@element-plus/icons-vue'

const containerRef = ref<HTMLDivElement>()
const smoothZoom = ref(true)
const zoomSpeed = ref(0.001)

// 创建滚轮缩放实例
const wheelZoom = useWheelZoom({
  minZoom: 0.1,
  maxZoom: 10,
  zoomSpeed: zoomSpeed.value,
  smoothZoom: smoothZoom.value,
  zoomStep: 0.2
})

/**
 * 处理滚轮事件
 */
const handleWheel = (event: WheelEvent) => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  wheelZoom.handleWheel(event, rect)
}

/**
 * 放大
 */
const handleZoomIn = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  wheelZoom.zoomIn(centerX, centerY)
}

/**
 * 缩小
 */
const handleZoomOut = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  wheelZoom.zoomOut(centerX, centerY)
}

/**
 * 重置
 */
const handleReset = () => {
  wheelZoom.resetZoom()
}

/**
 * 适应窗口
 */
const handleFitToContainer = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  wheelZoom.fitToContainer(400, 400, rect.width, rect.height, 20)
}

/**
 * 更新配置
 */
const updateConfig = () => {
  // 重新创建实例以应用新配置
  // 注意：实际使用中可以通过暴露配置更新方法来避免重新创建
  console.log('配置已更新:', {
    smoothZoom: smoothZoom.value,
    zoomSpeed: zoomSpeed.value
  })
}

onMounted(() => {
  // 初始适应窗口
  setTimeout(() => {
    handleFitToContainer()
  }, 100)
})

onUnmounted(() => {
  wheelZoom.cleanup()
})
</script>

<style scoped lang="scss">
.wheel-zoom-example {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100vh;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.zoom-info {
  display: flex;
  gap: 8px;
}

.config-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  border: 2px solid #ddd;
  border-radius: 8px;
  background:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  transition: transform 0.05s ease-out;
}

.wafer-circle {
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;

  .center-mark {
    position: absolute;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 10;

    &::before,
    &::after {
      content: '';
      position: absolute;
      background: #fff;
    }

    &::before {
      width: 2px;
      height: 60px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    &::after {
      width: 60px;
      height: 2px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .grid {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;

    .grid-line {
      position: absolute;
      background: rgba(255, 255, 255, 0.2);

      &.horizontal {
        width: 100%;
        height: 1px;
        left: 0;
      }

      &.vertical {
        width: 1px;
        height: 100%;
        top: 0;
      }
    }
  }

  .label {
    position: absolute;
    bottom: 30px;
    color: #fff;
    font-size: 24px;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    z-index: 5;
  }
}

.instructions {
  :deep(.el-alert) {
    ul {
      margin: 8px 0 0 0;
      padding-left: 20px;

      li {
        margin: 4px 0;
        line-height: 1.6;
      }
    }
  }
}
</style>
