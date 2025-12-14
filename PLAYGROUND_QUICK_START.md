# Playground 快速开始

## 🎯 5分钟上手

### 1. 启动项目

```bash
# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

### 2. 访问 Playground

打开浏览器访问：`http://localhost:5173/playground`

### 3. 开始使用

1. **浏览示例** - 在左侧菜单选择组件示例
2. **编辑代码** - 在代码编辑器中修改代码
3. **查看效果** - 右侧实时预览组件效果
4. **复制代码** - 点击"复制代码"按钮使用代码

## 📝 添加你的第一个示例

### 步骤 1: 编辑配置文件

打开 `src/config/playground-examples.ts`，添加新示例：

```typescript
{
  id: 'my-first-example',
  title: '我的第一个示例',
  description: '这是一个简单的按钮示例',
  category: 'basic',
  tags: ['button', 'demo'],
  code: `<template>
  <div class="demo-container">
    <h3>我的按钮示例</h3>
    <el-button @click="handleClick">点击我</el-button>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const handleClick = () => {
  ElMessage.success('你点击了按钮！')
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
}

h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>`
}
```

### 步骤 2: 查看效果

保存文件后，刷新浏览器，在"基础组件"分类下找到你的示例。

## 🎨 示例模板

### 基础模板

```vue
<template>
  <div class="demo-container">
    <h3>示例标题</h3>
    <!-- 你的组件 -->
  </div>
</template>

<script setup lang="ts">
// 导入需要的依赖
</script>

<style scoped>
.demo-container {
  padding: 20px;
}
</style>
```

### 表单示例模板

```vue
<template>
  <div class="demo-container">
    <h3>表单示例</h3>
    <el-form :model="form" label-width="100px">
      <el-form-item label="字段名">
        <el-input v-model="form.field" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit"> 提交 </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const form = reactive({
  field: ''
})

const handleSubmit = () => {
  ElMessage.success('提交成功！')
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 600px;
}
</style>
```

## 🔥 常用组件示例

### 按钮组件

```typescript
{
  id: 'button-example',
  title: '按钮示例',
  category: 'basic',
  code: `<template>
  <div class="demo-container">
    <el-button type="primary">主要按钮</el-button>
    <el-button type="success">成功按钮</el-button>
  </div>
</template>`
}
```

### 表格组件

```typescript
{
  id: 'table-example',
  title: '表格示例',
  category: 'data',
  code: `<template>
  <el-table :data="tableData">
    <el-table-column prop="name" label="姓名" />
    <el-table-column prop="age" label="年龄" />
  </el-table>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tableData = ref([
  { name: '张三', age: 18 },
  { name: '李四', age: 20 }
])
</script>`
}
```

## 💡 小技巧

1. **使用搜索** - 在搜索框输入关键词快速找到示例
2. **切换布局** - 点击"横向/纵向"按钮切换编辑器布局
3. **刷新预览** - 如果预览出错，点击刷新按钮
4. **复制代码** - 使用复制按钮快速获取代码

## 🐛 常见问题

### Q: 预览不显示？

A: 检查代码是否有语法错误，查看浏览器控制台的错误信息。

### Q: 如何导入自定义组件？

A: 使用相对路径导入：`import MyComponent from '@/components/MyComponent.vue'`

### Q: 样式不生效？

A: 确保使用了 `scoped` 属性，或者检查样式选择器是否正确。

## 📚 下一步

- 查看 [完整使用指南](./PLAYGROUND_GUIDE.md)
- 浏览更多示例代码
- 创建自己的组件示例

## 🎉 开始探索

现在你已经掌握了基础用法，开始创建你的组件示例吧！
