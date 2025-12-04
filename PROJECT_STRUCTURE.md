# 项目文件结构说明

## 📁 整体结构

```
vue3-element-plus/
├── src/
│   ├── modules/              # 功能模块（按业务分类）
│   │   ├── todo/            # Todo List 模块
│   │   ├── form-engine/     # 表单引擎模块
│   │   ├── form-builder/    # 表单设计器模块
│   │   ├── charts/          # 图表模块
│   │   ├── wafer-map/       # Wafer Map 模块
│   │   └── wafer-map-pro/   # Wafer Map 专业版模块
│   ├── components/          # 公共组件
│   │   ├── ThemeSwitcher.vue
│   │   └── HelloWorld.vue
│   ├── layout/              # 布局组件
│   │   └── MainLayout.vue
│   ├── router/              # 路由配置
│   │   └── index.ts
│   ├── composables/         # 组合式函数
│   │   └── useTheme.ts
│   ├── assets/              # 静态资源
│   │   └── form-focus.css
│   ├── App.vue              # 根组件
│   ├── main.ts              # 入口文件
│   └── style.css            # 全局样式
├── docs/                     # 文档（根目录）
│   ├── FEATURES.md
│   ├── FORM_ENGINE_GUIDE.md
│   ├── FORM_BUILDER_GUIDE.md
│   ├── CHARTS_GUIDE.md
│   ├── WAFER_MAP_GUIDE.md
│   ├── WAFER_MAP_PRO_GUIDE.md
│   ├── WAFER_MAP_PERFORMANCE.md
│   ├── ROUTER_GUIDE.md
│   ├── THEME_GUIDE.md
│   └── FULLSCREEN_LAYOUT.md
├── public/                   # 公共资源
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 📦 模块化设计

### 设计原则

1. **按功能分类**: 每个功能模块独立目录
2. **自包含**: 模块内包含所有相关组件和资源
3. **清晰命名**: 使用语义化的目录和文件名
4. **文档齐全**: 每个模块都有 README 说明

### 模块结构规范

```
module-name/
├── index.vue              # 模块主页面（必需）
├── components/            # 模块专用组件（可选）
│   ├── Component1.vue
│   └── Component2.vue
├── types.ts              # 类型定义（可选）
├── utils.ts              # 工具函数（可选）
└── README.md             # 模块说明（推荐）
```

## 🎯 各模块详解

### 1. Todo List 模块

```
modules/todo/
├── index.vue          # Todo List 主页面
└── README.md          # 模块说明
```

**功能**: 待办事项管理
**路由**: `/todo`

### 2. 表单引擎模块

```
modules/form-engine/
├── index.vue                    # 表单引擎演示页面
├── components/
│   ├── FormEngine.vue          # 表单引擎核心组件
│   ├── types.ts                # 类型定义
│   └── fields/                 # 字段组件集合
│       ├── InputField.vue      # 输入框
│       ├── TextareaField.vue   # 文本域
│       ├── SelectField.vue     # 下拉选择
│       ├── RadioField.vue      # 单选框
│       ├── CheckboxField.vue   # 复选框
│       ├── NumberField.vue     # 数字输入
│       ├── DateField.vue       # 日期选择
│       └── SwitchField.vue     # 开关
└── README.md
```

**功能**: Schema 驱动的动态表单系统
**路由**: `/form-engine`

### 3. 表单设计器模块

```
modules/form-builder/
├── index.vue          # 表单设计器页面
└── README.md
```

**功能**: 可视化拖拽配置表单
**路由**: `/form-builder`

### 4. 图表模块

```
modules/charts/
├── index.vue                  # 图表配置器页面
├── components/
│   └── ChartWrapper.vue      # ECharts 封装组件
└── README.md
```

**功能**: 8 种图表类型的可视化配置
**路由**: `/charts`

### 5. Wafer Map 模块

```
modules/wafer-map/
├── index.vue                  # Wafer Map 演示页面
├── components/
│   └── WaferMap.vue          # Wafer Map 组件
└── README.md
```

**功能**: 晶圆图可视化（基础版）
**路由**: `/wafer-map`

### 6. Wafer Map Pro 模块

```
modules/wafer-map-pro/
├── index.vue                  # 专业版演示页面
├── components/
│   ├── WaferMapPro.vue       # 专业版组件
│   └── WaferMap.vue          # 基础组件（复用）
└── README.md
```

**功能**: 晶圆图可视化（专业版）
**路由**: `/wafer-map-pro`

## 🔧 公共资源

### 公共组件 (src/components/)

- `ThemeSwitcher.vue`: 主题切换组件
- `HelloWorld.vue`: 示例组件

### 布局组件 (src/layout/)

- `MainLayout.vue`: 主布局（侧边栏 + 内容区）

### 组合式函数 (src/composables/)

- `useTheme.ts`: 主题管理

### 静态资源 (src/assets/)

- `form-focus.css`: 表单聚焦样式

## 📚 文档组织

### 根目录文档

所有功能文档统一放在项目根目录，便于查找：

- `README.md` - 项目总览
- `PROJECT_STRUCTURE.md` - 本文档
- `FEATURES.md` - 功能列表
- `FORM_ENGINE_GUIDE.md` - 表单引擎使用指南
- `FORM_BUILDER_GUIDE.md` - 表单设计器指南
- `CHARTS_GUIDE.md` - 图表组件指南
- `WAFER_MAP_GUIDE.md` - Wafer Map 指南
- `WAFER_MAP_PRO_GUIDE.md` - Wafer Map Pro 指南
- `WAFER_MAP_PERFORMANCE.md` - 性能优化说明
- `ROUTER_GUIDE.md` - 路由配置指南
- `THEME_GUIDE.md` - 主题切换指南
- `FULLSCREEN_LAYOUT.md` - 全屏布局说明

### 模块文档

每个模块目录下的 `README.md` 提供模块概览。

## 🚀 路由配置

路由配置在 `src/router/index.ts`，所有路由指向 `modules/` 下的模块：

```typescript
{
  path: '/todo',
  component: () => import('../modules/todo/index.vue')
}
```

## 💡 最佳实践

### 1. 添加新模块

```bash
# 1. 创建模块目录
mkdir -p src/modules/new-module/components

# 2. 创建主页面
touch src/modules/new-module/index.vue

# 3. 创建 README
touch src/modules/new-module/README.md

# 4. 添加路由配置
# 编辑 src/router/index.ts

# 5. 添加菜单项
# 编辑 src/layout/MainLayout.vue
```

### 2. 组件复用

- **模块专用组件**: 放在模块的 `components/` 目录
- **跨模块共享组件**: 放在 `src/components/` 目录

### 3. 类型定义

- **模块专用类型**: 放在模块的 `types.ts`
- **全局类型**: 考虑创建 `src/types/` 目录

### 4. 工具函数

- **模块专用工具**: 放在模块的 `utils.ts`
- **全局工具**: 考虑创建 `src/utils/` 目录

## 📋 迁移记录

### 从旧结构迁移到新结构

**旧结构**:

```
src/
├── view/                    # 所有页面混在一起
│   ├── TodoList.vue
│   ├── FormEngineDemo.vue
│   ├── FormBuilder.vue
│   ├── ChartsDemo.vue
│   ├── WaferMapDemo.vue
│   └── WaferMapPro.vue
└── components/              # 所有组件混在一起
    ├── FormEngine/
    ├── Charts/
    └── WaferMap/
```

**新结构**:

```
src/
└── modules/                 # 按功能模块组织
    ├── todo/
    ├── form-engine/
    ├── form-builder/
    ├── charts/
    ├── wafer-map/
    └── wafer-map-pro/
```

### 迁移优势

1. ✅ **更清晰的结构** - 按功能分类，一目了然
2. ✅ **更好的维护性** - 模块独立，互不干扰
3. ✅ **更容易扩展** - 添加新功能只需新建模块
4. ✅ **更好的协作** - 团队成员可以独立开发各自模块
5. ✅ **更容易测试** - 模块独立，测试更简单

## 🔍 快速查找

### 查找页面

所有页面入口都在 `src/modules/*/index.vue`

### 查找组件

- 模块专用组件: `src/modules/*/components/`
- 公共组件: `src/components/`

### 查找文档

- 功能文档: 项目根目录 `*.md`
- 模块说明: `src/modules/*/README.md`

## 📝 维护建议

1. **保持模块独立**: 避免模块间直接依赖
2. **及时更新文档**: 修改功能后同步更新 README
3. **统一命名规范**: 使用语义化的文件和目录名
4. **定期重构**: 发现不合理的结构及时调整

## 🎉 总结

新的模块化结构具有以下优势：

- 📁 **清晰的组织** - 按功能分类
- 🎯 **高内聚低耦合** - 模块独立
- 📚 **文档齐全** - 每个模块都有说明
- 🚀 **易于扩展** - 添加新功能简单
- 👥 **便于协作** - 团队开发更高效

这种结构适合中大型项目，能够有效提升开发效率和代码质量。
