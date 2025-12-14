/**
 * useChunkUpload 使用示例
 */

import { useChunkUpload, type FileNode } from './useChunkUpload'

// ============================================
// 示例 1: 基础使用
// ============================================
export function example1() {
  // 创建上传管理器
  const uploader = useChunkUpload({
    chunkSize: 2 * 1024 * 1024, // 2MB
    maxConcurrent: 6, // 最大并发数
    maxRetries: 3, // 最大重试次数
    uploadUrl: '/api/upload/chunk',
    mergeUrl: '/api/upload/merge'
  })

  // 准备文件列表
  const files: FileNode[] = [
    {
      id: '1',
      name: 'file1.pdf',
      path: 'folder/file1.pdf',
      size: 10 * 1024 * 1024, // 10MB
      file: new File([], 'file1.pdf'),
      uploadProgress: 0,
      uploadStatus: 'pending'
    },
    {
      id: '2',
      name: 'file2.jpg',
      path: 'folder/file2.jpg',
      size: 5 * 1024 * 1024, // 5MB
      file: new File([], 'file2.jpg'),
      uploadProgress: 0,
      uploadStatus: 'pending'
    }
  ]

  // 开始上传
  uploader.upload(files).then(() => {
    console.log('所有文件上传完成')
  })

  // 暂停上传
  // uploader.pause()

  // 清理资源
  // uploader.clear()
}

// ============================================
// 示例 2: 在 Vue 组件中使用
// ============================================
export function example2() {
  const uploader = useChunkUpload()

  // 监听上传状态
  console.log('是否正在上传:', uploader.isUploading.value)
  console.log('活跃切片数:', uploader.activeChunksCount.value)
  console.log('队列中的切片数:', uploader.queuedChunksCount.value)

  // 获取统计信息
  const stats = uploader.getStatistics()
  console.log('总文件数:', stats.totalFiles)
  console.log('上传中:', stats.uploadingFiles)
  console.log('成功:', stats.successFiles)
  console.log('失败:', stats.failedFiles)
}

// ============================================
// 示例 3: 完整的 Vue 组件示例
// ============================================
/*
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChunkUpload, type FileNode } from '@/composables/useChunkUpload'

const fileList = ref<FileNode[]>([])
const uploader = useChunkUpload({
  chunkSize: 2 * 1024 * 1024,
  maxConcurrent: 6,
  maxRetries: 3
})

// 计算属性
const stats = computed(() => uploader.getStatistics())

// 选择文件
const handleFileSelect = (files: File[]) => {
  fileList.value = files.map((file, index) => ({
    id: `file-${Date.now()}-${index}`,
    name: file.name,
    path: file.name,
    size: file.size,
    file: file,
    uploadProgress: 0,
    uploadStatus: 'pending'
  }))
}

// 开始上传
const startUpload = async () => {
  try {
    await uploader.upload(fileList.value)
    console.log('上传完成')
  } catch (error) {
    console.error('上传失败:', error)
  }
}

// 暂停上传
const pauseUpload = () => {
  uploader.pause()
}

// 清空列表
const clearFiles = () => {
  uploader.clear()
  fileList.value = []
}
</script>

<template>
  <div>
    <input type="file" multiple @change="handleFileSelect" />
    
    <button @click="startUpload" :disabled="uploader.isUploading.value">
      开始上传
    </button>
    
    <button @click="pauseUpload" :disabled="!uploader.isUploading.value">
      暂停上传
    </button>
    
    <button @click="clearFiles">清空列表</button>
    
    <div>
      <p>总文件数: {{ stats.totalFiles }}</p>
      <p>上传中: {{ stats.uploadingFiles }}</p>
      <p>成功: {{ stats.successFiles }}</p>
      <p>失败: {{ stats.failedFiles }}</p>
      <p>活跃切片: {{ uploader.activeChunksCount.value }}</p>
      <p>队列切片: {{ uploader.queuedChunksCount.value }}</p>
    </div>
    
    <ul>
      <li v-for="file in fileList" :key="file.id">
        {{ file.name }} - {{ file.uploadProgress }}% - {{ file.uploadStatus }}
      </li>
    </ul>
  </div>
</template>
*/

// ============================================
// 示例 4: 使用类的方式（不用 Composable）
// ============================================
import { ChunkUploadManager } from './useChunkUpload'

export function example4() {
  // 直接创建管理器实例
  const manager = new ChunkUploadManager({
    chunkSize: 5 * 1024 * 1024, // 5MB
    maxConcurrent: 10,
    maxRetries: 5
  })

  const files: FileNode[] = [
    /* ... */
  ]

  // 上传
  manager.upload(files)

  // 暂停
  manager.pause()

  // 清理
  manager.clear()

  // 获取状态
  const status = manager.getUploadingStatus()
  console.log(status.isUploading.value)

  // 获取统计
  const stats = manager.getStatistics()
  console.log(stats)
}

// ============================================
// 示例 5: 自定义上传和合并接口
// ============================================
export function example5() {
  // 自定义上传和合并接口
  useChunkUpload({
    uploadUrl: 'https://api.example.com/upload/chunk',
    mergeUrl: 'https://api.example.com/upload/merge'
  })

  // 使用方式相同
}

// ============================================
// 工作原理说明
// ============================================
/*
1. 文件准备阶段:
   - 3个文件 → 计算哈希 → 切片
   - 文件A: 10MB → 5个切片 (2MB each)
   - 文件B: 6MB  → 3个切片
   - 文件C: 4MB  → 2个切片
   - 总共: 10个切片任务

2. 上传阶段:
   - 启动6个并发工作线程
   - 每个线程从队列取切片上传
   - 切片失败自动重试（最多3次）
   - 文件所有切片完成后自动合并

3. 状态管理:
   - 实时更新每个文件的上传进度
   - 追踪已上传和失败的切片
   - 提供统计信息

4. 错误处理:
   - 切片失败重试3次
   - 3次失败后标记文件失败
   - 不影响其他文件上传
*/
