# Wafer Map 新架构使用指南

## 📦 新的数据格式

### 坏点数据格式

```typescript
// 新格式：数组形式（推荐用于大数据量）
const defectData = {
  logicx: [1.5, 2.3, 3.1, ...],  // X 坐标数组
  logicy: [3.2, 2.1, 1.8, ...],  // Y 坐标数组
  defectType: ['type1', 'type2', 'type3', ...],  // 可选：坏点类型
  // 可以添加其他自定义字段
  severity: [1, 2, 1, ...],
  timestamp: [1234567890, 1234567891, ...]
}
```

## 🎯 模块化架构

### 1. 绘制晶圆图

```typescript
import { useWaferRenderer } from './hooks/useWaferRenderer'

// 在组件中
const { renderBackground } = useWaferRenderer(waferConfig)

// 调用绘制函数
const backgroundLayer = getLayer('background')
if (backgroundLayer) {
  renderBackground(backgroundLayer.ctx, canvasSize, validDiePositions.value, drawParams.value)
}
```

### 2. 处理坏点数据

```typescript
import { createDefectAdapter } from './utils/defectAdapter'
import type { DefectArrayData } from './types/defectData'

// 创建适配器
const adapter = createDefectAdapter({
  waferRows: waferConfig.rows,
  waferCols: waferConfig.cols,
  dieWidth: waferConfig.dieWidth,
  dieHeight: waferConfig.dieHeight
})

// 转换数据
const defectData: DefectArrayData = {
  logicx: [1.5, 2.3, 3.1],
  logicy: [3.2, 2.1, 1.8],
  defectType: ['type1', 'type2', 'type3']
}

// 将逻辑坐标转换为晶圆坐标
const convertedDefects = adapter.convertArrayData(defectData)
```

### 3. 选中区域获取坏点

```typescript
import { useInteraction } from './hooks/useInteraction'

const { handleMouseUp } = useInteraction()

// 在鼠标抬起时
const result = handleMouseUp(event, canvas, diePositions, dieWidth, dieHeight, defects)

if (result?.type === 'selection') {
  // result.dies 包含选中的 Die 信息
  const selectedDies = result.dies

  // 使用适配器过滤选中区域的坏点
  const selectedDefects = adapter.filterByDies(defectData, selectedDies)
}
```

### 4. 绘制信息框

```typescript
import { useDefectInfoBox } from './hooks/useDefectInfoBox'

// 创建信息框管理器
const infoBox = useDefectInfoBox({ canvasSize: 800 })

// 设置选中的坏点（需要包含 canvasX, canvasY）
const defectsWithPosition = adapter.calculateCanvasPositions(
  selectedDefects,
  validDiePositions.value,
  drawParams.value.scale
)

infoBox.setSelectedDefects(defectsWithPosition)

// 绘制信息框
const interactionLayer = getLayer('interaction')
if (interactionLayer) {
  infoBox.render(interactionLayer.ctx)
}
```

## 🔄 完整的工作流程

```typescript
// 1. 准备数据
const defectData: DefectArrayData = {
  logicx: [1.5, 2.3, 3.1, 4.2, 5.1],
  logicy: [3.2, 2.1, 1.8, 4.5, 3.3],
  defectType: ['type1', 'type2', 'type3', 'type1', 'type2']
}

// 2. 创建适配器
const adapter = createDefectAdapter({
  waferRows: waferConfig.rows,
  waferCols: waferConfig.cols,
  dieWidth: waferConfig.dieWidth,
  dieHeight: waferConfig.dieHeight
})

// 3. 绘制晶圆图
const { renderBackground } = useWaferRenderer(waferConfig)
renderBackground(ctx, canvasSize, diePositions, drawParams)

// 4. 用户框选后
const result = handleMouseUp(event, canvas, diePositions, dieWidth, dieHeight)

if (result?.type === 'selection') {
  // 5. 获取选中区域的坏点
  const selectedDefects = adapter.filterByDies(defectData, result.dies)

  // 6. 计算 Canvas 位置
  const defectsWithPosition = adapter.calculateCanvasPositions(selectedDefects, diePositions, scale)

  // 7. 绘制信息框
  const infoBox = useDefectInfoBox({ canvasSize })
  infoBox.setSelectedDefects(defectsWithPosition)
  infoBox.render(ctx)
}
```

## 🎨 信息框交互

```typescript
const infoBox = useDefectInfoBox({ canvasSize: 800, enableDrag: true })

// 鼠标按下
const onMouseDown = (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const index = infoBox.getInfoBoxIndexAtPosition(mouseX, mouseY)
  if (index !== -1) {
    infoBox.startDrag(index, mouseX, mouseY)
  }
}

// 鼠标移动
const onMouseMove = (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 更新拖拽
  if (infoBox.updateDrag(mouseX, mouseY)) {
    infoBox.render(ctx) // 重新绘制
  }

  // 更新 hover 状态
  const isHovering = infoBox.updateHover(mouseX, mouseY)
  canvas.style.cursor = isHovering ? 'move' : 'crosshair'
}

// 鼠标抬起
const onMouseUp = () => {
  infoBox.endDrag()
}
```

## 📊 性能优化

### 大数据量处理

```typescript
// 使用数据抽稀
const decimatedData = {
  logicx: defectData.logicx.filter((_, i) => i % 10 === 0),
  logicy: defectData.logicy.filter((_, i) => i % 10 === 0)
}

// 使用视口裁剪
const visibleDefects = adapter.filterByRegion(defectData, {
  minX: viewport.minX,
  maxX: viewport.maxX,
  minY: viewport.minY,
  maxY: viewport.maxY
})
```

## 🔧 自定义信息框内容

```typescript
// 可以扩展 useDefectInfoBox 的 render 方法
const customRender = (ctx: CanvasRenderingContext2D, defect: SelectedDefectInfo) => {
  const texts = [
    `X: ${defect.x.toFixed(2)}`,
    `Y: ${defect.y.toFixed(2)}`,
    `Type: ${defect.type}`,
    `Custom: ${defect.customField}` // 自定义字段
  ]
  // ... 绘制逻辑
}
```

## 📝 类型安全

所有的 API 都是类型安全的：

```typescript
import type { DefectArrayData, DefectPoint, SelectedDefectInfo } from './types/defectData'
import type { CoordinateConfig } from './utils/defectAdapter'
import type { DefectInfoBoxOptions } from './hooks/useDefectInfoBox'
```
