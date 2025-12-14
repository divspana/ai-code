import { ref, computed } from 'vue'
import axios from 'axios'

/**
 * 文件节点接口
 */
export interface FileNode {
  id: string
  name: string
  path: string
  size: number
  file: File
  uploadProgress: number
  uploadStatus: 'pending' | 'uploading' | 'success' | 'exception' | 'paused'
}

/**
 * 切片任务接口
 */
interface ChunkTask {
  fileId: string
  chunkIndex: number
  totalChunks: number
  chunk: Blob
  hash: string
  fileName: string
  fileSize: number
  retryCount: number
}

/**
 * 文件上传状态接口
 */
interface FileUploadState {
  fileNode: FileNode
  totalChunks: number
  uploadedChunks: Set<number>
  failedChunks: Set<number>
  hash: string
  controller: AbortController
}

/**
 * 上传配置接口
 */
export interface UploadConfig {
  chunkSize?: number // 切片大小，默认 2MB
  maxConcurrent?: number // 最大并发数，默认 6
  maxRetries?: number // 最大重试次数，默认 3
  uploadUrl?: string // 上传接口地址
  mergeUrl?: string // 合并接口地址
}

/**
 * 切片上传管理类
 */
export class ChunkUploadManager {
  // 配置
  private chunkSize: number
  private maxConcurrent: number
  private maxRetries: number
  private uploadUrl: string
  private mergeUrl: string

  // 状态
  private isUploading = ref(false)
  private chunkQueue: ChunkTask[] = []
  private fileStates = new Map<string, FileUploadState>()
  private activeChunks = new Set<string>()

  constructor(config: UploadConfig = {}) {
    this.chunkSize = config.chunkSize || 2 * 1024 * 1024
    this.maxConcurrent = config.maxConcurrent || 6
    this.maxRetries = config.maxRetries || 3
    this.uploadUrl = config.uploadUrl || '/api/upload/chunk'
    this.mergeUrl = config.mergeUrl || '/api/upload/merge'
  }

  /**
   * 计算文件哈希值（简化版）
   */
  private async calculateFileHash(file: File): Promise<string> {
    const str = `${file.name}-${file.size}-${file.lastModified}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 创建文件分片
   */
  private createFileChunks(file: File): Blob[] {
    const chunks: Blob[] = []
    let start = 0

    while (start < file.size) {
      const end = Math.min(start + this.chunkSize, file.size)
      chunks.push(file.slice(start, end))
      start = end
    }

    return chunks
  }

  /**
   * 准备文件的切片任务
   */
  private async prepareFileTasks(fileNode: FileNode): Promise<ChunkTask[]> {
    const hash = await this.calculateFileHash(fileNode.file)
    const chunks = this.createFileChunks(fileNode.file)
    const totalChunks = chunks.length

    // 初始化文件上传状态
    const controller = new AbortController()
    this.fileStates.set(fileNode.id, {
      fileNode,
      totalChunks,
      uploadedChunks: new Set(),
      failedChunks: new Set(),
      hash,
      controller
    })

    // 创建切片任务
    return chunks.map((chunk, index) => ({
      fileId: fileNode.id,
      chunkIndex: index,
      totalChunks,
      chunk,
      hash,
      fileName: fileNode.file.name,
      fileSize: fileNode.file.size,
      retryCount: 0
    }))
  }

  /**
   * 上传单个切片
   */
  private async uploadChunk(chunkTask: ChunkTask): Promise<void> {
    const state = this.fileStates.get(chunkTask.fileId)
    if (!state) return

    const formData = new FormData()
    formData.append('chunk', chunkTask.chunk)
    formData.append('index', chunkTask.chunkIndex.toString())
    formData.append('total', chunkTask.totalChunks.toString())
    formData.append('hash', chunkTask.hash)
    formData.append('fileName', chunkTask.fileName)
    formData.append('fileSize', chunkTask.fileSize.toString())
    formData.append('relativePath', state.fileNode.path)

    try {
      // 实际上传请求
      await axios.post(this.uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: state.controller.signal,
        timeout: 60000
      })

      // 切片上传成功
      state.uploadedChunks.add(chunkTask.chunkIndex)
      state.failedChunks.delete(chunkTask.chunkIndex)
      this.updateFileProgress(state)

      // 检查文件是否全部上传完成
      if (state.uploadedChunks.size === state.totalChunks) {
        await this.mergeFileChunks(state)
      }
    } catch (error: unknown) {
      const err = error as Error
      // 处理取消上传
      if (err.name === 'AbortError' || err.message === 'Upload paused') {
        state.fileNode.uploadStatus = 'paused'
        throw error
      }

      // 切片上传失败，进行重试
      chunkTask.retryCount++
      if (chunkTask.retryCount < this.maxRetries) {
        console.log(
          `[ChunkUpload] Chunk ${chunkTask.chunkIndex} of ${chunkTask.fileName} failed, retry ${chunkTask.retryCount}/${this.maxRetries}`
        )
        // 重新加入队列重试
        this.chunkQueue.push(chunkTask)
      } else {
        // 重试达到最大次数后仍失败，标记文件失败
        console.error(
          `[ChunkUpload] Chunk ${chunkTask.chunkIndex} of ${chunkTask.fileName} failed after ${this.maxRetries} retries`
        )
        state.failedChunks.add(chunkTask.chunkIndex)
        state.fileNode.uploadStatus = 'exception'
        throw error
      }
    }
  }

  /**
   * 更新文件上传进度
   */
  private updateFileProgress(state: FileUploadState): void {
    const progress = (state.uploadedChunks.size / state.totalChunks) * 100
    state.fileNode.uploadProgress = Math.round(progress)
  }

  /**
   * 合并文件切片
   */
  private async mergeFileChunks(state: FileUploadState): Promise<void> {
    try {
      await axios.post(this.mergeUrl, {
        fileName: state.fileNode.name,
        hash: state.hash,
        total: state.totalChunks,
        relativePath: state.fileNode.path
      })

      state.fileNode.uploadStatus = 'success'
      state.fileNode.uploadProgress = 100
      console.log(`[ChunkUpload] File ${state.fileNode.name} uploaded successfully`)
    } catch (error) {
      state.fileNode.uploadStatus = 'exception'
      console.error(`[ChunkUpload] Failed to merge chunks for ${state.fileNode.name}:`, error)
      throw error
    }
  }

  /**
   * 处理切片队列（单个工作线程）
   */
  private async processChunkQueue(): Promise<void> {
    while (this.chunkQueue.length > 0 && this.isUploading.value) {
      const chunkTask = this.chunkQueue.shift()
      if (!chunkTask) continue

      const chunkKey = `${chunkTask.fileId}-${chunkTask.chunkIndex}`
      this.activeChunks.add(chunkKey)

      try {
        await this.uploadChunk(chunkTask)
      } catch {
        // 错误已在 uploadChunk 中处理
      } finally {
        this.activeChunks.delete(chunkKey)
      }
    }
  }

  /**
   * 开始上传文件列表
   */
  async upload(fileNodes: FileNode[]): Promise<void> {
    if (fileNodes.length === 0) {
      throw new Error('No files to upload')
    }

    this.isUploading.value = true
    this.chunkQueue = []
    this.fileStates.clear()
    this.activeChunks.clear()

    // 准备所有文件的切片任务
    for (const fileNode of fileNodes) {
      fileNode.uploadStatus = 'uploading'
      fileNode.uploadProgress = 0
      const tasks = await this.prepareFileTasks(fileNode)
      this.chunkQueue.push(...tasks)
    }

    console.log(
      `[ChunkUpload] Starting upload: ${fileNodes.length} files, ${this.chunkQueue.length} chunks`
    )

    // 启动并发上传（以切片为单位）
    const uploadPromises: Promise<void>[] = []
    const concurrency = Math.min(this.maxConcurrent, this.chunkQueue.length)
    for (let i = 0; i < concurrency; i++) {
      uploadPromises.push(this.processChunkQueue())
    }

    await Promise.all(uploadPromises)

    this.isUploading.value = false
    console.log('[ChunkUpload] Upload completed')
  }

  /**
   * 暂停上传
   */
  pause(): void {
    this.isUploading.value = false

    // 取消所有正在上传的切片
    this.fileStates.forEach(state => {
      state.controller.abort()
      if (state.fileNode.uploadStatus === 'uploading') {
        state.fileNode.uploadStatus = 'paused'
      }
    })

    this.activeChunks.clear()
    this.chunkQueue = []

    console.log('[ChunkUpload] Upload paused')
  }

  /**
   * 清理资源
   */
  clear(): void {
    this.pause()
    this.fileStates.clear()
    console.log('[ChunkUpload] Resources cleared')
  }

  /**
   * 获取上传状态
   */
  getUploadingStatus() {
    return {
      isUploading: computed(() => this.isUploading.value),
      activeChunksCount: computed(() => this.activeChunks.size),
      queuedChunksCount: computed(() => this.chunkQueue.length)
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    let totalFiles = 0
    let uploadingFiles = 0
    let successFiles = 0
    let failedFiles = 0

    this.fileStates.forEach(state => {
      totalFiles++
      switch (state.fileNode.uploadStatus) {
        case 'uploading':
          uploadingFiles++
          break
        case 'success':
          successFiles++
          break
        case 'exception':
          failedFiles++
          break
      }
    })

    return {
      totalFiles,
      uploadingFiles,
      successFiles,
      failedFiles
    }
  }
}

/**
 * 使用切片上传的 Composable
 */
export function useChunkUpload(config?: UploadConfig) {
  const manager = new ChunkUploadManager(config)

  return {
    upload: (files: FileNode[]) => manager.upload(files),
    pause: () => manager.pause(),
    clear: () => manager.clear(),
    ...manager.getUploadingStatus(),
    getStatistics: () => manager.getStatistics()
  }
}
