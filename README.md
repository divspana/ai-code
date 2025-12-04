# Vue 3 + TypeScript + Element Plus

这是一个基于 Vue 3、TypeScript 和 Element Plus 的项目模板。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集，提供类型支持
- **Vite** - 下一代前端构建工具
- **Element Plus** - 基于 Vue 3 的组件库

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
vue3-element-plus/
├── src/
│   ├── modules/                   # 📦 功能模块（按业务分类）
│   │   ├── todo/                 # Todo List 模块
│   │   ├── form-engine/          # 表单引擎模块
│   │   ├── form-builder/         # 表单设计器模块
│   │   ├── charts/               # 图表模块
│   │   ├── wafer-map/            # Wafer Map 模块
│   │   └── wafer-map-pro/        # Wafer Map 专业版模块
│   ├── components/                # 公共组件
│   ├── layout/                    # 布局组件
│   ├── router/                    # 路由配置
│   ├── composables/               # 组合式函数
│   ├── assets/                    # 静态资源
│   ├── App.vue                    # 根组件
│   ├── main.ts                    # 入口文件
│   └── style.css                  # 全局样式
├── public/                        # 公共资源
├── docs/                          # 📚 项目文档
├── package.json                   # 项目配置
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                 # Vite 配置
└── PROJECT_STRUCTURE.md          # 📁 项目结构详细说明
```

详细的项目结构说明请查看：[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 功能特性

### 基础功能

- ✅ Vue 3 Composition API
- ✅ TypeScript 支持
- ✅ Element Plus UI 组件库
- ✅ Vite 快速热更新
- ✅ 响应式布局
- ✅ **路由菜单导航**（侧边栏 + 顶部导航）
- ✅ **主题颜色切换**（8种预设主题 + localStorage 持久化）
- ✅ **全屏布局**（无留白设计）
- ✅ **模块化架构**（按功能分类组织）

### 业务模块

- ✅ **Todo List** - 待办事项管理
- ✅ **表单引擎** - Schema 驱动的动态表单
- ✅ **表单设计器** - 可视化拖拽配置
- ✅ **ECharts 图表** - 8 种图表类型 + 可视化配置器
- ✅ **Wafer Map** - 晶圆图可视化（基础版）
- ✅ **Wafer Map Pro** - 晶圆图可视化（专业版）
- ✅ **文件上传** - 拖拽上传 + 文件夹上传 + 文件管理
- ✅ **文件上传 (Uppy)** - 基于 Uppy.js 的专业文件上传

## 核心组件

### 📋 表单引擎 (Form Engine)

一个强大的 Schema 驱动表单引擎，支持：

- **动态渲染**：通过 JSON Schema 配置生成表单
- **字段类型**：input、textarea、number、select、radio、checkbox、date
- **字段联动**：支持显隐、禁用、必填等状态的联动控制
- **API 数据源**：Select/Radio/Checkbox 支持从 API 获取选项数据
- **表单验证**：内置验证规则 + 自定义验证器
- **响应式布局**：基于 Element Plus 栅格系统

#### 快速使用

```vue
<script setup lang="ts">
import { FormEngine } from '@/components/FormEngine'
import type { FormSchema } from '@/components/FormEngine/types'

const schema: FormSchema = {
  fields: [
    {
      name: 'username',
      type: 'input',
      label: '用户名',
      required: true
    },
    {
      name: 'country',
      type: 'select',
      label: '国家',
      dataSource: {
        data: [
          { label: '中国', value: 'china' },
          { label: '美国', value: 'usa' }
        ]
      }
    }
  ]
}

const handleSubmit = data => {
  console.log('提交数据:', data)
}
</script>

<template>
  <FormEngine :schema="schema" @submit="handleSubmit" />
</template>
```

详细文档：[表单引擎使用指南](./FORM_ENGINE_GUIDE.md)

### 📝 Todo List

一个功能完整的待办事项列表，支持：

- CRUD 操作（增删改查）
- localStorage 数据持久化
- 状态筛选（全部/进行中/已完成）
- 批量操作
- 优雅的动画效果

### 🎨 主题切换

支持 8 种预设主题颜色：

- **默认蓝** - 经典蓝色主题
- **清新绿** - 清新自然的绿色
- **优雅紫** - 优雅的紫色调
- **热情红** - 充满活力的红色
- **活力橙** - 温暖的橙色
- **科技青** - 现代感的青色
- **玫瑰粉** - 浪漫的粉色
- **金色** - 高贵的金色

点击顶部导航栏右侧的彩色按钮即可切换主题，主题偏好会自动保存。

详细文档：[主题切换使用指南](./THEME_GUIDE.md)

## 项目文档

### 架构文档

- 📁 [项目结构说明](./PROJECT_STRUCTURE.md)
- 📖 [功能特性列表](./FEATURES.md)
- 📖 [路由菜单使用指南](./ROUTER_GUIDE.md)
- 📖 [主题切换使用指南](./THEME_GUIDE.md)
- 📖 [全屏布局说明](./FULLSCREEN_LAYOUT.md)

### 模块文档

- 📋 [表单引擎使用指南](./FORM_ENGINE_GUIDE.md)
- 🎨 [表单设计器指南](./FORM_BUILDER_GUIDE.md)
- 📊 [ECharts 图表指南](./CHARTS_GUIDE.md)
- 🔬 [Wafer Map 指南](./WAFER_MAP_GUIDE.md)
- 🔬 [Wafer Map Pro 指南](./WAFER_MAP_PRO_GUIDE.md)
- ⚡ [Wafer Map 性能优化](./WAFER_MAP_PERFORMANCE.md)
- 📁 [文件上传使用指南](./FILE_UPLOAD_GUIDE.md)
- 📁 [Uppy.js 上传指南](./UPPY_UPLOAD_GUIDE.md)

## 了解更多

- [Vue 3 文档](https://cn.vuejs.org/)
- [Element Plus 文档](https://element-plus.org/zh-CN/)
- [Vite 文档](https://cn.vitejs.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/zh/)
