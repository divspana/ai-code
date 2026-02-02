# 鼠标滚轮缩放功能文档

## 📖 概述

`useWheelZoom` 是一个专门用于处理鼠标滚轮缩放的 Vue 3 Composition API Hook。它提供了以下核心功能：

- ✅ 以鼠标位置为中心的缩放
- ✅ 平滑缩放动画
- ✅ 缩放范围限制
- ✅ 编程式缩放控制
- ✅ 适应容器大小
- ✅ 缩放状态管理

## 🚀 快速开始

### 基础用法

```vue
<template>
  <div ref="containerRef" class="canvas-container" @wheel="handleWheel">
    <div :style="{ transform: wheelZoom.transformStyle.value }">
      <!-- 你的内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWheelZoom } from './hooks/useWheelZoom'

const containerRef = ref<HTMLDivElement>()

// 创建缩放实例
const wheelZoom = useWheelZoom({
  minZoom: 0.5,
  maxZoom: 5,
  zoomSpeed: 0.001,
  smoothZoom: true
})

// 处理滚轮事件
const handleWheel = (event: WheelEvent) => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  wheelZoom.handleWheel(event, rect)
}
</script>
```

## ⚙️ 配置选项

### WheelZoomConfig

| 参数         | 类型      | 默认值  | 说明                 |
| ------------ | --------- | ------- | -------------------- |
| `minZoom`    | `number`  | `0.1`   | 最小缩放比例         |
| `maxZoom`    | `number`  | `10`    | 最大缩放比例         |
| `zoomSpeed`  | `number`  | `0.001` | 缩放速度（越大越快） |
| `smoothZoom` | `boolean` | `true`  | 是否启用平滑缩放动画 |
| `zoomStep`   | `number`  | `0.1`   | 编程式缩放的步进值   |

### 示例

```typescript
const wheelZoom = useWheelZoom({
  minZoom: 0.1, // 最小缩放到 10%
  maxZoom: 10, // 最大放大到 1000%
  zoomSpeed: 0.002, // 较快的缩放速度
  smoothZoom: true, // 启用平滑动画
  zoomStep: 0.2 // 每次缩放 20%
})
```

## 📊 返回值

### 状态（Refs）

| 属性             | 类型                     | 说明                 |
| ---------------- | ------------------------ | -------------------- |
| `scale`          | `Ref<number>`            | 当前缩放比例         |
| `translateX`     | `Ref<number>`            | X 轴平移量           |
| `translateY`     | `Ref<number>`            | Y 轴平移量           |
| `zoomState`      | `ComputedRef<ZoomState>` | 完整的缩放状态对象   |
| `transformStyle` | `ComputedRef<string>`    | CSS transform 字符串 |
| `canZoomIn`      | `ComputedRef<boolean>`   | 是否可以继续放大     |
| `canZoomOut`     | `ComputedRef<boolean>`   | 是否可以继续缩小     |
| `zoomPercentage` | `ComputedRef<number>`    | 缩放百分比（如 150） |

### 方法

| 方法             | 参数                                                     | 说明           |
| ---------------- | -------------------------------------------------------- | -------------- |
| `handleWheel`    | `(event, containerRect)`                                 | 处理滚轮事件   |
| `zoomTo`         | `(scale, centerX?, centerY?)`                            | 缩放到指定比例 |
| `zoomIn`         | `(centerX?, centerY?)`                                   | 放大           |
| `zoomOut`        | `(centerX?, centerY?)`                                   | 缩小           |
| `resetZoom`      | `()`                                                     | 重置缩放       |
| `fitToContainer` | `(contentW, contentH, containerW, containerH, padding?)` | 适应容器       |
| `cleanup`        | `()`                                                     | 清理资源       |

## 💡 使用场景

### 1. Canvas 缩放

```vue
<template>
  <div ref="containerRef" @wheel="handleWheel">
    <canvas ref="canvasRef" :style="{ transform: wheelZoom.transformStyle.value }"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWheelZoom } from './hooks/useWheelZoom'

const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

const wheelZoom = useWheelZoom()

const handleWheel = (event: WheelEvent) => {
  if (!containerRef.value) return
  wheelZoom.handleWheel(event, containerRef.value.getBoundingClientRect())
}

onMounted(() => {
  // 初始化时适应容器
  if (containerRef.value && canvasRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    wheelZoom.fitToContainer(canvasRef.value.width, canvasRef.value.height, rect.width, rect.height)
  }
})
</script>
```

### 2. 图片查看器

```vue
<template>
  <div class="image-viewer" ref="containerRef" @wheel="handleWheel">
    <img
      :src="imageUrl"
      :style="{ transform: wheelZoom.transformStyle.value }"
      @load="handleImageLoad"
    />

    <div class="controls">
      <button @click="wheelZoom.zoomIn()">放大</button>
      <button @click="wheelZoom.zoomOut()">缩小</button>
      <button @click="wheelZoom.resetZoom()">重置</button>
      <span>{{ wheelZoom.zoomPercentage.value }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWheelZoom } from './hooks/useWheelZoom'

const containerRef = ref<HTMLDivElement>()
const imageUrl = ref('path/to/image.jpg')

const wheelZoom = useWheelZoom({
  minZoom: 0.1,
  maxZoom: 5
})

const handleWheel = (event: WheelEvent) => {
  if (!containerRef.value) return
  wheelZoom.handleWheel(event, containerRef.value.getBoundingClientRect())
}

const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    wheelZoom.fitToContainer(img.naturalWidth, img.naturalHeight, rect.width, rect.height)
  }
}
</script>
```

### 3. 地图/图表缩放

```vue
<template>
  <div class="map-container" ref="containerRef" @wheel="handleWheel">
    <div class="map-content" :style="{ transform: wheelZoom.transformStyle.value }">
      <!-- 地图内容 -->
      <svg width="1000" height="1000">
        <!-- SVG 内容 -->
      </svg>
    </div>

    <!-- 缩放控制器 -->
    <div class="zoom-controls">
      <button :disabled="!wheelZoom.canZoomIn.value" @click="handleZoomIn">+</button>
      <span>{{ wheelZoom.zoomPercentage.value }}%</span>
      <button :disabled="!wheelZoom.canZoomOut.value" @click="handleZoomOut">-</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWheelZoom } from './hooks/useWheelZoom'

const containerRef = ref<HTMLDivElement>()

const wheelZoom = useWheelZoom({
  minZoom: 0.5,
  maxZoom: 10,
  smoothZoom: true
})

const handleWheel = (event: WheelEvent) => {
  if (!containerRef.value) return
  wheelZoom.handleWheel(event, containerRef.value.getBoundingClientRect())
}

const handleZoomIn = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  wheelZoom.zoomIn(rect.width / 2, rect.height / 2)
}

const handleZoomOut = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  wheelZoom.zoomOut(rect.width / 2, rect.height / 2)
}
</script>
```

## 🎨 高级功能

### 1. 以鼠标位置为中心缩放

这是默认行为，滚轮缩放会自动以鼠标当前位置为中心：

```typescript
const handleWheel = (event: WheelEvent) => {
  const rect = containerRef.value.getBoundingClientRect()
  // 自动计算鼠标位置并以此为中心缩放
  wheelZoom.handleWheel(event, rect)
}
```

### 2. 编程式缩放到指定位置

```typescript
// 缩放到 2 倍，以坐标 (300, 200) 为中心
wheelZoom.zoomTo(2, 300, 200)

// 缩放到 1.5 倍，以画布中心为中心
const centerX = containerWidth / 2
const centerY = containerHeight / 2
wheelZoom.zoomTo(1.5, centerX, centerY)
```

### 3. 双击缩放

```vue
<template>
  <div @wheel="handleWheel" @dblclick="handleDoubleClick">
    <!-- 内容 -->
  </div>
</template>

<script setup lang="ts">
const handleDoubleClick = (event: MouseEvent) => {
  const rect = containerRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 双击放大到 2 倍
  if (wheelZoom.scale.value < 2) {
    wheelZoom.zoomTo(2, x, y)
  } else {
    wheelZoom.resetZoom()
  }
}
</script>
```

### 4. 缩放限制区域

```typescript
// 限制缩放后的内容不超出容器
const constrainZoom = () => {
  const maxTranslateX = (contentWidth * wheelZoom.scale.value - containerWidth) / 2
  const maxTranslateY = (contentHeight * wheelZoom.scale.value - containerHeight) / 2

  if (wheelZoom.translateX.value > maxTranslateX) {
    wheelZoom.translateX.value = maxTranslateX
  }
  if (wheelZoom.translateY.value > maxTranslateY) {
    wheelZoom.translateY.value = maxTranslateY
  }
}
```

### 5. 监听缩放变化

```typescript
import { watch } from 'vue'

watch(
  () => wheelZoom.scale.value,
  (newScale, oldScale) => {
    console.log(`缩放从 ${oldScale} 变为 ${newScale}`)

    // 触发自定义事件
    emit('zoom-change', {
      scale: newScale,
      translateX: wheelZoom.translateX.value,
      translateY: wheelZoom.translateY.value
    })
  }
)
```

## 🔧 与其他功能结合

### 与拖拽平移结合

```vue
<template>
  <div
    ref="containerRef"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
  >
    <div :style="{ transform: wheelZoom.transformStyle.value }">
      <!-- 内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWheelZoom } from './hooks/useWheelZoom'

const containerRef = ref<HTMLDivElement>()
const wheelZoom = useWheelZoom()

// 拖拽状态
const isDragging = ref(false)
const lastPos = ref({ x: 0, y: 0 })

const handleWheel = (event: WheelEvent) => {
  if (!containerRef.value) return
  wheelZoom.handleWheel(event, containerRef.value.getBoundingClientRect())
}

const handleMouseDown = (event: MouseEvent) => {
  isDragging.value = true
  lastPos.value = { x: event.clientX, y: event.clientY }
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  const dx = event.clientX - lastPos.value.x
  const dy = event.clientY - lastPos.value.y

  wheelZoom.translateX.value += dx
  wheelZoom.translateY.value += dy

  lastPos.value = { x: event.clientX, y: event.clientY }
}

const handleMouseUp = () => {
  isDragging.value = false
}
</script>
```

## ⚠️ 注意事项

1. **性能优化**：对于大型 Canvas 或复杂 DOM，建议：
   - 使用 `will-change: transform` CSS 属性
   - 在缩放时暂停其他动画
   - 使用 `requestAnimationFrame` 进行渲染

2. **触摸设备**：需要额外处理触摸事件（pinch-to-zoom）

3. **内存管理**：组件卸载时调用 `cleanup()` 方法

```typescript
import { onUnmounted } from 'vue'

onUnmounted(() => {
  wheelZoom.cleanup()
})
```

4. **浏览器兼容性**：需要支持 `requestAnimationFrame` 和 `DOMRect`

## 📝 完整示例

查看 `examples/WheelZoomExample.vue` 获取完整的可运行示例。

## 🎯 最佳实践

1. **初始化时适应容器**

```typescript
onMounted(() => {
  wheelZoom.fitToContainer(contentWidth, contentHeight, containerWidth, containerHeight)
})
```

2. **提供缩放控制按钮**

```vue
<button :disabled="!wheelZoom.canZoomIn.value" @click="wheelZoom.zoomIn()">+</button>
<button :disabled="!wheelZoom.canZoomOut.value" @click="wheelZoom.zoomOut()">-</button>
<button @click="wheelZoom.resetZoom()">重置</button>
```

3. **显示缩放百分比**

```vue
<span>{{ wheelZoom.zoomPercentage.value }}%</span>
```

4. **响应式容器大小**

```typescript
import { useResizeObserver } from '@vueuse/core'

useResizeObserver(containerRef, entries => {
  const { width, height } = entries[0].contentRect
  // 重新适应容器
  wheelZoom.fitToContainer(contentWidth, contentHeight, width, height)
})
```

## 🚀 性能优化建议

1. 使用 CSS `transform` 而不是修改 `left/top`
2. 启用硬件加速：`transform: translateZ(0)`
3. 对于 Canvas，在缩放时降低渲染质量
4. 使用防抖处理频繁的缩放事件

```typescript
import { debounce } from 'lodash-es'

const debouncedRender = debounce(() => {
  // 高质量渲染
  renderHighQuality()
}, 200)

watch(
  () => wheelZoom.scale.value,
  () => {
    // 立即低质量渲染
    renderLowQuality()
    // 延迟高质量渲染
    debouncedRender()
  }
)
```
