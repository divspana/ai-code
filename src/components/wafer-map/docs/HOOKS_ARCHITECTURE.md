# WaferMap Hooks 架构设计

## 🎯 设计原则

每个功能都是一个独立的 Hook，Hook 之间可以相互依赖和组合使用。

### 核心原则

1. **单一职责** - 每个 Hook 只负责一个特定功能
2. **可组合** - Hook 可以相互依赖，通过参数传递数据和函数
3. **可复用** - Hook 可以在不同组件中复用
4. **类型安全** - 使用 TypeScript 确保类型安全

## 📦 Hooks 列表

### 1. 图层管理

#### `useCanvasLayers`

管理多个 Canvas 图层的初始化、清空和变换。

```typescript
const {
  backgroundCanvas,
  defectsCanvas,
  interactionCanvas,
  initializeLayers,
  getLayer,
  clearLayer,
  resetTransform
} = useCanvasLayers()
```

**职责**：

- 管理三个 Canvas 图层的引用
- 初始化图层
- 清空图层（保持变换）
- 重置变换

---

### 2. 缩放和平移

#### `useWaferZoom`

管理画布的缩放和拖拽平移。

```typescript
const waferZoom = useWaferZoom({
  minZoom: 0.5,
  maxZoom: 5,
  zoomSpeed: 0.001,
  smoothZoom: true
})
```

**职责**：

- 处理鼠标滚轮缩放
- 处理画布拖拽平移
- 管理缩放和平移状态
- 同步应用变换到所有图层
- 提供编程式缩放方法

**导出**：

- `scale` - 当前缩放比例
- `translateX/Y` - 平移量
- `isDragging` - 是否正在拖拽
- `handleWheel()` - 处理滚轮事件
- `startDrag()` - 开始拖拽
- `onDrag()` - 拖拽移动
- `endDrag()` - 结束拖拽
- `zoomIn/Out()` - 编程式缩放
- `resetZoom()` - 重置缩放

---

### 3. 交互模式管理

#### `useInteractionMode`

管理当前的交互模式（矩形框选、多边形框选、拖拽）。

```typescript
const interactionMode = useInteractionMode('select')
```

**职责**：

- 管理当前交互模式
- 提供模式判断方法
- 提供鼠标样式

**导出**：

- `mode` - 当前模式
- `setMode()` - 设置模式
- `isSelectMode()` - 是否矩形框选
- `isPolygonMode()` - 是否多边形框选
- `isPanMode()` - 是否拖拽模式
- `getCursorStyle()` - 获取鼠标样式

---

### 4. 多边形框选

#### `usePolygonSelection`

处理多边形框选的所有逻辑。

```typescript
const polygonSelection = usePolygonSelection()
```

**职责**：

- 管理多边形顶点
- 添加/删除顶点
- 完成多边形
- 判断 Die 是否在多边形内
- 绘制多边形

**导出**：

- `points` - 顶点数组
- `isComplete` - 是否完成
- `isActive` - 是否激活
- `pointCount` - 顶点数量
- `canComplete` - 是否可以完成
- `addPoint()` - 添加顶点
- `removeLastPoint()` - 删除最后一个顶点
- `clear()` - 清空
- `complete()` - 完成
- `getDiesInPolygon()` - 获取多边形内的 Die
- `render()` - 绘制

---

### 5. 矩形框选

#### `useInteraction`（已存在）

处理矩形框选和点击交互。

```typescript
const interaction = useInteraction()
```

**职责**：

- 处理鼠标按下/移动/抬起
- 绘制矩形选择框
- 获取选中的 Die

**导出**：

- `zoom` - 缩放级别
- `handleMouseDown()` - 鼠标按下
- `handleMouseMove()` - 鼠标移动
- `handleMouseUp()` - 鼠标抬起
- `handleClick()` - 点击
- `drawSelectionBox()` - 绘制选择框

---

### 6. 坏点选择

#### `useDefectSelection`

根据选中的 Die 获取和管理坏点。

```typescript
const defectSelection = useDefectSelection()
```

**职责**：

- 根据 Die 获取坏点
- 管理选中的坏点
- 管理信息框位置

**导出**：

- `selectedDefects` - 选中的坏点
- `showOnlySelected` - 是否只显示选中的
- `getDefectsInDies()` - 获取 Die 内的坏点
- `clearSelection()` - 清除选择
- `updateLabelPosition()` - 更新信息框位置

---

### 7. 信息框拖拽

#### `useInfoBoxDrag`

处理信息框的拖拽交互。

```typescript
const infoBoxDrag = useInfoBoxDrag()
```

**职责**：

- 检测鼠标是否在信息框上
- 处理信息框拖拽
- 管理悬停状态

**导出**：

- `draggingIndex` - 正在拖拽的索引
- `hoveredIndex` - 悬停的索引
- `startDrag()` - 开始拖拽
- `onDrag()` - 拖拽移动
- `endDrag()` - 结束拖拽
- `getLabelIndexAtPosition()` - 获取位置上的信息框

---

### 8. 渲染相关

#### `useWaferRenderer`（已存在）

渲染晶圆背景（晶圆圆圈、Die、Reticle）。

#### `useDefectLayer`（已存在）

渲染坏点层。

#### `usePerformance`（已存在）

性能监控和优化。

---

## 🔗 Hooks 依赖关系

```
WaferMap 组件
├── useCanvasLayers (图层管理)
├── useWaferZoom (缩放和平移)
│   └── 依赖: useCanvasLayers.getLayer()
├── useInteractionMode (交互模式)
├── usePolygonSelection (多边形框选)
│   └── 依赖: useInteractionMode.mode
├── useInteraction (矩形框选)
│   └── 依赖: useInteractionMode.mode
├── useDefectSelection (坏点选择)
│   └── 依赖: usePolygonSelection.getDiesInPolygon()
│   └── 依赖: useInteraction.handleMouseUp()
├── useInfoBoxDrag (信息框拖拽)
│   └── 依赖: useDefectSelection.selectedDefects
├── useWaferRenderer (背景渲染)
├── useDefectLayer (坏点渲染)
│   └── 依赖: useDefectSelection.showOnlySelected
└── usePerformance (性能监控)
```

## 📝 使用示例

### 在 WaferMap 组件中组合使用

```typescript
<script setup lang="ts">
import { useCanvasLayers } from './hooks/useCanvasLayers'
import { useWaferZoom } from './hooks/useWaferZoom'
import { useInteractionMode } from './hooks/useInteractionMode'
import { usePolygonSelection } from './hooks/usePolygonSelection'
import { useDefectSelection } from './hooks/useDefectSelection'
import { useInfoBoxDrag } from './hooks/useInfoBoxDrag'

// 1. 图层管理
const layers = useCanvasLayers()

// 2. 缩放和平移
const waferZoom = useWaferZoom({
  minZoom: 0.5,
  maxZoom: 5
})

// 3. 交互模式
const interactionMode = useInteractionMode(props.interactionMode)

// 4. 多边形框选
const polygonSelection = usePolygonSelection()

// 5. 坏点选择
const defectSelection = useDefectSelection()

// 6. 信息框拖拽
const infoBoxDrag = useInfoBoxDrag()

// 注册图层到缩放 hook
const initZoom = () => {
  const bgLayer = layers.getLayer('background')
  const defLayer = layers.getLayer('defects')
  const intLayer = layers.getLayer('interaction')

  if (bgLayer) waferZoom.registerLayer('background', bgLayer.ctx)
  if (defLayer) waferZoom.registerLayer('defects', defLayer.ctx)
  if (intLayer) waferZoom.registerLayer('interaction', intLayer.ctx)
}

// 鼠标按下事件
const onMouseDown = (event: MouseEvent) => {
  const rect = interactionCanvas.value!.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 1. 检查是否点击在信息框上
  const labelIndex = infoBoxDrag.getLabelIndexAtPosition(
    mouseX, mouseY,
    defectSelection.selectedDefects.value,
    LABEL_WIDTH, LABEL_HEIGHT
  )

  if (labelIndex !== -1) {
    const defect = defectSelection.selectedDefects.value[labelIndex]
    infoBoxDrag.startDrag(labelIndex, mouseX, mouseY, defect.labelX, defect.labelY)
    return
  }

  // 2. 根据交互模式处理
  if (interactionMode.isPanMode()) {
    waferZoom.startDrag(event.clientX, event.clientY)
  } else if (interactionMode.isPolygonMode()) {
    polygonSelection.addPoint(mouseX, mouseY)
  } else {
    // 矩形框选
    interaction.handleMouseDown(event, interactionCanvas.value!)
  }
}

// 完成多边形
const completePolygon = () => {
  if (!polygonSelection.complete()) return

  const dies = polygonSelection.getDiesInPolygon(
    validDiePositions.value,
    dieWidth,
    dieHeight
  )

  defectSelection.getDefectsInDies(
    dies,
    props.defects,
    validDiePositions.value,
    scale,
    canvasSize.value,
    LABEL_WIDTH,
    LABEL_HEIGHT
  )

  setTimeout(() => {
    polygonSelection.clear()
  }, 500)
}

// 监听模式变化
watch(() => props.interactionMode, (newMode) => {
  interactionMode.setMode(newMode)

  if (newMode !== 'polygon') {
    polygonSelection.clear()
  }
})
</script>
```

## 🎨 优势

### 1. **清晰的职责分离**

每个 Hook 只负责一个功能，代码更易理解和维护。

### 2. **灵活的组合**

可以根据需要选择性地使用 Hook，不需要的功能可以不引入。

### 3. **易于测试**

每个 Hook 都可以独立测试，不需要依赖整个组件。

### 4. **可复用**

Hook 可以在不同的组件中复用，例如在其他地方也需要多边形框选功能。

### 5. **类型安全**

TypeScript 确保 Hook 之间的数据传递是类型安全的。

### 6. **易于扩展**

添加新功能只需要创建新的 Hook，不影响现有代码。

## 📚 最佳实践

### 1. Hook 命名

- 以 `use` 开头
- 使用驼峰命名
- 名称清晰表达功能

### 2. 导出规范

```typescript
return {
  // 状态（响应式数据）
  state1,
  state2,

  // 计算属性
  computed1,
  computed2,

  // 方法
  method1,
  method2
}
```

### 3. 依赖传递

通过参数传递依赖，而不是在 Hook 内部导入其他 Hook。

```typescript
// ✅ 好的做法
const getDiesInPolygon = (diePositions: DiePosition[]) => {
  // 使用传入的 diePositions
}

// ❌ 不好的做法
import { useDiePositions } from './useDiePositions'
const getDiesInPolygon = () => {
  const { diePositions } = useDiePositions() // 在 Hook 内部调用
}
```

### 4. 副作用管理

在 Hook 内部管理自己的副作用（事件监听、定时器等）。

```typescript
export function usePolygonSelection() {
  onMounted(() => {
    // 添加事件监听
  })

  onUnmounted(() => {
    // 清理事件监听
  })
}
```

## 🔄 迁移指南

### 从旧代码迁移到新架构

1. **识别功能模块** - 找出组件中的不同功能
2. **创建独立 Hook** - 为每个功能创建一个 Hook
3. **提取状态和方法** - 将相关的状态和方法移到 Hook 中
4. **定义接口** - 明确 Hook 的输入和输出
5. **重构组件** - 在组件中使用新的 Hook
6. **测试功能** - 确保功能正常工作

## 📖 总结

通过将功能拆分成独立的 Hook，我们实现了：

- ✅ 更清晰的代码结构
- ✅ 更好的可维护性
- ✅ 更高的可复用性
- ✅ 更容易的测试
- ✅ 更灵活的组合方式

这种架构让 WaferMap 组件更加模块化和可扩展。
