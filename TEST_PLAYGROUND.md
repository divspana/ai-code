# 🧪 Playground 测试指南

## ✅ 已完成的修复

### 1. 切换到 Iframe 预览方案

- ✅ 创建了 `IframePreview.vue` 组件
- ✅ 更新了 `PlaygroundContainer.vue` 使用新的预览组件
- ✅ 使用 CDN 加载 Vue 和 Element Plus

### 2. 修复的问题

- ✅ 代码解析问题
- ✅ 变量导出问题
- ✅ 组件隔离问题
- ✅ 事件处理问题

## 🚀 立即测试

### 步骤 1: 刷新浏览器

```bash
# 确保开发服务器正在运行
npm run dev

# 然后在浏览器中刷新页面
# 或者按 Cmd+R (Mac) / Ctrl+R (Windows)
```

### 步骤 2: 访问 Playground

```
http://localhost:5173/playground
```

### 步骤 3: 测试 Hello World 示例

1. 点击左侧菜单的 "Hello World"
2. 查看右侧预览区域
3. 应该能看到：
   - 标题 "Hello Playground!"
   - 一个蓝色按钮显示 "点击次数: 0"

### 步骤 4: 测试交互功能

1. 点击按钮
2. 应该看到：
   - 按钮上的数字增加
   - 右上角弹出成功消息 "你点击了 X 次"

### 步骤 5: 测试代码编辑

1. 在左侧代码编辑器中修改 `message` 的值
2. 例如改为：`const message = ref('你好 Playground!')`
3. 预览应该实时更新显示新的标题

## 🔍 如果还是不能预览

### 检查 1: 查看浏览器控制台

```bash
# 打开浏览器开发者工具
Mac: Cmd + Option + I
Windows: F12 或 Ctrl + Shift + I

# 查看 Console 标签页
# 看是否有错误信息
```

### 检查 2: 查看网络请求

```bash
# 在开发者工具中切换到 Network 标签页
# 刷新页面
# 检查是否成功加载了：
- vue.global.js
- element-plus (JS)
- element-plus (CSS)
- @element-plus/icons-vue
```

### 检查 3: 查看 iframe 内容

```javascript
// 在浏览器控制台执行
const iframe = document.querySelector('.preview-iframe')
console.log('Iframe:', iframe)
console.log('Iframe document:', iframe?.contentDocument)
console.log('Iframe body:', iframe?.contentDocument?.body?.innerHTML)
```

## 🐛 常见问题

### 问题 1: 预览区域是空白的

**可能原因：**

- CDN 资源加载失败
- 网络连接问题

**解决方案：**

1. 检查网络连接
2. 查看浏览器控制台的网络请求
3. 尝试点击"刷新"按钮

### 问题 2: 点击按钮没反应

**可能原因：**

- JavaScript 代码执行错误
- 事件绑定失败

**解决方案：**

1. 打开浏览器控制台查看错误
2. 检查示例代码是否正确
3. 尝试切换到其他示例

### 问题 3: 样式不正确

**可能原因：**

- Element Plus CSS 未加载
- 自定义样式冲突

**解决方案：**

1. 检查 Network 标签，确认 CSS 已加载
2. 清除浏览器缓存
3. 刷新页面

## 📋 完整测试清单

### 基础功能测试

- [ ] 能访问 `/playground` 页面
- [ ] 左侧显示示例列表
- [ ] 右侧显示代码编辑器和预览区域

### Hello World 示例测试

- [ ] 预览显示标题 "Hello Playground!"
- [ ] 预览显示按钮
- [ ] 按钮显示 "点击次数: 0"
- [ ] 点击按钮，数字增加
- [ ] 显示成功消息提示
- [ ] 消息内容正确 "你点击了 X 次"

### 代码编辑测试

- [ ] 修改 message 值
- [ ] 预览实时更新
- [ ] 修改按钮文本
- [ ] 预览显示新文本

### 其他示例测试

- [ ] 按钮示例正常显示
- [ ] 表单示例正常显示
- [ ] 表格示例正常显示
- [ ] 文件上传示例正常显示

### 功能测试

- [ ] 复制代码按钮工作
- [ ] 刷新按钮工作
- [ ] 横向/纵向布局切换工作
- [ ] 搜索功能工作

## 🎯 预期结果

### Hello World 示例应该显示：

```
┌─────────────────────────────────┐
│   Hello Playground!             │
│                                 │
│   ┌───────────────────────┐    │
│   │  点击次数: 0          │    │
│   └───────────────────────┘    │
└─────────────────────────────────┘
```

### 点击按钮后：

```
┌─────────────────────────────────┐
│   Hello Playground!             │
│                                 │
│   ┌───────────────────────────┐│
│   │  点击次数: 1          │    │
│   └───────────────────────────┘│
└─────────────────────────────────┘

右上角显示：✓ 你点击了 1 次
```

## 💡 调试技巧

### 1. 查看生成的 HTML

在 `IframePreview.vue` 的 `generatePreviewHTML` 函数中添加：

```javascript
const html = generatePreviewHTML(props.code)
console.log('=== Generated HTML ===')
console.log(html)
```

### 2. 监听 iframe 加载

```javascript
const onIframeLoad = () => {
  console.log('Iframe loaded!')
  console.log('Iframe window:', iframeRef.value?.contentWindow)
}
```

### 3. 捕获 iframe 内的错误

在生成的 HTML 中添加：

```javascript
window.onerror = (msg, url, line, col, error) => {
  console.error('Iframe error:', msg, error)
  return false
}
```

## 📞 如果问题依然存在

### 1. 提供以下信息

- 浏览器版本
- 控制台错误信息
- Network 标签页的请求状态
- 具体的操作步骤

### 2. 尝试其他浏览器

- Chrome
- Firefox
- Safari
- Edge

### 3. 检查文件是否正确保存

```bash
# 检查文件是否存在
ls -la src/components/Playground/IframePreview.vue

# 检查文件内容
cat src/components/Playground/PlaygroundContainer.vue | grep IframePreview
```

## ✅ 成功标志

如果看到以下现象，说明 Playground 工作正常：

1. ✅ 预览区域显示内容（不是空白）
2. ✅ 按钮可以点击
3. ✅ 点击后数字增加
4. ✅ 显示成功消息
5. ✅ 修改代码后预览更新

## 🎉 下一步

如果测试通过：

1. 尝试其他示例
2. 创建自己的示例
3. 探索更多功能

如果测试失败：

1. 查看控制台错误
2. 检查网络请求
3. 尝试刷新页面
4. 查看 `PLAYGROUND_IFRAME_SOLUTION.md` 获取更多帮助

---

**现在就开始测试吧！** 🚀
