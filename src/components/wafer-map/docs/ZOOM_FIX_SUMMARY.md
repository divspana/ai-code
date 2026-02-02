# 缩放问题修复总结

## 🐛 问题描述

用户反馈：**缩放时坏点能正常缩放，但晶圆片没有同步缩放**

### 现象

- ✅ 坏点层（defects）随鼠标滚轮正常缩放
- ❌ 背景层（晶圆、Die、Reticle）保持原始大小
- ❌ 导致坏点超出晶圆范围

## 🔍 根本原因

### 原因 1：`useWaferRenderer.ts` 中重置了变换

在 `renderBackground` 函数中，第 31 行有以下代码：

```typescript
// ❌ 错误的实现
ctx.setTransform(1, 0, 0, 1, 0, 0) // 重置变换！
ctx.clearRect(0, 0, canvas.width, canvas.height)
```

这会**清除外部应用的缩放变换**，导致背景层始终以原始大小绘制。

### 原因 2：`clearRect` 受变换影响

Canvas 的 `clearRect()` 方法在有 transform 的 context 上调用时，清除的区域也会受到变换的影响：

```typescript
// 假设 scale = 2
ctx.scale(2, 2)
ctx.clearRect(0, 0, 800, 800) // 实际只清除了 (0,0) 到 (400,400) 的区域！
```

## ✅ 修复方案

### 修复 1：移除渲染函数中的变换重置

**文件：`hooks/useWaferRenderer.ts`**

```typescript
// ✅ 正确的实现
const renderBackground = (layer: LayerContext, canvasSize: number) => {
  const { canvas, ctx } = layer

  // 注意：不要重置变换，保持外部应用的缩放变换
  // clearRect 会在 clearLayer 中处理（使用 save/restore）

  // 计算缩放和中心
  const scale = (canvasSize * CANVAS_CONFIG.SCALE_FACTOR) / config.diameter
  // ... 其他绘制代码
}
```

### 修复 2：改进 `clearLayer` 方法

**文件：`hooks/useCanvasLayers.ts`**

使用 `save()`/`restore()` 来保持变换：

```typescript
const clearLayer = (type: LayerType) => {
  const layer = layers.value.get(type)
  if (layer) {
    const { canvas, ctx } = layer
    // 保存当前变换
    ctx.save()
    // 重置变换以确保清除整个画布
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    // 清除整个画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // 恢复之前的变换
    ctx.restore()
  }
}
```

### 修复 3：移除所有渲染函数中的手动 `clearRect`

**文件：`hooks/useDefectLayer.ts`**

```typescript
// ❌ 之前
ctx.clearRect(0, 0, canvas.width, canvas.height)

// ✅ 现在
// 注意：clearRect 由外部 clearLayer 处理（使用 save/restore）
// 这里不需要手动清空，保持变换状态
```

**文件：`WaferMap.vue` - `renderInteractionLayer`**

```typescript
// ❌ 之前
ctx.clearRect(0, 0, canvas.width, canvas.height)

// ✅ 现在
// 注意：clearRect 由外部 clearLayer 处理（使用 save/restore）
```

### 修复 4：确保初始渲染时应用变换

**文件：`WaferMap.vue` - `render` 函数**

```typescript
// 注册图层到缩放 hook
if (bgLayer) waferZoom.registerLayer('background', bgLayer.ctx)
if (defLayer) waferZoom.registerLayer('defects', defLayer.ctx)
if (intLayer) waferZoom.registerLayer('interaction', intLayer.ctx)

// ✅ 应用当前的缩放变换（如果有的话）
waferZoom.applyTransformToAllLayers()

// 然后再绘制
if (bgLayer) {
  renderBackground(bgLayer, canvasSize.value)
}
```

## 📊 修复后的工作流程

```
1. 用户滚动鼠标
   ↓
2. waferZoom.handleWheel() 处理事件
   ↓
3. 计算新的 scale、translateX、translateY
   ↓
4. applyTransformToAllLayers()
   → 所有图层的 ctx.setTransform() 更新
   ↓
5. 缩放回调触发
   ↓
6. 清空并重新绘制所有图层：

   clearLayer('background')  → save() → reset → clear → restore()
   renderBackground()        → 在变换下绘制晶圆

   clearLayer('defects')     → save() → reset → clear → restore()
   renderDefects()           → 在变换下绘制坏点

   clearLayer('interaction') → save() → reset → clear → restore()
   renderInteractionLayer()  → 在变换下绘制交互层
   ↓
7. ✅ 所有图层（晶圆、坏点、交互）完美同步缩放
```

## 🎯 关键要点

1. **不要在渲染函数中重置变换**
   - 渲染函数应该在当前变换下绘制
   - 变换由外部统一管理（`useWaferZoom`）

2. **使用 `clearLayer` 而不是直接 `clearRect`**
   - `clearLayer` 会正确处理变换
   - 使用 `save()`/`restore()` 保持变换状态

3. **清空和绘制的顺序**
   - 先应用变换
   - 再清空图层（保持变换）
   - 最后绘制内容（在变换下）

4. **所有图层必须同步**
   - 注册所有图层到 `waferZoom`
   - 变换会自动应用到所有注册的图层

## 📝 修改的文件

1. ✅ `hooks/useWaferRenderer.ts` - 移除变换重置
2. ✅ `hooks/useDefectLayer.ts` - 移除手动 clearRect
3. ✅ `hooks/useCanvasLayers.ts` - 改进 clearLayer 方法
4. ✅ `WaferMap.vue` - 移除 renderInteractionLayer 中的 clearRect
5. ✅ `WaferMap.vue` - 在初始渲染时应用变换

## 🧪 测试验证

### 测试步骤

1. 打开 WaferMapDemo 页面
2. 使用鼠标滚轮缩放
3. 观察晶圆和坏点是否同步缩放
4. 点击放大/缩小按钮
5. 点击重置按钮

### 预期结果

- ✅ 晶圆圆圈随缩放变大/变小
- ✅ Die 网格随缩放变大/变小
- ✅ 坏点随缩放变大/变小
- ✅ 所有图层完美对齐，坏点不会超出晶圆范围
- ✅ 缩放中心在鼠标位置
- ✅ 平滑动画效果

## 💡 经验教训

1. **Canvas transform 的作用域**
   - `setTransform()` 只影响后续的绘制
   - 已绘制的内容不会自动更新
   - 需要清空后重新绘制

2. **clearRect 的陷阱**
   - `clearRect()` 会受当前变换影响
   - 在有 scale 的 context 上，清除区域会被缩放
   - 必须在重置变换后清除，然后恢复变换

3. **多图层同步的关键**
   - 统一的变换管理
   - 一致的清空和绘制流程
   - 避免在渲染函数中重置变换

## 🚀 性能优化建议

如果缩放时出现性能问题，可以考虑：

1. **防抖优化**

   ```typescript
   const debouncedRender = debounce(() => {
     // 高质量渲染
   }, 200)

   // 缩放时立即低质量渲染，延迟高质量渲染
   ```

2. **LOD（细节层次）**
   - 缩小时减少绘制的 Die 和坏点数量
   - 放大时增加细节

3. **视口裁剪**
   - 只绘制可见区域的内容
   - 已经在 `renderConfig.enableViewportCulling` 中实现

## ✨ 总结

通过移除渲染函数中的变换重置，并改进 `clearLayer` 方法使用 `save()`/`restore()`，成功实现了多图层的完美同步缩放。所有图层（晶圆、坏点、交互）现在都能正确响应缩放操作。
