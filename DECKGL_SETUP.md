# deck.gl 组件使用说明

## ⚠️ 重要提示

deck.gl 散点图组件已创建完成，但需要先安装依赖才能使用。

## 📦 安装步骤

### 1. 安装 deck.gl 依赖

```bash
npm install @deck.gl/core @deck.gl/layers
```

或使用 yarn：

```bash
yarn add @deck.gl/core @deck.gl/layers
```

### 2. 验证安装

安装完成后，重启开发服务器：

```bash
npm run dev
```

### 3. 访问调试页面

安装成功后，访问：`http://localhost:5173/deckgl-scatter-debug`

## 🎯 组件位置

- **组件代码**：`src/components/deckgl-scatter/`
- **调试页面**：`src/views/DeckGLScatterDebug.vue`
- **文档**：`src/components/deckgl-scatter/README.md`

## 💡 如果不想安装 deck.gl

如果你暂时不需要 deck.gl 的极致性能，可以继续使用：

1. **ECharts 散点图** - 适合 10万以下数据
   - 路径：`/scatter-chart-debug`
   - 功能完整，性能良好

2. **数据优化工具** - 优化真实数据性能
   - 路径：`/data-optimization`
   - 可以让 ECharts 处理更多数据

## 📊 性能对比

| 方案 | 数据量上限 | 优势 | 劣势 |
|------|-----------|------|------|
| ECharts | ~50万 | 功能丰富、易用 | 大数据性能受限 |
| ECharts + 优化 | ~100万 | 兼顾功能和性能 | 需要数据预处理 |
| deck.gl | 500万+ | 极致性能 | 需要额外依赖 |

## 🚀 推荐方案

### 场景 1：数据量 < 10万
→ 使用 **ECharts 散点图**（已可用）

### 场景 2：数据量 10-100万
→ 使用 **ECharts + 数据优化**（已可用）

### 场景 3：数据量 > 100万
→ 安装并使用 **deck.gl 散点图**

## 📝 依赖信息

```json
{
  "dependencies": {
    "@deck.gl/core": "^9.0.0",
    "@deck.gl/layers": "^9.0.0"
  }
}
```

安装后项目大小增加约 **2-3 MB**（gzipped）。

## ✅ 下一步

1. 如果需要 deck.gl，运行：`npm install @deck.gl/core @deck.gl/layers`
2. 如果不需要，可以删除 `src/components/deckgl-scatter/` 目录
3. 或者保留代码，等需要时再安装依赖

---

**提示**：deck.gl 组件代码已完全实现，只是缺少运行时依赖。
