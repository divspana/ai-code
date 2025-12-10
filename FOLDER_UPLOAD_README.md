# 文件夹上传功能文档

## 功能概述

这是一个完整的文件夹上传解决方案，支持以下特性：

- ✅ **文件夹选择**：支持选择整个文件夹进行上传
- ✅ **树形展示**：在表格中以树形结构展示文件夹和文件
- ✅ **分片上传**：大文件自动分片上传（默认2MB/片）
- ✅ **并发控制**：最大并发上传任务数为6个
- ✅ **进度跟踪**：实时显示每个文件的上传进度
- ✅ **状态管理**：显示文件上传状态（待上传、上传中、已完成、失败）
- ✅ **暂停/继续**：支持暂停和继续上传
- ✅ **断点续传**：支持检查已上传的分片，避免重复上传
- ✅ **秒传功能**：已上传的文件可以秒传

## 文件结构

```
src/
├── components/
│   └── FolderUpload.vue          # 主组件
├── views/
│   └── FolderUploadDemo.vue      # 示例页面
├── utils/
│   └── uploadService.ts          # 上传服务
└── api/
    └── mockUploadServer.ts       # Mock 服务器（开发用）
```

## 核心组件

### 1. FolderUpload.vue

主要的文件夹上传组件，包含以下功能：

#### Props

无需传入 props，组件是独立的。

#### 主要功能

- 文件夹选择
- 树形表格展示
- 上传进度显示
- 状态管理
- 并发控制

#### 使用示例

```vue
<template>
  <FolderUpload />
</template>

<script setup lang="ts">
import FolderUpload from '@/components/FolderUpload.vue'
</script>
```

### 2. uploadService.ts

提供文件上传的核心功能：

#### 主要函数

##### `uploadFileWithChunks(options: UploadOptions)`

分片上传单个文件。

```typescript
interface UploadOptions {
  file: File // 要上传的文件
  chunkSize?: number // 分片大小（默认2MB）
  onProgress?: (progress: number) => void // 进度回调
  signal?: AbortSignal // 取消信号
  metadata?: Record<string, any> // 额外元数据
}

// 使用示例
await uploadFileWithChunks({
  file: myFile,
  chunkSize: 2 * 1024 * 1024,
  onProgress: progress => {
    console.log(`上传进度: ${Math.round(progress * 100)}%`)
  }
})
```

##### `uploadFilesWithConcurrency(files, options)`

批量上传文件，支持并发控制。

```typescript
await uploadFilesWithConcurrency(fileArray, {
  maxConcurrent: 6,
  chunkSize: 2 * 1024 * 1024,
  onFileProgress: (file, progress) => {
    console.log(`${file.name}: ${Math.round(progress * 100)}%`)
  },
  onFileComplete: file => {
    console.log(`${file.name} 上传完成`)
  },
  onFileError: (file, error) => {
    console.error(`${file.name} 上传失败:`, error)
  }
})
```

##### `uploadSingleFile(file, onProgress, signal)`

简单的单文件上传（不分片）。

```typescript
const result = await uploadSingleFile(
  myFile,
  progress => console.log(progress),
  abortController.signal
)
```

## API 接口

### 后端需要实现的接口

#### 1. 上传分片

```
POST /api/upload/chunk
Content-Type: multipart/form-data

FormData:
- chunk: Blob           # 分片数据
- index: number         # 分片索引（从0开始）
- total: number         # 总分片数
- hash: string          # 文件哈希值
- fileName: string      # 文件名
- fileSize: number      # 文件总大小

Response:
{
  "success": true,
  "message": "Chunk uploaded"
}
```

#### 2. 合并分片

```
POST /api/upload/merge
Content-Type: application/json

Body:
{
  "fileName": "example.pdf",
  "hash": "abc123",
  "total": 10,
  "metadata": {
    "relativePath": "folder/subfolder/example.pdf"
  }
}

Response:
{
  "success": true,
  "message": "File merged successfully",
  "fileUrl": "/uploads/example.pdf"
}
```

#### 3. 检查文件状态

```
GET /api/upload/check?hash=abc123&fileName=example.pdf

Response:
{
  "exists": false,
  "uploadedChunks": [0, 1, 2, 5]  # 已上传的分片索引
}
```

#### 4. 单文件上传

```
POST /api/upload/single
Content-Type: multipart/form-data

FormData:
- file: File

Response:
{
  "success": true,
  "message": "File uploaded successfully",
  "fileUrl": "/uploads/example.pdf"
}
```

## 配置说明

### 分片大小

在 `FolderUpload.vue` 中修改：

```typescript
const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk
```

### 最大并发数

在 `FolderUpload.vue` 中修改：

```typescript
const MAX_CONCURRENT = 6 // 最大并发数
```

### 上传超时

在 `uploadService.ts` 中修改：

```typescript
// 分片上传超时
timeout: 60000 // 60秒

// 合并超时
timeout: 120000 // 120秒
```

## Mock 服务器

开发环境下，项目使用 Mock 服务器模拟后端 API。

### 启用/禁用

在 `main.ts` 中：

```typescript
// 仅在开发环境启用
if (import.meta.env.DEV) {
  setupMockUploadServer()
}
```

### Mock 服务器功能

- 模拟网络延迟（100-500ms）
- 存储分片数据
- 模拟文件合并
- 支持断点续传检查

### 清除 Mock 数据

```typescript
import { clearMockUploadData } from '@/api/mockUploadServer'

clearMockUploadData()
```

## 使用流程

### 1. 基本使用

```vue
<template>
  <FolderUpload />
</template>

<script setup lang="ts">
import FolderUpload from '@/components/FolderUpload.vue'
</script>
```

### 2. 用户操作流程

1. 点击"选择文件夹"按钮
2. 在弹出的文件选择器中选择一个文件夹
3. 文件以树形结构显示在表格中
4. 点击"开始上传"按钮开始上传
5. 实时查看上传进度和状态
6. 可以点击"暂停上传"暂停
7. 上传完成后可以"清空列表"

### 3. 自定义上传逻辑

如果需要自定义上传逻辑，可以直接使用 `uploadService`：

```typescript
import { uploadFileWithChunks } from '@/utils/uploadService'

const handleUpload = async (file: File) => {
  try {
    await uploadFileWithChunks({
      file,
      chunkSize: 5 * 1024 * 1024, // 5MB
      onProgress: progress => {
        console.log(`进度: ${Math.round(progress * 100)}%`)
      },
      metadata: {
        userId: '12345',
        category: 'documents'
      }
    })
    console.log('上传成功')
  } catch (error) {
    console.error('上传失败:', error)
  }
}
```

## 性能优化建议

### 1. 分片大小优化

- **小文件**（< 10MB）：建议 1-2MB 分片
- **中等文件**（10-100MB）：建议 2-5MB 分片
- **大文件**（> 100MB）：建议 5-10MB 分片

### 2. 并发数优化

- **快速网络**：可以设置 8-10 个并发
- **普通网络**：建议 4-6 个并发
- **慢速网络**：建议 2-3 个并发

### 3. 哈希计算优化

当前使用简化的哈希算法，生产环境建议使用：

```bash
npm install spark-md5
```

然后修改 `uploadService.ts` 中的 `calculateFileHash` 函数：

```typescript
import SparkMD5 from 'spark-md5'

const calculateFileHash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    const chunkSize = 2 * 1024 * 1024
    let currentChunk = 0
    const chunks = Math.ceil(file.size / chunkSize)

    fileReader.onload = e => {
      spark.append(e.target?.result as ArrayBuffer)
      currentChunk++

      if (currentChunk < chunks) {
        loadNext()
      } else {
        resolve(spark.end())
      }
    }

    fileReader.onerror = reject

    const loadNext = () => {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      fileReader.readAsArrayBuffer(file.slice(start, end))
    }

    loadNext()
  })
}
```

## 常见问题

### Q1: 上传失败怎么办？

A: 组件会自动标记失败的文件，可以点击"开始上传"重新上传失败的文件。

### Q2: 如何修改上传的 API 地址？

A: 在 `uploadService.ts` 中修改对应的 API 路径：

```typescript
await axios.post('/api/upload/chunk', formData) // 修改这里
```

### Q3: 如何添加认证 Token？

A: 在 axios 配置中添加：

```typescript
await axios.post('/api/upload/chunk', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    Authorization: `Bearer ${yourToken}`
  }
})
```

### Q4: 如何限制文件类型？

A: 在 `FolderUpload.vue` 的 `handleFolderSelect` 中添加过滤：

```typescript
const handleFolderSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])

  // 过滤文件类型
  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png']
  const filteredFiles = files.filter(file => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    return allowedTypes.includes(ext)
  })

  // ... 继续处理
}
```

## 浏览器兼容性

- Chrome 21+
- Firefox 50+
- Safari 11.1+
- Edge 79+

注意：文件夹选择功能依赖于 `webkitdirectory` 属性，部分旧版浏览器可能不支持。

## 许可证

MIT
