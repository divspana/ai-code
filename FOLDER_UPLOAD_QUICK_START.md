# 文件夹上传功能 - 快速开始

## 🚀 快速使用

### 1. 访问演示页面

启动项目后，访问：

```
http://localhost:5173/folder-upload
```

### 2. 基本操作

1. **选择文件夹**
   - 点击"选择文件夹"按钮
   - 在弹出的对话框中选择一个文件夹
   - 文件会以树形结构显示在表格中

2. **查看文件信息**
   - 文件名：显示文件/文件夹名称
   - 大小：显示文件大小（文件夹显示"-"）
   - 路径：显示相对路径
   - 上传进度：显示进度条
   - 状态：显示当前状态（待上传/上传中/已完成/失败）

3. **开始上传**
   - 点击"开始上传"按钮
   - 系统会自动以最多6个并发任务上传文件
   - 每个文件会被分成2MB的分片上传

4. **暂停上传**
   - 点击"暂停上传"按钮可以暂停所有上传任务
   - 再次点击"开始上传"可以继续上传

5. **清空列表**
   - 上传完成后可以点击"清空列表"清除所有文件

## 📦 在其他组件中使用

### 方式一：直接使用组件

```vue
<template>
  <div>
    <FolderUpload />
  </div>
</template>

<script setup lang="ts">
import FolderUpload from '@/components/FolderUpload.vue'
</script>
```

### 方式二：使用上传服务

```vue
<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <div v-if="progress > 0">上传进度: {{ progress }}%</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadFileWithChunks } from '@/utils/uploadService'

const progress = ref(0)

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  try {
    await uploadFileWithChunks({
      file,
      chunkSize: 2 * 1024 * 1024,
      onProgress: p => {
        progress.value = Math.round(p * 100)
      }
    })
    alert('上传成功！')
  } catch (error) {
    alert('上传失败：' + error)
  }
}
</script>
```

## ⚙️ 配置说明

### 修改分片大小

在 `src/components/FolderUpload.vue` 中：

```typescript
const CHUNK_SIZE = 5 * 1024 * 1024 // 改为 5MB
```

### 修改最大并发数

在 `src/components/FolderUpload.vue` 中：

```typescript
const MAX_CONCURRENT = 10 // 改为 10 个并发
```

### 修改上传 API 地址

在 `src/utils/uploadService.ts` 中：

```typescript
// 分片上传
await axios.post('/your-api/upload/chunk', formData)

// 合并分片
await axios.post('/your-api/upload/merge', {...})

// 检查文件
await axios.get('/your-api/upload/check', {...})
```

## 🔧 后端 API 要求

后端需要实现以下接口：

### 1. 接收分片

```
POST /api/upload/chunk
```

### 2. 合并分片

```
POST /api/upload/merge
```

### 3. 检查文件状态

```
GET /api/upload/check
```

详细的 API 规范请参考 `FOLDER_UPLOAD_README.md`

## 🎯 核心特性

### 1. 文件分片

- 默认每片 2MB
- 自动计算分片数量
- 支持大文件上传

### 2. 并发控制

- 最多同时上传 6 个文件
- 自动队列管理
- 避免浏览器资源耗尽

### 3. 断点续传

- 检查已上传的分片
- 只上传缺失的分片
- 节省带宽和时间

### 4. 进度跟踪

- 实时显示每个文件的进度
- 显示总体统计信息
- 状态可视化

### 5. 错误处理

- 自动标记失败的文件
- 支持重新上传失败的文件
- 详细的错误日志

## 📝 注意事项

1. **浏览器兼容性**
   - 需要支持 `webkitdirectory` 属性
   - Chrome 21+, Firefox 50+, Safari 11.1+, Edge 79+

2. **文件大小限制**
   - 前端无限制
   - 后端需要配置最大文件大小
   - 建议配置 Nginx 的 `client_max_body_size`

3. **网络问题**
   - 网络中断会导致上传失败
   - 可以点击"开始上传"重试
   - 已上传的分片不会重复上传

4. **开发环境**
   - 使用 Mock 服务器模拟后端
   - 生产环境需要实现真实的后端 API

## 🐛 常见问题

### Q: 为什么选择文件夹后没有反应？

A: 检查浏览器控制台是否有错误，确保浏览器支持文件夹选择功能。

### Q: 上传速度很慢怎么办？

A: 可以增加分片大小或减少并发数，根据网络情况调整。

### Q: 如何添加文件类型限制？

A: 在 `handleFolderSelect` 方法中添加文件过滤逻辑。

### Q: 如何添加认证？

A: 在 `uploadService.ts` 的 axios 请求中添加 Authorization header。

## 📚 更多文档

详细文档请参考：`FOLDER_UPLOAD_README.md`
