# 数据对比工具 - 单元格选择功能

## 功能说明

### ✨ 单元格选择联动

#### 1. 选择单元格
- **单击** 任意单元格即可选中
- 选中的单元格会在左右表同时高亮
- 自动滚动到视图中心位置

#### 2. 视觉效果

**选中状态**
- 🔵 **蓝色边框** (2px solid #1890ff)
- 🎨 **浅蓝色背景** (#e6f7ff)
- 💫 **蓝色阴影** (0 0 8px rgba(24, 144, 255, 0.4))
- 📝 **蓝色文字** (#1890ff)
- 💪 **加粗字体** (font-weight: 600)

**优先级**
- 选中状态 > 差异状态
- 选中的差异单元格显示蓝色而不是红色

#### 3. 联动效果

**左表选中 → 右表联动**
```
点击左表单元格 (row: 5, col: 'name')
  ↓
右表相同位置高亮 (row: 5, col: 'name')
  ↓
所有表格滚动到第 5 行中心
```

**右表选中 → 左表联动**
```
点击右表单元格 (row: 10, col: 'age')
  ↓
左表相同位置高亮 (row: 10, col: 'age')
  ↓
所有表格滚动到第 10 行中心
```

### 🎯 自动滚动到中心

#### 纵向滚动计算
```typescript
// 目标位置 = 行索引 × 行高 - 容器高度/2 + 行高/2
targetScrollTop = rowIndex * 40 - 600/2 + 40/2
                = rowIndex * 40 - 280

// 确保在有效范围内
finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))
```

#### 横向滚动计算
```typescript
// 目标位置 = 列索引 × 列宽 - 容器宽度/2 + 列宽/2
const colIndex = columns.indexOf(colName)
targetScrollLeft = colIndex * 150 - containerWidth/2 + 150/2

// 确保在有效范围内
finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft))
```

#### 平滑滚动
- 使用 `scrollTo({ top, left, behavior: 'smooth' })`
- 滚动动画时长约 300ms
- **纵向滚动**: 四个容器同步（差异列、左表、操作列、右表）
- **横向滚动**: 左右表 + 表头同步滚动
- 单元格在视图中心显示（纵向和横向都居中）

### 🖱️ 交互方式

#### 单击选择
```vue
<div @click="selectCell(rowIndex, columnName)">
  {{ cellValue }}
</div>
```

#### 双击编辑
```vue
<div 
  @click="selectCell(rowIndex, columnName)"
  @dblclick="startEdit(rowIndex, columnName, side, value)"
>
  {{ cellValue }}
</div>
```

**操作流程**
1. 单击 → 选中单元格 + 联动高亮 + 滚动到中心
2. 双击 → 进入编辑模式（先执行选中）

### 💡 使用场景

#### 场景 1: 快速定位差异
```
1. 在工具栏看到 "差异行数: 50"
2. 点击任意差异单元格
3. 左右表同时高亮，方便对比
4. 自动滚动到中心，无需手动查找
```

#### 场景 2: 对比同一字段
```
1. 点击左表的 "salary" 字段
2. 右表相同位置自动高亮
3. 可以清楚看到两边的薪资差异
4. 双击可以直接编辑
```

#### 场景 3: 大数据定位
```
1. 100,000 行数据中查找第 50,000 行
2. 点击该行任意单元格
3. 自动滚动到视图中心
4. 左右表同步显示，方便对比
```

### 🎨 样式层次

#### 优先级顺序
```
1. 选中状态 (蓝色) - 最高优先级
2. 差异状态 (红色) - 中等优先级
3. 正常状态 (默认) - 基础状态
```

#### 组合效果
```scss
// 正常单元格
.table-cell {
  background: #fff;
  border: 1px solid #ebeef5;
}

// 差异单元格
.table-cell.diff-cell-highlight {
  background: #ffe5e5;
  border: 2px solid #f56c6c;
}

// 选中的正常单元格
.table-cell.cell-selected {
  background: #e6f7ff;
  border: 2px solid #1890ff;
}

// 选中的差异单元格（蓝色覆盖红色）
.table-cell.cell-selected.diff-cell-highlight {
  background: #e6f7ff !important;
  border-color: #1890ff !important;
}
```

### 🔧 技术实现

#### 状态管理
```typescript
// 选中的单元格
const selectedCell = ref<{ row: number; col: string } | null>(null)

// 选择单元格
const selectCell = (row: number, col: string) => {
  selectedCell.value = { row, col }
  scrollToCenterRow(row)
}

// 检查是否选中
const isCellSelected = (row: number, col: string) => {
  return selectedCell.value?.row === row && 
         selectedCell.value?.col === col
}
```

#### 滚动同步
```typescript
// 纵向 + 横向同步滚动
const scrollContainers = [
  leftScrollRef.value,
  rightScrollRef.value,
  diffScrollRef.value,
  actionScrollRef.value
]

// 表格容器：纵向 + 横向
scrollContainers.forEach(container => {
  container.scrollTo({
    top: finalScrollTop,
    left: finalScrollLeft,
    behavior: 'smooth'
  })
})

// 表头容器：仅横向
const headerScrollContainers = [
  leftHeaderScrollRef.value,
  rightHeaderScrollRef.value
]

headerScrollContainers.forEach(container => {
  container.scrollTo({
    left: finalScrollLeft,
    behavior: 'smooth'
  })
})
```

### 📊 性能考虑

#### 虚拟滚动兼容
- 选中状态基于行索引和列名
- 不依赖 DOM 元素
- 虚拟滚动更新时自动保持选中状态

#### 滚动性能
- 使用原生 `scrollTo` API
- 平滑滚动由浏览器优化
- 延迟更新虚拟滚动状态，避免冲突

#### 渲染优化
- 选中状态通过 CSS 类控制
- 不需要重新渲染整个表格
- 只更新相关单元格的样式

### 🎯 用户体验

#### 视觉反馈
- ✅ 即时高亮选中单元格
- ✅ 左右表同步高亮
- ✅ 平滑滚动动画
- ✅ 清晰的蓝色边框和阴影

#### 操作便捷
- ✅ 单击即可选中
- ✅ 双击进入编辑
- ✅ 自动滚动到中心
- ✅ 无需手动查找对应位置

#### 状态清晰
- ✅ 选中状态明显
- ✅ 与差异状态区分清楚
- ✅ 颜色对比度高
- ✅ 支持色盲友好

### 🔮 未来增强

- [ ] 键盘导航（方向键切换单元格）
- [ ] 多选功能（Ctrl/Cmd + 点击）
- [ ] 框选功能（拖拽选择区域）
- [ ] 选中行高亮（整行背景色）
- [ ] 选中列高亮（整列背景色）
- [ ] 快捷键支持（Ctrl+C 复制等）
- [ ] 右键菜单（复制、粘贴、应用等）
- [ ] 选中历史记录（前进/后退）

### 💻 示例代码

#### 基本使用
```vue
<template>
  <DataComparisonTable
    :left-data="leftData"
    :right-data="rightData"
    :columns="columns"
  />
</template>
```

#### 编程式选择
```typescript
// 选择指定单元格
selectCell(10, 'name')

// 滚动到指定行
scrollToCenterRow(50)

// 检查选中状态
if (isCellSelected(10, 'name')) {
  console.log('单元格已选中')
}
```

### 📝 注意事项

1. **虚拟滚动**
   - 选中状态在滚动时保持
   - 虚拟行更新不影响选中状态

2. **编辑模式**
   - 进入编辑时自动选中
   - 退出编辑时保持选中状态

3. **数据更新**
   - 数据重新加载时清除选中状态
   - 差异重新计算时保持选中状态

4. **性能**
   - 大数据量时滚动流畅
   - 选中状态切换无延迟
   - 平滑滚动不影响性能

### 🎉 总结

单元格选择联动功能让数据对比更加直观和高效：
- ✅ 左右表联动高亮
- ✅ 自动滚动到中心
- ✅ 平滑的视觉效果
- ✅ 便捷的交互方式
- ✅ 清晰的状态反馈
