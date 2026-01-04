# 数据对比工具 - 差异字段导航功能

## 功能说明

### ✨ 差异字段导航

当一行有多个差异字段时，可以通过操作列的导航按钮快速定位到每个差异字段。

## 界面布局

### 操作列（宽度 200px）

```
┌─────────────────────┐
│   [<] 1/3 [>]      │  ← 差异导航
│   [←]    [→]       │  ← 应用数据
└─────────────────────┘
```

#### 上半部分：差异导航
- **[<] 按钮** - 上一个差异字段
- **1/3 显示** - 当前差异/总差异数
- **[>] 按钮** - 下一个差异字段

#### 下半部分：应用数据
- **[←] 按钮** - 应用右表数据到左表
- **[→] 按钮** - 应用左表数据到右表

## 使用方法

### 1. 查看差异数量
每个有差异的行在操作列会显示 `X/Y` 格式：
- `X` - 当前查看的是第几个差异字段
- `Y` - 该行总共有几个差异字段

例如：`2/5` 表示当前是第 2 个差异字段，总共有 5 个差异字段

### 2. 导航到下一个差异
点击 **[>]** 按钮：
- 自动选中下一个差异字段
- 该列横向滚动到视图中心
- 左右表同时高亮该单元格
- 计数器更新（如 `2/5` → `3/5`）

### 3. 导航到上一个差异
点击 **[<]** 按钮：
- 自动选中上一个差异字段
- 该列横向滚动到视图中心
- 左右表同时高亮该单元格
- 计数器更新（如 `3/5` → `2/5`）

### 4. 按钮状态
- **禁用状态**：
  - 在第一个差异时，[<] 按钮禁用
  - 在最后一个差异时，[>] 按钮禁用
- **启用状态**：
  - 按钮可点击，悬停时放大效果

## 使用场景

### 场景 1: 快速检查所有差异
```
1. 找到一个有差异的行（第一列显示差异数量）
2. 点击 [>] 按钮查看第一个差异字段
3. 继续点击 [>] 查看下一个差异
4. 直到所有差异都查看完毕
```

### 场景 2: 对比特定差异
```
1. 导航到某个差异字段
2. 查看左右表的值
3. 决定是否需要应用数据
4. 点击 [←] 或 [→] 应用数据
```

### 场景 3: 来回对比
```
1. 点击 [>] 查看下一个差异
2. 觉得需要对比上一个
3. 点击 [<] 返回上一个差异
4. 灵活切换查看
```

## 技术实现

### 状态管理
```typescript
// 选中的单元格
const selectedCell = ref<{ row: number; col: string } | null>(null)

// 获取当前差异索引
const getCurrentDiffIndex = (row: number, diffFields: string[]) => {
  if (!selectedCell.value || selectedCell.value.row !== row) {
    return 1 // 默认第一个
  }
  const index = diffFields.indexOf(selectedCell.value.col)
  return index >= 0 ? index + 1 : 1
}
```

### 导航逻辑
```typescript
// 导航到下一个差异
const navigateToNextDiff = (row: number, diffFields: string[]) => {
  const currentIndex = getCurrentDiffIndex(row, diffFields)
  if (currentIndex < diffFields.length) {
    const nextField = diffFields[currentIndex]
    selectCell(row, nextField, 'left')
  }
}

// 导航到上一个差异
const navigateToPrevDiff = (row: number, diffFields: string[]) => {
  const currentIndex = getCurrentDiffIndex(row, diffFields)
  if (currentIndex > 1) {
    const prevField = diffFields[currentIndex - 2]
    selectCell(row, prevField, 'left')
  }
}
```

### 按钮禁用状态
```typescript
// 检查是否有下一个差异
const hasNextDiff = (row: number, diffFields: string[]) => {
  const currentIndex = getCurrentDiffIndex(row, diffFields)
  return currentIndex < diffFields.length
}

// 检查是否有上一个差异
const hasPrevDiff = (row: number, diffFields: string[]) => {
  const currentIndex = getCurrentDiffIndex(row, diffFields)
  return currentIndex > 1
}
```

## 视觉效果

### 导航按钮
- **尺寸**: 24x24px 圆形按钮
- **图标**: 左右箭头
- **悬停**: 放大 1.1 倍
- **禁用**: 灰色，无交互

### 差异计数
- **字体**: 12px，加粗
- **颜色**: #606266
- **宽度**: 最小 30px，居中对齐

### 应用按钮
- **类型**: primary 蓝色按钮
- **尺寸**: 小号按钮
- **图标**: 双箭头（← 和 →）
- **悬停**: 放大 1.05 倍

## 布局优化

### 操作列宽度
- **原来**: 120px
- **现在**: 200px
- **原因**: 容纳导航按钮和计数显示

### 纵向排列
```scss
.action-cell-row {
  flex-direction: column;  // 纵向排列
  gap: 4px;                // 间距 4px
  
  .diff-nav-buttons {      // 上半部分
    // 导航按钮
  }
  
  .apply-buttons {         // 下半部分
    // 应用按钮
  }
}
```

## 交互流程

### 完整流程
```
1. 用户点击 [>] 按钮
   ↓
2. 计算下一个差异字段
   ↓
3. 调用 selectCell(row, nextField, 'left')
   ↓
4. 选中单元格（左右表同时高亮）
   ↓
5. 横向滚动到视图中心
   ↓
6. 更新差异计数显示（2/5 → 3/5）
   ↓
7. 更新按钮禁用状态
```

## 键盘快捷键（未来计划）

- [ ] `←` - 上一个差异字段
- [ ] `→` - 下一个差异字段
- [ ] `Ctrl + ←` - 应用右表数据到左表
- [ ] `Ctrl + →` - 应用左表数据到右表

## 性能考虑

### 计算优化
- 差异字段列表已经预计算好
- 导航只需要数组索引操作
- O(1) 时间复杂度

### 渲染优化
- 只渲染可见行的导航按钮
- 虚拟滚动自动处理
- 按钮状态实时计算

## 示例数据

### 单个差异字段
```
操作列显示: [<] 1/1 [>]
- [<] 禁用
- [>] 禁用
```

### 多个差异字段
```
第一个: [<] 1/5 [>]
- [<] 禁用
- [>] 启用

中间的: [<] 3/5 [>]
- [<] 启用
- [>] 启用

最后的: [<] 5/5 [>]
- [<] 启用
- [>] 禁用
```

## 用户反馈

### 视觉反馈
- ✅ 选中的单元格蓝色高亮
- ✅ 差异计数实时更新
- ✅ 按钮悬停放大效果
- ✅ 禁用按钮灰色显示

### 操作反馈
- ✅ 点击按钮立即响应
- ✅ 平滑滚动动画
- ✅ 左右表同步高亮
- ✅ 清晰的视觉定位

## 总结

差异字段导航功能让用户能够：
- 🎯 快速定位每个差异字段
- 👀 逐个查看所有差异
- 🔄 灵活切换查看顺序
- 📊 清楚知道当前位置
- ⚡ 提升对比效率

这个功能特别适合处理有多个差异字段的行，让数据对比工作更加高效！
