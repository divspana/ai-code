# 切片并发上传实现说明

## 核心改进

### 1. **并发控制单位变更**

- **之前**: 以文件为单位进行并发控制（6个文件同时上传）
- **现在**: 以切片为单位进行并发控制（6个切片同时上传）

### 2. **数据结构**

#### ChunkTask（切片任务）

```typescript
interface ChunkTask {
  fileNodeId: string // 所属文件ID
  chunkIndex: number // 切片索引
  totalChunks: number // 总切片数
  chunk: Blob // 切片数据
  hash: string // 文件哈希
  fileName: string // 文件名
  fileSize: number // 文件大小
  retryCount: number // 重试次数
}
```

#### FileUploadState（文件上传状态）

```typescript
interface FileUploadState {
  fileNode: FileNode // 文件节点引用
  totalChunks: number // 总切片数
  uploadedChunks: Set<number> // 已上传的切片索引
  failedChunks: Set<number> // 失败的切片索引
  hash: string // 文件哈希
}
```

## 工作流程

### 1. 准备阶段

```
选择文件夹（3个文件）
    ↓
计算每个文件的哈希值
    ↓
将每个文件切片（例如：2MB/片）
    ↓
生成切片任务队列
[文件1-切片0, 文件1-切片1, ..., 文件2-切片0, 文件2-切片1, ..., 文件3-切片0, ...]
```

### 2. 上传阶段

```
启动6个并发处理器
    ↓
每个处理器从队列取切片任务
    ↓
上传切片（带重试机制）
    ↓
成功：标记切片完成，更新文件进度
失败：重试最多3次
    ↓
文件所有切片完成后，调用合并接口
    ↓
标记文件状态为成功
```

## 关键特性

### 1. **切片级并发**

- 最多6个切片同时上传
- 不限制文件数量，只限制切片并发数
- 自动从队列中取下一个切片任务

### 2. **自动重试机制**

```typescript
// 切片失败时
if (chunkTask.retryCount < 3) {
  // 重新加入队列，最多重试3次
  chunkQueue.value.push(chunkTask)
} else {
  // 3次失败后，标记文件失败
  state.fileNode.uploadStatus = 'exception'
}
```

### 3. **实时进度更新**

```typescript
// 每个切片上传成功后更新进度
const updateFileProgress = (state: FileUploadState) => {
  const progress = (state.uploadedChunks.size / state.totalChunks) * 100
  state.fileNode.uploadProgress = Math.round(progress)
}
```

### 4. **文件状态管理**

- **uploading**: 文件正在上传中
- **success**: 所有切片上传完成且合并成功
- **exception**: 某个切片重试3次后仍失败
- **paused**: 用户暂停上传

## 示例场景

### 场景：上传3个文件

```
文件A: 10MB (5个切片)
文件B: 6MB  (3个切片)
文件C: 4MB  (2个切片)
总共: 10个切片任务
```

### 执行过程

```
时间轴：
T0: 启动6个并发处理器
    处理器1 → 文件A-切片0
    处理器2 → 文件A-切片1
    处理器3 → 文件A-切片2
    处理器4 → 文件A-切片3
    处理器5 → 文件A-切片4
    处理器6 → 文件B-切片0

T1: 处理器5完成文件A-切片4
    处理器5 → 文件B-切片1

T2: 处理器1完成文件A-切片0
    处理器1 → 文件B-切片2

T3: 处理器6完成文件B-切片0
    处理器6 → 文件C-切片0

... (继续直到所有切片完成)

当文件A的所有5个切片都完成：
    → 调用合并接口
    → 标记文件A为成功
    → 文件A进度显示100%
```

## 优势

1. **更高效的资源利用**
   - 不会因为某个大文件阻塞其他小文件
   - 所有文件的切片公平竞争并发槽位

2. **更细粒度的错误处理**
   - 单个切片失败不影响其他切片
   - 自动重试失败的切片
   - 只有切片重试3次后才标记文件失败

3. **更好的用户体验**
   - 实时显示每个文件的上传进度
   - 可以看到多个文件同时在上传
   - 失败重试对用户透明

## 实际使用时的修改点

### 1. 替换模拟上传为真实API

```typescript
// 在 uploadChunk 函数中，替换这部分：
await new Promise((resolve, reject) => {
  // 模拟代码...
})

// 替换为：
await axios.post('/api/upload/chunk', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  signal: controller.signal,
  timeout: 60000
})
```

### 2. 替换模拟合并为真实API

```typescript
// 在 mergeFileChunks 函数中，替换这部分：
await new Promise(resolve => setTimeout(resolve, 100))

// 替换为：
await axios.post('/api/upload/merge', {
  fileName: state.fileNode.name,
  hash: state.hash,
  total: state.totalChunks,
  relativePath: state.fileNode.path
})
```

### 3. 调整失败率（移除测试代码）

```typescript
// 移除这行模拟失败的代码：
if (Math.random() < 0.1) {
  reject(new Error('Network error'))
}
```

## 测试建议

1. 测试多个文件同时上传
2. 测试网络中断后的重试
3. 测试暂停和恢复功能
4. 测试大文件切片上传
5. 测试切片失败3次后的处理
