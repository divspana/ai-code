# 切片上传管理器设计文档

## 概述

`ChunkUploadManager` 是一个专门用于处理大文件切片上传的管理类，支持并发控制、自动重试、进度追踪等功能。

## 核心特性

### 1. 切片级并发控制

- ✅ 最大并发数可配置（默认6个）
- ✅ 以切片为单位进行并发，而非文件
- ✅ 自动从队列中取下一个切片任务

### 2. 自动重试机制

- ✅ 切片失败自动重试（默认3次）
- ✅ 重试次数可配置
- ✅ 3次失败后标记文件失败

### 3. 文件状态管理

- ✅ 实时追踪每个文件的上传进度
- ✅ 记录已上传和失败的切片
- ✅ 所有切片完成后自动合并

### 4. 灵活配置

- ✅ 切片大小可配置
- ✅ 上传接口地址可配置
- ✅ 支持自定义哈希算法

## 类设计

### ChunkUploadManager 类

```typescript
class ChunkUploadManager {
  // 配置项
  private chunkSize: number // 切片大小
  private maxConcurrent: number // 最大并发数
  private maxRetries: number // 最大重试次数
  private uploadUrl: string // 上传接口
  private mergeUrl: string // 合并接口

  // 状态管理
  private isUploading: Ref<boolean> // 是否正在上传
  private chunkQueue: ChunkTask[] // 切片任务队列
  private fileStates: Map // 文件状态映射
  private activeChunks: Set // 活跃的切片

  // 公共方法
  upload(files: FileNode[]): Promise<void> // 开始上传
  pause(): void // 暂停上传
  clear(): void // 清理资源
  getUploadingStatus() // 获取上传状态
  getStatistics() // 获取统计信息
}
```

## 数据结构

### FileNode（文件节点）

```typescript
interface FileNode {
  id: string // 唯一标识
  name: string // 文件名
  path: string // 文件路径
  size: number // 文件大小
  file: File // 原始文件对象
  uploadProgress: number // 上传进度 0-100
  uploadStatus: Status // 上传状态
}
```

### ChunkTask（切片任务）

```typescript
interface ChunkTask {
  fileId: string // 所属文件ID
  chunkIndex: number // 切片索引
  totalChunks: number // 总切片数
  chunk: Blob // 切片数据
  hash: string // 文件哈希
  fileName: string // 文件名
  fileSize: number // 文件大小
  retryCount: number // 当前重试次数
}
```

### FileUploadState（文件上传状态）

```typescript
interface FileUploadState {
  fileNode: FileNode // 文件节点引用
  totalChunks: number // 总切片数
  uploadedChunks: Set<number> // 已上传的切片索引集合
  failedChunks: Set<number> // 失败的切片索引集合
  hash: string // 文件哈希值
  controller: AbortController // 用于取消上传
}
```

## 工作流程

### 1. 初始化阶段

```
创建 ChunkUploadManager 实例
    ↓
配置参数（切片大小、并发数、重试次数等）
    ↓
准备就绪
```

### 2. 上传准备阶段

```
调用 upload(files)
    ↓
遍历每个文件
    ↓
计算文件哈希值
    ↓
将文件切片（根据 chunkSize）
    ↓
创建切片任务（ChunkTask）
    ↓
加入切片队列（chunkQueue）
    ↓
初始化文件状态（FileUploadState）
```

### 3. 并发上传阶段

```
启动 N 个并发工作线程（N = maxConcurrent）
    ↓
每个线程执行 processChunkQueue()
    ↓
从队列取切片任务
    ↓
上传切片（uploadChunk）
    ↓
成功：标记切片完成，更新进度
失败：重试（最多 maxRetries 次）
    ↓
检查文件是否所有切片都完成
    ↓
是：调用合并接口（mergeFileChunks）
否：继续处理下一个切片
    ↓
重复直到队列为空
```

### 4. 完成阶段

```
所有切片任务处理完毕
    ↓
等待所有工作线程结束
    ↓
更新上传状态
    ↓
返回结果
```

## 使用示例

### 基础使用（Composable 方式）

```typescript
import { useChunkUpload } from '@/composables/useChunkUpload'

// 创建上传管理器
const uploader = useChunkUpload({
  chunkSize: 2 * 1024 * 1024,  // 2MB
  maxConcurrent: 6,
  maxRetries: 3
})

// 准备文件列表
const files: FileNode[] = [...]

// 开始上传
await uploader.upload(files)

// 暂停上传
uploader.pause()

// 清理资源
uploader.clear()

// 获取状态
console.log(uploader.isUploading.value)
console.log(uploader.activeChunksCount.value)

// 获取统计
const stats = uploader.getStatistics()
console.log(stats.successFiles, stats.failedFiles)
```

### 类实例使用

```typescript
import { ChunkUploadManager } from '@/composables/useChunkUpload'

// 创建管理器实例
const manager = new ChunkUploadManager({
  chunkSize: 5 * 1024 * 1024, // 5MB
  maxConcurrent: 10,
  maxRetries: 5
})

// 使用方式相同
await manager.upload(files)
manager.pause()
manager.clear()
```

## 场景示例

### 场景：上传3个文件

**文件列表：**

- 文件A: 10MB (5个切片，每个2MB)
- 文件B: 6MB (3个切片)
- 文件C: 4MB (2个切片)
- **总共: 10个切片任务**

**执行时间线：**

```
T0: 启动6个并发工作线程
    线程1 → 文件A-切片0
    线程2 → 文件A-切片1
    线程3 → 文件A-切片2
    线程4 → 文件A-切片3
    线程5 → 文件A-切片4
    线程6 → 文件B-切片0

T1: 线程5完成文件A-切片4
    线程5 → 文件B-切片1

T2: 线程1完成文件A-切片0
    线程1 → 文件B-切片2

T3: 线程2完成文件A-切片1
    线程2 → 文件C-切片0

T4: 线程3完成文件A-切片2
    线程3 → 文件C-切片1

T5: 线程4完成文件A-切片3
    文件A所有切片完成 → 调用合并接口
    文件A状态更新为 success

T6: 线程6完成文件B-切片0
    线程6空闲（队列已空）

T7: 线程5完成文件B-切片1
    线程5空闲

T8: 线程1完成文件B-切片2
    文件B所有切片完成 → 调用合并接口
    文件B状态更新为 success
    线程1空闲

T9: 线程2完成文件C-切片0
    线程2空闲

T10: 线程3完成文件C-切片1
     文件C所有切片完成 → 调用合并接口
     文件C状态更新为 success
     线程3空闲

所有线程空闲，上传完成！
```

### 场景：切片失败重试

```
文件D-切片2 上传失败
    ↓
retryCount = 1
    ↓
重新加入队列末尾
    ↓
等待下一个空闲线程
    ↓
再次尝试上传
    ↓
仍然失败，retryCount = 2
    ↓
再次加入队列
    ↓
第3次尝试
    ↓
成功！标记切片完成
```

### 场景：切片重试3次后失败

```
文件E-切片5 上传失败
    ↓
重试1次 → 失败
    ↓
重试2次 → 失败
    ↓
重试3次 → 失败
    ↓
retryCount >= maxRetries
    ↓
标记文件E为失败状态（exception）
    ↓
不再重试该切片
    ↓
继续处理其他文件的切片
```

## 优势分析

### 1. 更高效的资源利用

- ❌ 旧方案：大文件阻塞并发槽位
- ✅ 新方案：所有切片公平竞争

### 2. 更细粒度的错误处理

- ❌ 旧方案：文件失败需要重传整个文件
- ✅ 新方案：只重传失败的切片

### 3. 更好的用户体验

- ✅ 实时显示每个文件的上传进度
- ✅ 多个文件同时上传
- ✅ 失败重试对用户透明

### 4. 更灵活的配置

- ✅ 切片大小可调整
- ✅ 并发数可调整
- ✅ 重试次数可调整

### 5. 代码复用性

- ✅ 独立的类/Composable
- ✅ 可在多个组件中使用
- ✅ 易于测试和维护

## API 接口设计

### 上传切片接口

**请求：**

```
POST /api/upload/chunk
Content-Type: multipart/form-data

chunk: Blob              // 切片数据
index: number            // 切片索引
total: number            // 总切片数
hash: string             // 文件哈希
fileName: string         // 文件名
fileSize: number         // 文件大小
relativePath: string     // 相对路径
```

**响应：**

```json
{
  "success": true,
  "message": "Chunk uploaded successfully"
}
```

### 合并切片接口

**请求：**

```
POST /api/upload/merge
Content-Type: application/json

{
  "fileName": "example.pdf",
  "hash": "abc123",
  "total": 5,
  "relativePath": "folder/example.pdf"
}
```

**响应：**

```json
{
  "success": true,
  "message": "File merged successfully",
  "fileUrl": "https://cdn.example.com/files/example.pdf"
}
```

## 注意事项

### 1. 内存管理

- 切片大小不宜过小（增加请求次数）
- 切片大小不宜过大（占用内存）
- 推荐：2MB - 5MB

### 2. 并发控制

- 并发数不宜过大（浏览器限制）
- 推荐：6 - 10

### 3. 重试策略

- 重试次数不宜过多（浪费资源）
- 推荐：3次

### 4. 错误处理

- 网络错误：自动重试
- 服务器错误：记录日志
- 取消上传：清理资源

## 扩展功能

### 可能的扩展方向

1. **断点续传**
   - 记录已上传的切片
   - 下次上传时跳过已完成的切片

2. **秒传功能**
   - 上传前检查文件哈希
   - 服务器已存在则直接返回

3. **上传速度限制**
   - 控制上传速度
   - 避免占用过多带宽

4. **优先级队列**
   - 支持文件优先级
   - 重要文件优先上传

5. **上传统计**
   - 上传速度
   - 剩余时间
   - 成功率

## 总结

`ChunkUploadManager` 提供了一个完整的切片上传解决方案，具有以下特点：

- ✅ 高效的并发控制
- ✅ 可靠的错误处理
- ✅ 灵活的配置选项
- ✅ 良好的代码组织
- ✅ 易于使用和维护

适用于需要上传大文件或批量上传文件的场景。
