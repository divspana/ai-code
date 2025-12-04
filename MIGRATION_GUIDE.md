# 项目结构迁移指南

## 迁移概述

本次重构将项目从 **页面+组件混合结构** 迁移到 **模块化架构**，提升了代码组织的清晰度和可维护性。

## 迁移对比

### 旧结构 ❌

```
src/
├── view/                          # 所有页面混在一起
│   ├── TodoList.vue
│   ├── FormEngineDemo.vue
│   ├── FormBuilder.vue
│   ├── ChartsDemo.vue
│   ├── WaferMapDemo.vue
│   └── WaferMapPro.vue
└── components/                    # 组件分散
    ├── FormEngine/
    │   ├── FormEngine.vue
    │   ├── fields/
    │   └── types.ts
    ├── Charts/
    │   └── ChartWrapper.vue
    └── WaferMap/
        ├── WaferMap.vue
        └── WaferMapPro.vue
```

**问题**:

- ❌ 页面和组件分离，查找困难
- ❌ 功能模块不清晰
- ❌ 难以维护和扩展
- ❌ 团队协作容易冲突

### 新结构 ✅

```
src/
└── modules/                       # 按功能模块组织
    ├── todo/
    │   ├── index.vue             # 页面
    │   └── README.md             # 说明
    ├── form-engine/
    │   ├── index.vue             # 页面
    │   ├── components/           # 模块专用组件
    │   │   ├── FormEngine.vue
    │   │   ├── fields/
    │   │   └── types.ts
    │   └── README.md
    ├── form-builder/
    │   ├── index.vue
    │   └── README.md
    ├── charts/
    │   ├── index.vue
    │   ├── components/
    │   │   └── ChartWrapper.vue
    │   └── README.md
    ├── wafer-map/
    │   ├── index.vue
    │   ├── components/
    │   │   └── WaferMap.vue
    │   └── README.md
    └── wafer-map-pro/
        ├── index.vue
        ├── components/
        │   └── WaferMapPro.vue
        └── README.md
```

**优势**:

- ✅ 功能模块清晰独立
- ✅ 页面和组件就近组织
- ✅ 易于查找和维护
- ✅ 团队协作更高效
- ✅ 每个模块都有文档

## 文件迁移映射

### 页面文件

| 旧路径                        | 新路径                                | 说明             |
| ----------------------------- | ------------------------------------- | ---------------- |
| `src/view/TodoList.vue`       | `src/modules/todo/index.vue`          | Todo List 页面   |
| `src/view/FormEngineDemo.vue` | `src/modules/form-engine/index.vue`   | 表单引擎演示     |
| `src/view/FormBuilder.vue`    | `src/modules/form-builder/index.vue`  | 表单设计器       |
| `src/view/ChartsDemo.vue`     | `src/modules/charts/index.vue`        | 图表配置器       |
| `src/view/WaferMapDemo.vue`   | `src/modules/wafer-map/index.vue`     | Wafer Map 基础版 |
| `src/view/WaferMapPro.vue`    | `src/modules/wafer-map-pro/index.vue` | Wafer Map 专业版 |

### 组件文件

| 旧路径                       | 新路径                                | 说明           |
| ---------------------------- | ------------------------------------- | -------------- |
| `src/components/FormEngine/` | `src/modules/form-engine/components/` | 表单引擎组件   |
| `src/components/Charts/`     | `src/modules/charts/components/`      | 图表组件       |
| `src/components/WaferMap/`   | `src/modules/wafer-map/components/`   | Wafer Map 组件 |

### 路由配置

**旧配置**:

```typescript
{
  path: '/todo',
  component: () => import('../view/TodoList.vue')
}
```

**新配置**:

```typescript
{
  path: '/todo',
  component: () => import('../modules/todo/index.vue')
}
```

### 导入路径变化

**旧导入**:

```typescript
// 在 FormEngineDemo.vue 中
import FormEngine from '../components/FormEngine/FormEngine.vue'
import type { FormSchema } from '../components/FormEngine/types'
```

**新导入**:

```typescript
// 在 form-engine/index.vue 中
import FormEngine from './components/FormEngine.vue'
import type { FormSchema } from './components/types'
```

## 迁移步骤

### 1. 创建模块目录结构

```bash
mkdir -p src/modules/{todo,form-engine,form-builder,charts,wafer-map,wafer-map-pro}
```

### 2. 移动页面文件

```bash
mv src/view/TodoList.vue src/modules/todo/index.vue
mv src/view/FormEngineDemo.vue src/modules/form-engine/index.vue
mv src/view/FormBuilder.vue src/modules/form-builder/index.vue
mv src/view/ChartsDemo.vue src/modules/charts/index.vue
mv src/view/WaferMapDemo.vue src/modules/wafer-map/index.vue
mv src/view/WaferMapPro.vue src/modules/wafer-map-pro/index.vue
```

### 3. 移动组件目录

```bash
mv src/components/FormEngine src/modules/form-engine/components
mv src/components/Charts src/modules/charts/components
mv src/components/WaferMap src/modules/wafer-map/components
```

### 4. 更新路由配置

编辑 `src/router/index.ts`，将所有 `../view/` 改为 `../modules/*/index.vue`

### 5. 更新导入路径

在各模块的 `index.vue` 中，将组件导入路径从 `../components/` 改为 `./components/`

### 6. 删除旧目录

```bash
rm -rf src/view
```

### 7. 创建模块文档

为每个模块创建 `README.md` 文件

## 代码修改示例

### 示例 1: 表单引擎模块

**修改前** (`src/view/FormEngineDemo.vue`):

```vue
<script setup lang="ts">
import FormEngine from '../components/FormEngine/FormEngine.vue'
import type { FormSchema, FormData } from '../components/FormEngine/types'
</script>
```

**修改后** (`src/modules/form-engine/index.vue`):

```vue
<script setup lang="ts">
import FormEngine from './components/FormEngine.vue'
import type { FormSchema, FormData } from './components/types'
</script>
```

### 示例 2: 图表模块

**修改前** (`src/view/ChartsDemo.vue`):

```vue
<script setup lang="ts">
import ChartWrapper from '../components/Charts/ChartWrapper.vue'
</script>
```

**修改后** (`src/modules/charts/index.vue`):

```vue
<script setup lang="ts">
import ChartWrapper from './components/ChartWrapper.vue'
</script>
```

### 示例 3: 路由配置

**修改前** (`src/router/index.ts`):

```typescript
const routes = [
  {
    path: '/todo',
    component: () => import('../view/TodoList.vue')
  },
  {
    path: '/form-engine',
    component: () => import('../view/FormEngineDemo.vue')
  }
]
```

**修改后** (`src/router/index.ts`):

```typescript
const routes = [
  {
    path: '/todo',
    component: () => import('../modules/todo/index.vue')
  },
  {
    path: '/form-engine',
    component: () => import('../modules/form-engine/index.vue')
  }
]
```

## 验证迁移

### 1. 检查文件结构

```bash
tree src/modules -L 2
```

应该看到:

```
src/modules
├── charts
│   ├── README.md
│   ├── components
│   └── index.vue
├── form-builder
│   ├── README.md
│   └── index.vue
├── form-engine
│   ├── README.md
│   ├── components
│   └── index.vue
├── todo
│   ├── README.md
│   └── index.vue
├── wafer-map
│   ├── README.md
│   ├── components
│   └── index.vue
└── wafer-map-pro
    ├── README.md
    ├── components
    └── index.vue
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 测试所有路由

访问以下路由确保正常工作:

- http://localhost:5173/todo
- http://localhost:5173/form-engine
- http://localhost:5173/form-builder
- http://localhost:5173/charts
- http://localhost:5173/wafer-map
- http://localhost:5173/wafer-map-pro

### 4. 检查控制台

确保没有导入错误或路由错误

## 迁移收益

### 1. 代码组织 ✅

- **更清晰**: 按功能模块组织，一目了然
- **更内聚**: 相关代码集中在一起
- **更独立**: 模块之间低耦合

### 2. 开发效率 ✅

- **快速定位**: 知道功能就知道在哪个模块
- **并行开发**: 团队成员可以独立开发各自模块
- **减少冲突**: 模块独立，Git 冲突更少

### 3. 维护性 ✅

- **易于理解**: 新人快速了解项目结构
- **易于修改**: 修改某个功能只需关注对应模块
- **易于测试**: 模块独立，单元测试更简单

### 4. 扩展性 ✅

- **添加功能**: 只需新建模块目录
- **删除功能**: 直接删除模块目录
- **复用模块**: 可以轻松移植到其他项目

## 最佳实践

### 1. 模块命名

- 使用 kebab-case: `wafer-map-pro`
- 语义化命名: 一看就知道是什么功能
- 避免缩写: 除非是通用缩写（如 `api`）

### 2. 文件组织

```
module-name/
├── index.vue              # 模块入口（必需）
├── components/            # 模块专用组件
├── types.ts              # 类型定义
├── utils.ts              # 工具函数
├── constants.ts          # 常量定义
└── README.md             # 模块说明（推荐）
```

### 3. 导入规范

```typescript
// ✅ 推荐：相对路径
import Component from './components/Component.vue'

// ❌ 避免：绝对路径（除非是公共组件）
import Component from '@/modules/other-module/components/Component.vue'
```

### 4. 组件复用

- **模块内复用**: 放在 `module/components/`
- **跨模块复用**: 放在 `src/components/`
- **第三方组件**: 统一在 `src/components/` 封装

### 5. 文档维护

- 每个模块都应有 `README.md`
- 说明模块功能、文件结构、使用方法
- 及时更新文档

## 常见问题

### Q: 为什么页面文件叫 `index.vue` 而不是模块名？

A:

- 统一命名，便于识别
- 路径更简洁: `modules/todo/` vs `modules/todo/TodoList.vue`
- 符合约定优于配置的原则

### Q: 公共组件放哪里？

A:

- 模块专用组件: `modules/*/components/`
- 跨模块共享: `src/components/`
- 布局组件: `src/layout/`

### Q: 如何处理模块间依赖？

A:

- 尽量避免模块间直接依赖
- 通过路由跳转或事件总线通信
- 共享逻辑提取到 `src/composables/` 或 `src/utils/`

### Q: 旧代码如何迁移？

A:

1. 先创建新模块结构
2. 移动文件
3. 更新导入路径
4. 测试功能
5. 删除旧文件

## 总结

本次迁移将项目从 **页面+组件** 结构升级为 **模块化架构**，带来了：

1. ✅ **更清晰的代码组织**
2. ✅ **更高的开发效率**
3. ✅ **更好的可维护性**
4. ✅ **更强的可扩展性**

这种结构特别适合中大型项目，随着功能增加，优势会更加明显。

---

**迁移完成时间**: 2025-12-04
**迁移影响**: 所有模块
**向后兼容**: 是（路由路径不变）
