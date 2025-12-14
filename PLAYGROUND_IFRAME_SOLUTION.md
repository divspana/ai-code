# Playground 预览问题解决方案 - Iframe 方案

## 🔧 问题分析

### 原始问题

- 代码预览无法正常显示
- 按钮点击没有反应
- 变量和函数无法正确导出

### 根本原因

1. **代码解析复杂** - 使用 `new Function()` 和 `eval()` 解析 Vue SFC 代码过于复杂且不可靠
2. **作用域问题** - 变量和函数的作用域管理困难
3. **组件隔离** - 预览组件与主应用共享同一个 Vue 实例，容易冲突

## ✅ 解决方案：Iframe 隔离

### 方案优势

1. **完全隔离** - iframe 提供完全独立的运行环境
2. **简单可靠** - 直接生成完整的 HTML，无需复杂的代码解析
3. **CDN 加载** - 使用 CDN 加载 Vue 和 Element Plus，确保版本一致
4. **错误隔离** - iframe 内的错误不会影响主应用

### 实现方式

#### 1. IframePreview 组件

```vue
<template>
  <iframe ref="iframeRef" class="preview-iframe" />
</template>

<script setup>
// 生成完整的 HTML 文档
const generatePreviewHTML = (code) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <!-- CDN 加载依赖 -->
      <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
      <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
      <script src="https://unpkg.com/element-plus"></script>
    </head>
    <body>
      <div id="app">${template}</div>
      <script>
        // 用户代码
        ${script}
      </script>
    </body>
    </html>
  `
}
</script>
```

#### 2. 代码注入

```javascript
const renderPreview = () => {
  const html = generatePreviewHTML(props.code)
  const doc = iframe.contentDocument
  doc.open()
  doc.write(html)
  doc.close()
}
```

## 🎯 使用方法

### 1. 刷新浏览器

保存文件后，刷新浏览器页面

### 2. 测试示例

访问 `/playground`，选择 "Hello World" 示例

### 3. 验证功能

- 查看预览区域是否显示内容
- 点击按钮测试交互
- 修改代码查看实时更新

## 📝 示例代码格式

### 标准格式

```vue
<template>
  <div class="demo-container">
    <h1>{{ message }}</h1>
    <el-button @click="handleClick">点击</el-button>
  </div>
</template>

<script setup lang="ts">
const message = ref('Hello')
const count = ref(0)

const handleClick = () => {
  count.value++
  ElMessage.success('成功！')
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
}
</style>
```

### 注意事项

1. **不需要 import** - Vue、Element Plus 已通过 CDN 全局加载
2. **直接使用 ref** - 无需导入，直接使用 `ref()`, `reactive()` 等
3. **直接使用 ElMessage** - 无需导入，直接使用 Element Plus 组件

## 🔍 调试方法

### 1. 查看 iframe 内容

```javascript
// 在浏览器控制台
const iframe = document.querySelector('.preview-iframe')
console.log(iframe.contentDocument.body.innerHTML)
```

### 2. 查看 iframe 错误

iframe 内的错误会在浏览器控制台显示

### 3. 检查生成的 HTML

在 `IframePreview.vue` 的 `generatePreviewHTML` 函数中添加：

```javascript
console.log('Generated HTML:', html)
```

## ⚠️ 已知限制

### 1. CDN 依赖

- 需要网络连接加载 CDN 资源
- 首次加载可能较慢

### 2. 版本固定

- 使用的是 unpkg 的最新版本
- 可能与项目版本不完全一致

### 3. 自定义组件

- 无法导入项目中的自定义组件
- 只能使用 Element Plus 标准组件

## 🚀 后续优化

### 短期优化

1. **本地资源** - 使用项目本地的 Vue 和 Element Plus
2. **错误提示** - 改进 iframe 内的错误提示
3. **加载状态** - 添加加载动画

### 长期优化

1. **Worker 方案** - 使用 Web Worker 执行代码
2. **沙箱环境** - 实现更安全的代码沙箱
3. **离线支持** - 支持离线运行

## 📊 对比方案

| 方案         | 优点               | 缺点         | 推荐度     |
| ------------ | ------------------ | ------------ | ---------- |
| **Iframe**   | 简单、可靠、隔离好 | 需要 CDN     | ⭐⭐⭐⭐⭐ |
| new Function | 无需 CDN           | 复杂、不可靠 | ⭐⭐       |
| eval         | 简单               | 不安全       | ⭐         |
| Web Worker   | 安全、隔离         | 实现复杂     | ⭐⭐⭐⭐   |

## ✅ 验证清单

使用此清单验证 iframe 方案是否正常工作：

- [ ] 访问 `/playground` 页面
- [ ] 选择 "Hello World" 示例
- [ ] 预览区域显示标题和按钮
- [ ] 点击按钮，计数增加
- [ ] 显示成功消息提示
- [ ] 修改代码，预览实时更新
- [ ] 点击刷新按钮，预览重新加载

如果所有项都通过，说明 iframe 方案工作正常！🎉

## 🎓 技术要点

### 1. iframe 通信

```javascript
// 主页面向 iframe 发送消息
iframe.contentWindow.postMessage(data, '*')

// iframe 接收消息
window.addEventListener('message', event => {
  console.log(event.data)
})
```

### 2. 动态内容注入

```javascript
const doc = iframe.contentDocument
doc.open()
doc.write(html)
doc.close()
```

### 3. 变量自动导出

```javascript
// 自动提取所有 const/let 声明
const exports = {}
${extractExports(script)}
return exports
```

## 📚 参考资源

- [MDN - iframe](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe)
- [Vue SFC Playground](https://play.vuejs.org/) - Vue 官方 Playground
- [CodeSandbox](https://codesandbox.io/) - 在线代码编辑器

---

**现在刷新浏览器，测试新的 iframe 预览方案！** 🚀
