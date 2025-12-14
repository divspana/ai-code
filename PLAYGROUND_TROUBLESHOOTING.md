# Playground 问题排查指南

## 🔍 常见问题及解决方案

### 问题 1: 点击示例后预览区域没有内容

**症状：**

- 选择示例后，右侧预览区域是空白的
- 没有报错信息

**原因：**

- 代码解析失败
- 组件未正确挂载

**解决方案：**

1. 打开浏览器控制台（F12）查看错误信息
2. 检查示例代码是否有语法错误
3. 点击"刷新"按钮重新渲染
4. 尝试切换到 "Hello World" 示例测试基本功能

### 问题 2: 按钮点击没有反应

**症状：**

- 按钮可以看到，但点击没有效果
- 消息提示不显示

**原因：**

- 事件处理函数未正确导出
- ElMessage 未正确引用

**已修复：**
✅ 改进了变量和函数的自动导出机制
✅ 添加了 ElMessage 的全局引用

**验证方法：**

```vue
<template>
  <el-button @click="test">测试</el-button>
</template>

<script setup lang="ts">
const test = () => {
  ElMessage.success('测试成功！')
}
</script>
```

### 问题 3: 代码编辑后预览不更新

**症状：**

- 修改代码后，预览区域没有变化

**原因：**

- 代码监听未触发
- 组件未重新渲染

**解决方案：**

1. 点击"刷新"按钮手动刷新
2. 检查代码是否有语法错误
3. 尝试切换到其他示例再切换回来

### 问题 4: 样式不生效

**症状：**

- 组件显示了，但样式不对

**原因：**

- scoped 样式未正确应用
- 样式选择器错误

**解决方案：**

```vue
<style scoped>
/* 确保使用 scoped */
.demo-container {
  padding: 20px;
}
</style>
```

### 问题 5: 导入自定义组件失败

**症状：**

- 报错：找不到模块

**原因：**

- Playground 不支持导入自定义组件

**解决方案：**
❌ 不要使用：

```vue
<script setup>
import MyComponent from '@/components/MyComponent.vue'
</script>
```

✅ 只使用 Element Plus 组件：

```vue
<script setup>
// 不需要导入，直接使用
</script>

<template>
  <el-button>按钮</el-button>
</template>
```

## 🧪 调试技巧

### 1. 使用浏览器控制台

打开控制台查看错误信息：

```bash
# Mac
Cmd + Option + I

# Windows/Linux
F12 或 Ctrl + Shift + I
```

### 2. 简化代码测试

从最简单的代码开始：

```vue
<template>
  <div>{{ message }}</div>
</template>

<script setup lang="ts">
const message = ref('Hello')
</script>
```

逐步添加功能，找出问题所在。

### 3. 检查变量导出

确保所有变量都被正确声明：

```vue
<script setup lang="ts">
// ✅ 正确
const count = ref(0)
const message = ref('Hello')

// ❌ 错误 - 未使用 const/let
count = ref(0)
</script>
```

### 4. 使用 console.log 调试

```vue
<script setup lang="ts">
const handleClick = () => {
  console.log('按钮被点击了')
  count.value++
}
</script>
```

## 📋 功能检查清单

使用此清单验证 Playground 功能：

### 基础功能

- [ ] 能访问 `/playground` 页面
- [ ] 左侧菜单显示示例列表
- [ ] 点击示例能切换内容
- [ ] 搜索框能过滤示例

### 编辑器功能

- [ ] 代码编辑器显示代码
- [ ] 代码有语法高亮
- [ ] 能编辑代码
- [ ] 复制按钮能复制代码

### 预览功能

- [ ] 预览区域显示组件
- [ ] 组件样式正确
- [ ] 按钮可以点击
- [ ] 事件处理正常
- [ ] 消息提示显示

### 布局功能

- [ ] 横向布局正常
- [ ] 纵向布局正常
- [ ] 布局切换流畅

## 🔧 快速修复命令

### 重启开发服务器

```bash
# 停止服务器
Ctrl + C

# 重新启动
npm run dev
```

### 清除缓存

```bash
# 删除 node_modules 和重新安装
rm -rf node_modules
npm install
```

### 检查端口占用

```bash
# Mac/Linux
lsof -i :5173

# Windows
netstat -ano | findstr :5173
```

## 💡 最佳实践

### 1. 从简单示例开始

先测试 "Hello World" 示例，确保基本功能正常。

### 2. 逐步添加功能

不要一次写太多代码，逐步添加功能便于定位问题。

### 3. 参考现有示例

查看已有的示例代码，了解正确的写法。

### 4. 使用标准组件

只使用 Element Plus 提供的标准组件。

### 5. 保持代码简洁

Playground 适合简单的演示，不要写太复杂的逻辑。

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **查看文档**
   - `PLAYGROUND_GUIDE.md` - 完整使用指南
   - `PLAYGROUND_QUICK_START.md` - 快速开始
   - `PLAYGROUND_FIXES.md` - 修复说明

2. **检查示例代码**
   - 查看 `src/config/playground-examples.ts`
   - 参考已有的示例写法

3. **查看源码**
   - `src/components/Playground/CodePreview.vue` - 预览组件
   - `src/components/Playground/CodeEditor.vue` - 编辑器组件

## 🎯 测试用例

### 测试 1: 基础响应式

```vue
<template>
  <div>
    <p>{{ count }}</p>
    <el-button @click="count++">+1</el-button>
  </div>
</template>

<script setup lang="ts">
const count = ref(0)
</script>
```

### 测试 2: 事件处理

```vue
<template>
  <el-button @click="handleClick">点击</el-button>
</template>

<script setup lang="ts">
const handleClick = () => {
  ElMessage.success('成功！')
}
</script>
```

### 测试 3: 表单输入

```vue
<template>
  <div>
    <el-input v-model="text" />
    <p>{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
const text = ref('')
</script>
```

## ✅ 验证步骤

1. **启动项目**

   ```bash
   npm run dev
   ```

2. **访问页面**

   ```
   http://localhost:5173/playground
   ```

3. **测试示例**
   - 点击 "Hello World"
   - 点击按钮，查看计数增加
   - 查看消息提示

4. **测试编辑**
   - 修改代码
   - 查看预览更新

5. **测试其他功能**
   - 复制代码
   - 切换布局
   - 搜索示例

如果所有测试都通过，说明 Playground 功能正常！🎉
