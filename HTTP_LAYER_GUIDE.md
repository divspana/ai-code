# 🌐 HTTP 网络层封装指南

## 📋 概述

基于 Axios 封装的完整网络层，支持 Token 管理、文件上传下载、请求重试、进度监控等功能。

## ✨ 核心特性

### 1. 基础功能
- ✅ **统一的请求封装** - GET、POST、PUT、DELETE、PATCH
- ✅ **自动 Token 管理** - 自动添加、刷新、清除
- ✅ **请求/响应拦截** - 统一处理
- ✅ **错误处理** - 统一错误提示和处理
- ✅ **Loading 提示** - 自动显示/隐藏加载状态

### 2. 高级功能
- ✅ **文件上传** - 单文件、多文件、分片上传、文件夹上传
- ✅ **文件下载** - 文件下载、导出、批量下载
- ✅ **进度监控** - 上传/下载进度实时反馈
- ✅ **请求重试** - 失败自动重试
- ✅ **请求取消** - 取消进行中的请求
- ✅ **白名单机制** - 部分接口不需要 Token

## 📦 文件结构

```
src/utils/http/
├── index.ts          # 统一导出
├── types.ts          # 类型定义
├── config.ts         # 配置文件
├── token.ts          # Token 管理
├── request.ts        # 请求封装
├── upload.ts         # 文件上传
└── download.ts       # 文件下载

src/api/
└── example.ts        # API 使用示例

.env.development      # 开发环境配置
.env.production       # 生产环境配置
```

## 🚀 快速开始

### 1. 基础请求

```typescript
import { http } from '@/utils/http'

// GET 请求
const data = await http.get('/api/users')

// POST 请求
const result = await http.post('/api/users', {
  name: 'John',
  email: 'john@example.com'
})

// PUT 请求
await http.put('/api/users/1', { name: 'Jane' })

// DELETE 请求
await http.delete('/api/users/1')
```

### 2. 带参数的请求

```typescript
// GET 请求带参数
const users = await http.get('/api/users', {
  page: 1,
  pageSize: 10,
  keyword: 'john'
})

// POST 请求带配置
const result = await http.post('/api/users', data, {
  showLoading: false,  // 不显示 loading
  showError: false,    // 不显示错误提示
  needToken: false     // 不需要 token
})
```

### 3. 文件上传

```typescript
import { uploadFile, uploadFiles } from '@/utils/http'

// 单文件上传
const file = document.querySelector('input[type="file"]').files[0]
const result = await uploadFile('/api/upload', file, {
  onUploadProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    console.log(`上传进度: ${percent}%`)
  }
})

// 多文件上传
const files = Array.from(document.querySelector('input[type="file"]').files)
await uploadFiles('/api/upload/multiple', files)
```

### 4. 文件下载

```typescript
import { downloadFile, exportFile } from '@/utils/http'

// 下载文件
await downloadFile('/api/download/file/123', 'document.pdf')

// 导出 Excel
await exportFile('/api/export/users', { 
  startDate: '2024-01-01',
  endDate: '2024-12-31'
}, 'users.xlsx')
```

## 📖 详细使用

### Token 管理

```typescript
import { setToken, getToken, clearTokens } from '@/utils/http'

// 登录后设置 Token
const { token, refreshToken } = await login(username, password)
setToken(token)
setRefreshToken(refreshToken)

// 获取 Token
const token = getToken()

// 清除 Token（登出时）
clearTokens()
```

### 请求配置

```typescript
interface RequestConfig {
  showLoading?: boolean        // 是否显示加载提示（默认 true）
  showError?: boolean          // 是否显示错误提示（默认 true）
  needToken?: boolean          // 是否需要 token（默认 true）
  retryCount?: number          // 重试次数（默认 0）
  retryDelay?: number          // 重试延迟（默认 1000ms）
  customErrorHandler?: Function // 自定义错误处理
}
```

### 文件上传高级用法

#### 1. 带额外参数的上传

```typescript
import { uploadFileWithData } from '@/utils/http'

await uploadFileWithData('/api/upload', file, {
  userId: '123',
  category: 'avatar',
  description: '用户头像'
})
```

#### 2. Base64 上传

```typescript
import { uploadBase64 } from '@/utils/http'

const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANS...'
await uploadBase64('/api/upload/base64', base64, 'image.png')
```

#### 3. 分片上传（大文件）

```typescript
import { uploadChunks } from '@/utils/http'

const largeFile = document.querySelector('input').files[0]
await uploadChunks('/api/upload/chunks', largeFile, 2 * 1024 * 1024, {
  onUploadProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    console.log(`上传进度: ${percent}%`)
  }
})
```

#### 4. 文件夹上传

```typescript
import { uploadFolder } from '@/utils/http'

const input = document.createElement('input')
input.type = 'file'
input.webkitdirectory = true

input.onchange = async (e) => {
  const files = Array.from(e.target.files)
  await uploadFolder('/api/upload/folder', files)
}
```

### 文件下载高级用法

#### 1. POST 下载

```typescript
import { downloadFileByPost } from '@/utils/http'

await downloadFileByPost('/api/download', {
  ids: [1, 2, 3],
  format: 'xlsx'
}, 'data.xlsx')
```

#### 2. 批量下载

```typescript
import { downloadMultipleFiles } from '@/utils/http'

const urls = [
  '/api/download/file/1',
  '/api/download/file/2',
  '/api/download/file/3'
]

const filenames = ['file1.pdf', 'file2.pdf', 'file3.pdf']

await downloadMultipleFiles(urls, filenames)
```

#### 3. 下载 Base64

```typescript
import { downloadBase64 } from '@/utils/http'

const base64 = 'iVBORw0KGgoAAAANSUhEUgAA...'
downloadBase64(base64, 'image.png', 'image/png')
```

#### 4. 预览文件

```typescript
import { previewFile } from '@/utils/http'

previewFile('https://example.com/document.pdf')
```

### 请求重试

```typescript
// 失败后自动重试 3 次，每次间隔 1 秒
const data = await http.get('/api/data', {}, {
  retryCount: 3,
  retryDelay: 1000
})
```

### 自定义错误处理

```typescript
const data = await http.get('/api/data', {}, {
  showError: false,  // 不显示默认错误提示
  customErrorHandler: (error) => {
    // 自定义错误处理逻辑
    if (error.response?.status === 404) {
      console.log('资源不存在')
    }
  }
})
```

## 🔧 配置说明

### 环境变量

#### .env.development
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

#### .env.production
```env
VITE_API_BASE_URL=https://api.example.com
```

### 配置文件 (config.ts)

```typescript
// API 基础路径
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 请求超时时间
export const REQUEST_TIMEOUT = 30000

// Token 存储 key
export const TOKEN_KEY = 'access_token'

// 白名单（不需要 token 的接口）
export const WHITE_LIST = ['/login', '/register', '/refresh-token']

// 错误消息映射
export const ERROR_MESSAGE_MAP = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求的资源不存在',
  500: '服务器内部错误'
}
```

## 💡 最佳实践

### 1. API 模块化

```typescript
// src/api/user.ts
import { http } from '@/utils/http'

export const userApi = {
  getList: (params) => http.get('/users', params),
  getDetail: (id) => http.get(`/users/${id}`),
  create: (data) => http.post('/users', data),
  update: (id, data) => http.put(`/users/${id}`, data),
  delete: (id) => http.delete(`/users/${id}`)
}
```

### 2. 类型定义

```typescript
// src/api/types/user.ts
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
}

export interface UserListParams {
  page?: number
  pageSize?: number
  keyword?: string
}

// src/api/user.ts
import type { User, UserListParams } from './types/user'

export const userApi = {
  getList: (params: UserListParams) => 
    http.get<User[]>('/users', params),
    
  getDetail: (id: string) => 
    http.get<User>(`/users/${id}`)
}
```

### 3. 错误处理

```typescript
try {
  const data = await http.get('/api/data')
  // 处理数据
} catch (error) {
  // 错误已经在拦截器中处理
  // 这里可以做额外的处理
  console.error('请求失败:', error)
}
```

### 4. Loading 状态

```typescript
// 全局 Loading（默认）
const data = await http.get('/api/data')

// 局部 Loading
const loading = ref(false)

loading.value = true
try {
  const data = await http.get('/api/data', {}, {
    showLoading: false  // 不使用全局 loading
  })
} finally {
  loading.value = false
}
```

## 🎯 实际应用示例

### 用户登录

```typescript
// src/api/auth.ts
import { http, setToken, setRefreshToken } from '@/utils/http'

export async function login(username: string, password: string) {
  const result = await http.post<{
    token: string
    refreshToken: string
    userInfo: any
  }>('/auth/login', { username, password }, {
    needToken: false
  })
  
  // 保存 token
  setToken(result.token)
  setRefreshToken(result.refreshToken)
  
  return result.userInfo
}
```

### 文件上传组件

```vue
<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <el-progress v-if="uploading" :percentage="progress" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadFile } from '@/utils/http'
import { ElMessage } from 'element-plus'

const uploading = ref(false)
const progress = ref(0)

const handleFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  uploading.value = true
  progress.value = 0
  
  try {
    await uploadFile('/api/upload', file, {
      onUploadProgress: (progressEvent) => {
        progress.value = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        )
      }
    })
    
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}
</script>
```

### 数据导出

```vue
<template>
  <el-button @click="handleExport" :loading="exporting">
    导出数据
  </el-button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { exportFile } from '@/utils/http'
import { ElMessage } from 'element-plus'

const exporting = ref(false)

const handleExport = async () => {
  exporting.value = true
  
  try {
    await exportFile('/api/export/users', {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }, 'users.xlsx')
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}
</script>
```

## 🔒 安全建议

### 1. Token 安全
- ✅ 使用 HTTPS 传输
- ✅ Token 设置过期时间
- ✅ 实现 Refresh Token 机制
- ✅ 敏感操作二次验证

### 2. 请求安全
- ✅ 参数验证
- ✅ 防止 CSRF 攻击
- ✅ 限制请求频率
- ✅ 敏感数据加密

### 3. 文件上传安全
- ✅ 文件类型验证
- ✅ 文件大小限制
- ✅ 文件内容检查
- ✅ 防止恶意文件

## 📚 参考资源

- [Axios 官方文档](https://axios-http.com/)
- [HTTP 状态码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)
- [RESTful API 设计](https://restfulapi.net/)

## 🎉 总结

HTTP 网络层封装提供了：

1. ✅ **完整的请求封装** - 支持所有 HTTP 方法
2. ✅ **自动 Token 管理** - 无需手动处理
3. ✅ **文件上传下载** - 支持多种场景
4. ✅ **进度监控** - 实时反馈
5. ✅ **错误处理** - 统一处理和提示
6. ✅ **请求重试** - 提高可靠性
7. ✅ **类型安全** - 完整的 TypeScript 支持

开始使用这个强大的网络层吧！🚀
