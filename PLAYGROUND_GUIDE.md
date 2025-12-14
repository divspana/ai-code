# 组件 Playground 使用指南

## 📖 简介

Playground 是一个在线组件演示平台，类似于 Element Plus 官网的交互式示例系统。它允许开发者实时编辑代码并预览效果。

## 🎯 功能特性

### 核心功能

- ✅ **实时代码编辑** - 支持 Vue SFC 格式的代码编辑
- ✅ **实时预览** - 代码修改后即时预览效果
- ✅ **代码高亮** - 语法高亮显示，提升可读性
- ✅ **代码复制** - 一键复制示例代码
- ✅ **布局切换** - 支持横向/纵向布局切换
- ✅ **示例分类** - 按组件类型分类展示
- ✅ **搜索功能** - 快速查找组件示例

## 🚀 快速开始

### 访问 Playground

1. 启动开发服务器：

```bash
npm run dev
```

2. 访问 Playground 页面：

```
http://localhost:5173/playground
```

### 使用示例

1. **选择示例**
   - 在左侧侧边栏选择想要查看的组件示例
   - 支持搜索功能快速定位

2. **编辑代码**
   - 在左侧代码编辑器中修改代码
   - 支持多文件切换（如果示例包含多个文件）

3. **查看预览**
   - 右侧实时显示组件效果
   - 支持刷新预览

4. **复制代码**
   - 点击"复制代码"按钮
   - 代码将复制到剪贴板

## 📦 组件结构

### 核心组件

#### 1. PlaygroundContainer

主容器组件，整合编辑器和预览功能。

```vue
<PlaygroundContainer title="组件标题" description="组件描述" :initial-code="code" />
```

**Props:**

- `title` - 标题
- `description` - 描述
- `initialCode` - 初始代码
- `files` - 多文件支持（可选）

#### 2. CodeEditor

代码编辑器组件。

**功能:**

- 语法高亮
- 代码复制
- 多文件支持
- 滚动同步

#### 3. CodePreview

代码预览组件。

**功能:**

- 实时渲染
- 错误提示
- 刷新预览

## 🎨 添加新示例

### 1. 在配置文件中添加示例

编辑 `src/config/playground-examples.ts`:

```typescript
{
  id: 'your-component-id',
  title: '组件标题',
  description: '组件描述',
  category: 'basic', // basic, form, data, upload, feedback, navigation, others
  tags: ['tag1', 'tag2'],
  code: `<template>
  <div>
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

### 2. 示例代码规范

**Template 部分:**

```vue
<template>
  <div class="demo-container">
    <h3>示例标题</h3>
    <!-- 组件内容 -->
  </div>
</template>
```

**Script 部分:**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
// 导入需要的组件和工具
</script>
```

**Style 部分:**

```vue
<style scoped>
.demo-container {
  padding: 20px;
}
</style>
```

## 🔧 配置说明

### 示例分类

在 `playground-examples.ts` 中定义的分类：

```typescript
const categoryNames: Record<string, string> = {
  upload: '上传组件',
  basic: '基础组件',
  form: '表单组件',
  data: '数据展示',
  feedback: '反馈组件',
  navigation: '导航组件',
  others: '其他组件'
}
```

### 添加新分类

1. 在 `categoryNames` 中添加新分类
2. 在示例配置中使用新分类

## 💡 最佳实践

### 1. 代码示例编写

- **简洁明了** - 示例代码应该简单易懂
- **功能完整** - 展示组件的核心功能
- **注释清晰** - 关键代码添加注释
- **样式美观** - 提供基础样式让示例更美观

### 2. 示例组织

- **按功能分类** - 相同类型的组件放在一起
- **命名规范** - 使用清晰的 ID 和标题
- **标签完善** - 添加相关标签便于搜索

### 3. 错误处理

- **验证输入** - 对用户输入进行验证
- **友好提示** - 使用 ElMessage 提供操作反馈
- **异常捕获** - 捕获并处理可能的异常

## 🎯 使用场景

### 1. 组件文档

作为组件库的在线文档和演示平台。

### 2. 快速原型

快速验证组件功能和交互效果。

### 3. 学习示例

为开发者提供学习和参考的代码示例。

### 4. 调试工具

实时调试和测试组件行为。

## 🔍 高级功能

### 多文件支持

```typescript
const files = [
  {
    name: 'App.vue',
    content: '...',
    language: 'vue'
  },
  {
    name: 'utils.ts',
    content: '...',
    language: 'typescript'
  }
]
```

### 自定义主题

可以通过修改 SCSS 变量自定义编辑器和预览的主题样式。

## 📝 注意事项

1. **性能优化**
   - 避免在示例中使用过于复杂的逻辑
   - 大量数据应该使用虚拟滚动

2. **安全性**
   - 代码预览使用 `new Function` 执行，注意安全风险
   - 生产环境建议使用更安全的方案（如 iframe 沙箱）

3. **兼容性**
   - 确保示例代码在目标浏览器中正常运行
   - 使用的 API 应该是项目已安装的依赖

## 🚀 未来计划

- [ ] 集成 Monaco Editor 提供更强大的编辑功能
- [ ] 支持 TypeScript 类型检查
- [ ] 支持代码格式化
- [ ] 支持主题切换（暗色/亮色）
- [ ] 支持导出代码为 CodeSandbox/StackBlitz
- [ ] 支持分享功能（生成链接）
- [ ] 支持历史记录

## 📚 参考资源

- [Element Plus Playground](https://element-plus.org/zh-CN/component/button.html)
- [Vue SFC Playground](https://play.vuejs.org/)
- [CodeSandbox](https://codesandbox.io/)

## 🤝 贡献指南

欢迎提交新的组件示例！

1. Fork 项目
2. 在 `playground-examples.ts` 中添加示例
3. 测试示例是否正常工作
4. 提交 Pull Request

## 📄 许可证

MIT License
