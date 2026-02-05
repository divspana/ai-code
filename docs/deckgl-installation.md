# deck.gl 安装和配置指南

## 📦 安装依赖

### 1. 安装 deck.gl 核心库

```bash
npm install @deck.gl/core @deck.gl/layers
```

或使用 yarn：

```bash
yarn add @deck.gl/core @deck.gl/layers
```

### 2. 版本要求

```json
{
  "dependencies": {
    "@deck.gl/core": "^9.0.0",
    "@deck.gl/layers": "^9.0.0"
  }
}
```

## 🔧 配置

### Vite 配置（推荐）

如果使用 Vite，通常不需要额外配置。deck.gl 已经支持 ES modules。

### TypeScript 配置

确保 `tsconfig.json` 包含：

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## 🚀 快速验证

创建一个测试文件验证安装：

```typescript
// test-deckgl.ts
import { Deck } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'

console.log('✅ deck.gl 安装成功')
console.log('Deck version:', Deck)
console.log('ScatterplotLayer:', ScatterplotLayer)
```

## 📚 可选依赖

### 如果需要更多图层类型

```bash
# 地理图层
npm install @deck.gl/geo-layers

# 聚合图层
npm install @deck.gl/aggregation-layers

# 网格图层
npm install @deck.gl/mesh-layers
```

### 如果需要地图底图

```bash
# Mapbox GL
npm install mapbox-gl

# 或使用 Google Maps
npm install @deck.gl/google-maps
```

## 🎯 使用示例

### 基础使用

```vue
<template>
  <div ref="container" style="width: 100%; height: 600px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Deck } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'

const container = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!container.value) return

  const deck = new Deck({
    container: container.value,
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 10
    },
    controller: true,
    layers: [
      new ScatterplotLayer({
        id: 'scatter',
        data: [
          { position: [0, 0], size: 100 }
        ],
        getPosition: d => d.position,
        getRadius: d => d.size,
        getFillColor: [255, 140, 0]
      })
    ]
  })
})
</script>
```

## ⚠️ 常见问题

### 问题 1: Module not found

**错误：** `Cannot find module '@deck.gl/core'`

**解决：**
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: TypeScript 类型错误

**错误：** `Could not find a declaration file for module '@deck.gl/core'`

**解决：**
```bash
# deck.gl 已包含类型定义，确保使用最新版本
npm install @deck.gl/core@latest @deck.gl/layers@latest
```

### 问题 3: WebGL 不支持

**错误：** `WebGL not supported`

**解决：**
- 确保浏览器支持 WebGL
- 检查硬件加速是否启用
- 在 Chrome 中访问 `chrome://gpu` 检查 GPU 状态

## 📊 性能优化

### 1. 生产环境构建

```bash
# 确保使用生产模式构建
npm run build
```

### 2. Tree Shaking

deck.gl 支持 tree shaking，只导入需要的图层：

```typescript
// ✅ 好 - 只导入需要的
import { ScatterplotLayer } from '@deck.gl/layers'

// ❌ 差 - 导入所有
import * as deckLayers from '@deck.gl/layers'
```

### 3. 代码分割

```typescript
// 动态导入大型图层
const loadHeatmapLayer = async () => {
  const { HeatmapLayer } = await import('@deck.gl/aggregation-layers')
  return HeatmapLayer
}
```

## 🎓 学习资源

- [deck.gl 官方文档](https://deck.gl/)
- [deck.gl GitHub](https://github.com/visgl/deck.gl)
- [deck.gl 示例](https://deck.gl/examples)
- [API 参考](https://deck.gl/docs/api-reference)

## ✅ 验证清单

安装完成后，检查以下项目：

- [ ] `@deck.gl/core` 已安装
- [ ] `@deck.gl/layers` 已安装
- [ ] 可以正常导入 `Deck` 和 `ScatterplotLayer`
- [ ] TypeScript 类型正常工作
- [ ] 浏览器支持 WebGL
- [ ] 示例代码可以运行

## 🚀 下一步

安装完成后，可以：

1. 访问 `/deckgl-scatter-debug` 查看演示
2. 阅读 `DeckGLScatter` 组件文档
3. 尝试创建自己的可视化

祝你使用愉快！🎉
