# WaferMap 多图层缩放实现说明

## 🎯 核心原理

WaferMap 组件使用了 **多 Canvas 图层架构**，每个图层独立渲染不同的内容：

```
┌─────────────────────────┐
│  Interaction Canvas     │  ← 交互层（选择框、信息框）
├─────────────────────────┤
│  Defects Canvas         │  ← 坏点层
├─────────────────────────┤
│  Background Canvas      │  ← 背景层（晶圆、Die、Reticle）
└─────────────────────────┘
```

## 🔧 缩放实现方案

### 1. 统一变换管理

使用 `useWaferZoom` hook 统一管理所有图层的缩放变换：

```typescript
const waferZoom = useWaferZoom({
  minZoom: 0.5,
  maxZoom: 5,
  zoomSpeed: 0.001,
  smoothZoom: true
})
```

### 2. 图层注册

在初始化时，将所有图层的 context 注册到缩放 hook：

```typescript
// 注册图层到缩放 hook
const bgLayer = getLayer('background')
const defLayer = getLayer('defects')
const intLayer = getLayer('interaction')

if (bgLayer) waferZoom.registerLayer('background', bgLayer.ctx)
if (defLayer) waferZoom.registerLayer('defects', defLayer.ctx)
if (intLayer) waferZoom.registerLayer('interaction', intLayer.ctx)
```

### 3. 同步变换应用

当缩放发生时，`useWaferZoom` 会自动将变换应用到所有注册的图层：

```typescript
const applyTransformToAllLayers = () => {
  layerContexts.value.forEach(ctx => {
    // 重置变换
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    // 应用新的变换：先平移，再缩放
    ctx.translate(translateX.value, translateY.value)
    ctx.scale(scale.value, scale.value)
  })
}
```

### 4. 重新绘制所有图层

**关键点**：Canvas 的 transform 只影响后续的绘制操作，已经绘制的内容不会自动缩放。因此，在应用变换后，必须重新绘制所有图层：

```typescript
waferZoom.handleWheel(event, rect, () => {
  nextTick(() => {
    // 1. 清空并重新绘制背景层
    const bgLayer = getLayer('background')
    if (bgLayer) {
      clearLayer('background')
      renderBackground(bgLayer, canvasSize.value)
    }

    // 2. 重新绘制缺陷层
    renderDefectsLayer(canvasSize.value)

    // 3. 重新绘制交互层
    renderInteractionLayer()
  })
})
```

## 🐛 常见问题

### 问题 1：缩放后坏点超出晶圆范围

**原因**：只重新绘制了 defects 层和 interaction 层，没有重新绘制 background 层。

**解决方案**：在缩放回调中重新绘制所有图层，包括背景层。

```typescript
// ❌ 错误做法
waferZoom.handleWheel(event, rect, () => {
  renderDefectsLayer(canvasSize.value)
  renderInteractionLayer()
  // 缺少背景层的重绘！
})

// ✅ 正确做法
waferZoom.handleWheel(event, rect, () => {
  // 重新绘制背景层
  const bgLayer = getLayer('background')
  if (bgLayer) {
    clearLayer('background')
    renderBackground(bgLayer, canvasSize.value)
  }
  renderDefectsLayer(canvasSize.value)
  renderInteractionLayer()
})
```

### 问题 2：图层不同步

**原因**：某些图层没有注册到缩放 hook。

**解决方案**：确保所有图层都注册到 `waferZoom`。

```typescript
// 检查是否所有图层都已注册
console.log('Registered layers:', waferZoom.layerContexts.value.size)
// 应该输出 3（background, defects, interaction）
```

### 问题 3：缩放性能问题

**原因**：每次缩放都重新绘制所有内容，大数据量时会卡顿。

**优化方案**：

1. 使用防抖延迟高质量渲染
2. 缩放时使用低质量渲染（减少坏点数量）
3. 启用视口裁剪，只绘制可见区域

```typescript
import { debounce } from 'lodash-es'

const debouncedHighQualityRender = debounce(() => {
  // 高质量渲染
  renderDefectsLayer(canvasSize.value)
}, 200)

waferZoom.handleWheel(event, rect, () => {
  // 立即低质量渲染
  renderDefectsLayerLowQuality()
  // 延迟高质量渲染
  debouncedHighQualityRender()
})
```

## 📊 渲染流程

```
用户滚动鼠标
    ↓
handleWheel 捕获事件
    ↓
waferZoom.handleWheel 处理
    ↓
计算新的 scale、translateX、translateY
    ↓
applyTransformToAllLayers
    ↓
所有图层的 ctx.setTransform() 更新
    ↓
缩放回调触发
    ↓
重新绘制所有图层：
  1. clearLayer('background')
  2. renderBackground()
  3. renderDefectsLayer()
  4. renderInteractionLayer()
    ↓
用户看到缩放后的画面
```

## 🎨 使用示例

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
const waferMapRef = ref()

// 编程式缩放
const zoomIn = () => waferMapRef.value.zoomIn()
const zoomOut = () => waferMapRef.value.zoomOut()
const resetZoom = () => waferMapRef.value.resetZoom()

// 获取缩放状态
const getZoomState = () => waferMapRef.value.getZoomState()
</script>
```

### 高级用法：自定义缩放配置

修改 `useWaferZoom` 的配置：

```typescript
const waferZoom = useWaferZoom({
  minZoom: 0.1, // 最小缩放到 10%
  maxZoom: 20, // 最大放大到 2000%
  zoomSpeed: 0.002, // 更快的缩放速度
  smoothZoom: true, // 平滑动画
  zoomStep: 0.5 // 每次缩放 50%
})
```

## 🔍 调试技巧

### 1. 查看缩放状态

```typescript
watch(
  () => waferZoom.scale.value,
  newScale => {
    console.log('Current zoom:', {
      scale: newScale,
      percentage: waferZoom.zoomPercentage.value,
      translateX: waferZoom.translateX.value,
      translateY: waferZoom.translateY.value
    })
  }
)
```

### 2. 检查图层变换

```typescript
const checkLayerTransform = (layerType: LayerType) => {
  const layer = getLayer(layerType)
  if (layer) {
    const transform = layer.ctx.getTransform()
    console.log(`${layerType} transform:`, {
      a: transform.a, // scaleX
      d: transform.d, // scaleY
      e: transform.e, // translateX
      f: transform.f // translateY
    })
  }
}
```

### 3. 性能监控

```typescript
const measureRenderTime = async () => {
  const start = performance.now()

  await renderDefectsLayer(canvasSize.value)

  const end = performance.now()
  console.log(`Render time: ${end - start}ms`)
}
```

## ⚠️ 注意事项

1. **必须重新绘制所有图层**：Canvas transform 不会自动更新已绘制的内容
2. **图层顺序很重要**：先绘制背景层，再绘制坏点层，最后绘制交互层
3. **清空后再绘制**：使用 `clearLayer()` 清空图层后再绘制新内容
4. **性能优化**：大数据量时考虑使用防抖和低质量渲染
5. **坐标转换**：缩放后需要使用 `screenToCanvas()` 和 `canvasToScreen()` 进行坐标转换

## 📝 总结

WaferMap 的多图层缩放实现遵循以下原则：

1. ✅ **统一管理**：使用单一的 `useWaferZoom` hook 管理所有图层
2. ✅ **同步变换**：所有图层的 transform 同步更新
3. ✅ **完整重绘**：缩放后重新绘制所有图层内容
4. ✅ **性能优化**：使用防抖、视口裁剪等技术优化性能
5. ✅ **用户体验**：平滑动画、以鼠标为中心缩放

这种架构确保了多图层在缩放时的完美同步，避免了图层错位的问题。
