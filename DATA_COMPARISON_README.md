# 数据对比工具

## 功能特性

### 1. 大数据支持
- ✅ 支持 10 万+ 行数据对比
- ✅ 使用虚拟滚动技术，只渲染可见区域，性能优异
- ✅ 缓冲区机制，滚动流畅无卡顿

### 2. 同步滚动
- ✅ 左右两表联动滚动
- ✅ 差异列同步滚动
- ✅ 智能防抖，避免滚动冲突

### 3. 差异检测
- ✅ 第一列显示每行的差异字段数量
- ✅ 0 表示该行无差异
- ✅ 数字表示有多少个字段不同
- ✅ 差异单元格高亮显示（红色背景）
- ✅ 差异行整行标记

### 4. 数据编辑
- ✅ 双击单元格即可编辑
- ✅ 支持左表和右表独立编辑
- ✅ 编辑后自动重新计算差异
- ✅ 按 Enter 或失焦保存

### 5. 一键应用
- ✅ 单行应用：点击箭头按钮应用左表或右表数据
- ✅ 全部应用：工具栏一键应用所有左表或右表数据
- ✅ 应用后自动更新差异统计

### 6. 统计信息
- ✅ 显示总行数
- ✅ 显示差异行数
- ✅ 显示差异单元格总数

## 文件结构

```
src/
├── composables/
│   ├── useVirtualScroll.ts      # 虚拟滚动 Composable
│   └── useDataComparison.ts     # 数据对比 Composable
├── components/
│   └── DataComparisonTable.vue  # 数据对比表格组件
└── views/
    └── DataComparisonView.vue   # 数据对比页面
```

## 使用方法

### 1. 访问页面
启动项目后，访问 `/data-comparison` 路由

### 2. 生成测试数据
- 点击 "生成 1,000 行数据" - 生成 1000 行测试数据
- 点击 "生成 10,000 行数据" - 生成 10000 行测试数据
- 点击 "生成 100,000 行数据" - 生成 100000 行测试数据

### 3. 引入差异
点击 "引入随机差异" 按钮，会在约 10% 的行中随机修改 1-3 个字段

### 4. 查看差异
- 第一列显示每行的差异数量
- 红色背景的单元格表示该字段有差异
- 红色背景的行表示该行有差异

### 5. 编辑数据
双击任意单元格进行编辑，按 Enter 或点击其他地方保存

### 6. 应用数据
- 单行应用：点击行首的箭头按钮
- 全部应用：点击工具栏的 "全部应用左表" 或 "全部应用右表"

## 技术实现

### 虚拟滚动原理
```typescript
// 只渲染可见区域 + 缓冲区
const startIndex = Math.floor(scrollTop / itemHeight) - bufferSize
const endIndex = startIndex + visibleCount + bufferSize * 2
const visibleData = allData.slice(startIndex, endIndex)
```

### 同步滚动实现
```typescript
// 使用 requestAnimationFrame 防抖
const syncScroll = (source, targets) => {
  if (isScrolling) return
  isScrolling = true
  
  targets.forEach(target => {
    target.scrollTop = source.scrollTop
  })
  
  requestAnimationFrame(() => {
    isScrolling = false
  })
}
```

### 差异检测算法
```typescript
// 逐字段比较
const compareRows = (leftRow, rightRow) => {
  let diffCount = 0
  const diffFields = []
  
  for (const column of columns) {
    if (leftRow[column] !== rightRow[column]) {
      diffCount++
      diffFields.push(column)
    }
  }
  
  return { count: diffCount, fields: diffFields }
}
```

## 性能优化

1. **虚拟滚动**：只渲染可见区域，大幅减少 DOM 节点
2. **计算属性缓存**：使用 Vue 的 computed 缓存计算结果
3. **防抖处理**：滚动事件使用 requestAnimationFrame 防抖
4. **按需更新**：只在数据变化时重新计算差异
5. **CSS 优化**：使用 transform 代替 top/left，启用 GPU 加速

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 注意事项

1. 建议在现代浏览器中使用，以获得最佳性能
2. 超过 10 万行数据时，初始化可能需要几秒钟
3. 编辑数据后会自动重新计算差异，大数据量时可能有短暂延迟
4. 同步滚动在快速滚动时可能有轻微延迟，这是正常现象

## 扩展建议

1. 添加导出功能（导出差异数据为 Excel/CSV）
2. 添加筛选功能（只显示有差异的行）
3. 添加搜索功能（搜索特定内容）
4. 添加列排序功能
5. 添加自定义列宽
6. 添加数据导入功能（从文件导入数据）
