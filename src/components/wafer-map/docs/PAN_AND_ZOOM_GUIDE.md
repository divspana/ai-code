# WaferMap 缩放和拖拽平移使用指南

## 🎯 功能概述

WaferMap 组件现在支持完整的缩放和拖拽平移功能，让你可以自由查看晶圆的任何区域。

### 支持的操作

1. **鼠标滚轮缩放** - 以鼠标位置为中心缩放
2. **拖拽平移** - 在缩放后拖拽查看不同区域
3. **编程式控制** - 通过代码控制缩放和平移

## 🖱️ 鼠标操作

### 缩放操作

| 操作             | 说明                     |
| ---------------- | ------------------------ |
| **鼠标滚轮向上** | 放大（以鼠标位置为中心） |
| **鼠标滚轮向下** | 缩小（以鼠标位置为中心） |
| 缩放范围         | 50% - 500% (可配置)      |
| 动画效果         | 平滑缩放动画             |

### 拖拽平移操作

| 操作                 | 说明                                          |
| -------------------- | --------------------------------------------- |
| **Shift + 左键拖拽** | 拖拽画布平移                                  |
| **鼠标中键拖拽**     | 拖拽画布平移                                  |
| **鼠标右键拖拽**     | 拖拽画布平移                                  |
| 鼠标样式             | 按住 Shift 显示 `grab`，拖拽时显示 `grabbing` |

### 鼠标样式提示

- **默认状态**: `crosshair` - 可以框选
- **按住 Shift**: `grab` - 可以拖拽
- **拖拽中**: `grabbing` - 正在拖拽
- **悬停在信息框**: `move` - 可以移动信息框

## 🎮 使用示例

### 基础用法

```vue
<template>
  <WaferMap
    ref="waferMapRef"
    :wafer-config="waferConfig"
    :defects="defects"
    :render-config="{ enableZoom: true }"
    @zoom="handleZoom"
  />
</template>

<script setup>
import { ref } from 'vue'
import { WaferMap } from '@/components/wafer-map'

const waferMapRef = ref()

const handleZoom = scale => {
  console.log('当前缩放比例:', scale)
}
</script>
```

### 编程式控制

```vue
<template>
  <div>
    <div class="controls">
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
      <button @click="resetZoom">重置</button>
      <span>{{ zoomPercentage }}%</span>
    </div>

    <WaferMap ref="waferMapRef" ... />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const waferMapRef = ref()

// 放大
const zoomIn = () => {
  waferMapRef.value?.zoomIn()
}

// 缩小
const zoomOut = () => {
  waferMapRef.value?.zoomOut()
}

// 重置缩放
const resetZoom = () => {
  waferMapRef.value?.resetZoom()
}

// 获取缩放状态
const getZoomState = () => {
  const state = waferMapRef.value?.getZoomState()
  console.log('缩放状态:', state)
  // { scale: 1.5, translateX: 100, translateY: 50, percentage: 150 }
}
</script>
```

### 自定义缩放配置

在 `WaferMap.vue` 中修改 `useWaferZoom` 的配置：

```typescript
const waferZoom = useWaferZoom({
  minZoom: 0.1, // 最小缩放 10%
  maxZoom: 20, // 最大缩放 2000%
  zoomSpeed: 0.002, // 缩放速度（更快）
  smoothZoom: true, // 平滑动画
  zoomStep: 0.5 // 每次缩放步长 50%
})
```

## 🔧 配置选项

### WaferZoomConfig

```typescript
interface WaferZoomConfig {
  minZoom?: number // 最小缩放比例，默认 0.5
  maxZoom?: number // 最大缩放比例，默认 5
  zoomSpeed?: number // 滚轮缩放速度，默认 0.001
  smoothZoom?: boolean // 是否启用平滑动画，默认 true
  zoomStep?: number // 编程式缩放步长，默认 0.2
}
```

## 📊 API 参考

### 暴露的方法

| 方法             | 参数 | 说明             |
| ---------------- | ---- | ---------------- |
| `zoomIn()`       | -    | 放大一步         |
| `zoomOut()`      | -    | 缩小一步         |
| `resetZoom()`    | -    | 重置缩放和平移   |
| `getZoomState()` | -    | 获取当前缩放状态 |

### 返回的缩放状态

```typescript
interface ZoomState {
  scale: number // 当前缩放比例 (1 = 100%)
  translateX: number // X 轴平移量（像素）
  translateY: number // Y 轴平移量（像素）
  percentage: number // 缩放百分比 (100 = 100%)
}
```

### 事件

| 事件    | 参数              | 说明               |
| ------- | ----------------- | ------------------ |
| `@zoom` | `(scale: number)` | 缩放比例变化时触发 |

## 💡 使用技巧

### 1. 快速查看特定区域

```typescript
// 1. 先缩放到合适的比例
waferMapRef.value.zoomIn()
waferMapRef.value.zoomIn()

// 2. 使用 Shift + 拖拽移动到目标区域
// 或者使用鼠标滚轮在目标位置缩放
```

### 2. 精确定位

```typescript
// 滚轮缩放会以鼠标位置为中心
// 将鼠标移动到目标位置，然后滚动滚轮
// 目标区域会自动居中放大
```

### 3. 查看全局后再看细节

```typescript
// 1. 重置到初始状态
waferMapRef.value.resetZoom()

// 2. 找到感兴趣的区域

// 3. 在该区域滚轮放大查看细节
```

## 🎨 视觉反馈

### 鼠标光标变化

```
正常状态 → crosshair (十字)
  ↓ 按住 Shift
可拖拽状态 → grab (手掌)
  ↓ 按下鼠标
拖拽中 → grabbing (抓取)
  ↓ 松开鼠标
返回可拖拽状态 → grab
```

### 缩放动画

- 启用 `smoothZoom: true` 时，缩放会有平滑的过渡动画
- 动画使用 `requestAnimationFrame` 实现，性能优秀
- 缓动函数：`easing = 0.2`，提供自然的加速/减速效果

## 🚀 性能优化

### 拖拽时的优化

拖拽时会实时重新绘制所有图层，为了保持流畅：

1. **使用 `nextTick`** - 确保 DOM 更新后再绘制
2. **保持变换状态** - 使用 `save()`/`restore()` 避免重复设置
3. **批量更新** - 一次拖拽只触发一次重绘

### 大数据量优化

```typescript
// 启用视口裁剪
renderConfig: {
  enableViewportCulling: true,  // 只绘制可见区域
  enableDataDecimation: true    // 缩小时减少数据点
}
```

## ⚠️ 注意事项

### 1. 拖拽优先级

操作优先级从高到低：

1. 信息框拖拽（左键拖拽信息框）
2. 画布拖拽（Shift+左键 或 中键/右键）
3. 框选操作（左键拖拽空白区域）

### 2. 缩放限制

- 最小缩放：`minZoom` (默认 50%)
- 最大缩放：`maxZoom` (默认 500%)
- 超出范围时会自动限制

### 3. 平移限制

当前版本没有平移范围限制，可以无限平移。如需限制，可以在 `useWaferZoom` 的 `onDrag` 方法中添加边界检测。

### 4. 与其他功能的交互

- **框选功能**: 左键拖拽空白区域仍然可以框选
- **信息框拖拽**: 拖拽信息框不受影响
- **Tooltip**: 悬停显示 tooltip 不受影响

## 🔍 调试技巧

### 查看当前状态

```typescript
const state = waferMapRef.value.getZoomState()
console.log('缩放状态:', {
  scale: state.scale, // 1.5
  percentage: state.percentage, // 150
  translateX: state.translateX, // 100
  translateY: state.translateY // 50
})
```

### 监听缩放变化

```vue
<WaferMap @zoom="scale => console.log('缩放:', scale)" />
```

### 检查拖拽状态

```typescript
// 在 WaferMap 组件内部
watch(
  () => waferZoom.isDragging.value,
  isDragging => {
    console.log('拖拽状态:', isDragging)
  }
)
```

## 📝 完整示例

```vue
<template>
  <div class="wafer-viewer">
    <!-- 控制面板 -->
    <div class="toolbar">
      <button @click="handleZoomIn" :disabled="!canZoomIn">
        <ZoomInIcon />
      </button>
      <button @click="handleZoomOut" :disabled="!canZoomOut">
        <ZoomOutIcon />
      </button>
      <button @click="handleResetZoom">
        <ResetIcon />
      </button>
      <span class="zoom-info">{{ zoomPercentage }}%</span>
      <span class="hint">提示: Shift+拖拽 或 中键/右键拖拽 可平移画布</span>
    </div>

    <!-- WaferMap -->
    <WaferMap
      ref="waferMapRef"
      :wafer-config="waferConfig"
      :defects="defects"
      :render-config="renderConfig"
      @zoom="handleZoomChange"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { WaferMap } from '@/components/wafer-map'

const waferMapRef = ref()
const zoomState = ref(null)

// 缩放控制
const handleZoomIn = () => {
  waferMapRef.value?.zoomIn()
  updateZoomState()
}

const handleZoomOut = () => {
  waferMapRef.value?.zoomOut()
  updateZoomState()
}

const handleResetZoom = () => {
  waferMapRef.value?.resetZoom()
  updateZoomState()
}

// 更新状态
const updateZoomState = () => {
  zoomState.value = waferMapRef.value?.getZoomState()
}

const handleZoomChange = scale => {
  console.log('缩放变化:', scale)
  updateZoomState()
}

// 计算属性
const zoomPercentage = computed(() => {
  return zoomState.value?.percentage || 100
})

const canZoomIn = computed(() => {
  return zoomState.value?.scale < 5 // maxZoom
})

const canZoomOut = computed(() => {
  return zoomState.value?.scale > 0.5 // minZoom
})
</script>

<style scoped>
.wafer-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.zoom-info {
  font-weight: bold;
  min-width: 50px;
}

.hint {
  margin-left: auto;
  color: #666;
  font-size: 12px;
}
</style>
```

## 🎓 总结

WaferMap 的缩放和拖拽功能提供了：

- ✅ **直观的操作** - 鼠标滚轮缩放，Shift+拖拽平移
- ✅ **平滑的体验** - 缓动动画，流畅的交互
- ✅ **灵活的控制** - 编程式 API，完全可控
- ✅ **完美的同步** - 所有图层（晶圆、坏点、交互）同步缩放和平移
- ✅ **良好的性能** - 优化的渲染流程，支持大数据量

现在你可以自由地探索晶圆的每一个细节！🎉
