# 🎮 组件 Playground 系统

## 📖 概述

一个类似 Element Plus 官网的组件在线演示平台，支持实时代码编辑和预览。

## ✨ 功能特性

### 🎯 核心功能

- ✅ **实时代码编辑** - Monaco 风格的代码编辑器
- ✅ **实时预览** - 代码修改即时预览效果
- ✅ **语法高亮** - 支持 Vue、TypeScript、CSS 语法高亮
- ✅ **代码复制** - 一键复制示例代码到剪贴板
- ✅ **布局切换** - 支持横向/纵向布局切换
- ✅ **示例分类** - 按组件类型智能分类
- ✅ **搜索功能** - 快速搜索定位组件示例
- ✅ **多文件支持** - 支持多文件标签切换

### 🎨 用户体验

- 🌓 暗色主题编辑器
- 📱 响应式布局
- ⚡ 快速刷新预览
- 🎯 友好的错误提示

## 📁 项目结构

```
src/
├── components/
│   └── Playground/
│       ├── CodeEditor.vue          # 代码编辑器组件
│       ├── CodePreview.vue         # 代码预览组件
│       ├── PlaygroundContainer.vue # Playground 容器
│       └── index.ts                # 组件导出
├── config/
│   └── playground-examples.ts      # 示例配置文件
├── views/
│   └── PlaygroundView.vue          # Playground 主页面
└── router/
    └── index.ts                    # 路由配置

文档/
├── PLAYGROUND_README.md            # 项目说明（本文件）
├── PLAYGROUND_GUIDE.md             # 完整使用指南
└── PLAYGROUND_QUICK_START.md       # 快速开始指南
```

## 🚀 快速开始

### 1. 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 2. 访问 Playground

打开浏览器访问：

```
http://localhost:5173/playground
```

### 3. 开始使用

1. 在左侧菜单选择组件示例
2. 在代码编辑器中修改代码
3. 右侧实时查看预览效果
4. 点击"复制代码"按钮复制代码

## 📝 添加新示例

### 方式一：快速添加

编辑 `src/config/playground-examples.ts`：

```typescript
{
  id: 'my-component',
  title: '我的组件',
  description: '组件描述',
  category: 'basic',
  tags: ['tag1', 'tag2'],
  code: `<template>
  <div class="demo-container">
    <h3>示例标题</h3>
    <!-- 你的组件代码 -->
  </div>
</template>

<script setup lang="ts">
// 你的脚本代码
</script>

<style scoped>
/* 你的样式代码 */
</style>`
}
```

### 方式二：使用模板

参考 `PLAYGROUND_QUICK_START.md` 中的示例模板。

## 🎯 示例分类

当前支持的分类：

| 分类         | 说明     | 示例                          |
| ------------ | -------- | ----------------------------- |
| `basic`      | 基础组件 | Button, Input, Icon           |
| `form`       | 表单组件 | Form, Select, Radio           |
| `data`       | 数据展示 | Table, Tree, Pagination       |
| `upload`     | 上传组件 | Upload, FolderUpload          |
| `feedback`   | 反馈组件 | Message, Dialog, Notification |
| `navigation` | 导航组件 | Menu, Tabs, Breadcrumb        |
| `others`     | 其他组件 | 其他自定义组件                |

## 🔧 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Element Plus** - UI 组件库
- **Vite** - 构建工具
- **Vue Router** - 路由管理

## 📦 核心组件

### PlaygroundContainer

主容器组件，整合编辑器和预览。

```vue
<PlaygroundContainer title="组件标题" description="组件描述" :initial-code="code" />
```

### CodeEditor

代码编辑器，支持语法高亮和多文件。

**特性：**

- 语法高亮
- 代码复制
- 多文件切换
- 滚动同步

### CodePreview

实时预览组件效果。

**特性：**

- 实时渲染
- 错误捕获
- 刷新功能

## 🎨 自定义配置

### 添加新分类

在 `src/views/PlaygroundView.vue` 中：

```typescript
const categoryNames: Record<string, string> = {
  // 添加新分类
  custom: '自定义分类'
}
```

### 修改主题样式

编辑组件的 SCSS 样式文件，自定义颜色和布局。

## 💡 使用场景

1. **组件文档** - 作为组件库的在线文档
2. **快速原型** - 快速验证组件功能
3. **学习示例** - 提供学习参考代码
4. **调试工具** - 实时调试组件行为

## 📊 已包含示例

当前已包含以下示例：

1. ✅ 文件夹上传 - 基础用法
2. ✅ 按钮 - 基础用法
3. ✅ 表单 - 基础用法
4. ✅ 表格 - 基础用法

## 🔮 未来计划

- [ ] 集成 Monaco Editor
- [ ] TypeScript 类型检查
- [ ] 代码格式化（Prettier）
- [ ] 主题切换（暗色/亮色）
- [ ] 导出到 CodeSandbox
- [ ] 分享功能
- [ ] 历史记录
- [ ] 代码片段库
- [ ] AI 代码助手

## 📚 文档

- [完整使用指南](./PLAYGROUND_GUIDE.md) - 详细的功能说明和最佳实践
- [快速开始](./PLAYGROUND_QUICK_START.md) - 5分钟上手指南

## 🤝 贡献

欢迎贡献新的组件示例！

1. Fork 项目
2. 添加示例到 `playground-examples.ts`
3. 测试示例
4. 提交 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

灵感来源：

- [Element Plus](https://element-plus.org/)
- [Vue SFC Playground](https://play.vuejs.org/)
- [CodeSandbox](https://codesandbox.io/)

---

**Made with ❤️ for Vue.js developers**
