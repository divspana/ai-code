import axios, { type AxiosProgressEvent } from 'axios'

export interface UploadOptions {
  file: File
  chunkSize?: number
  onProgress?: (progress: number) => void
  signal?: AbortSignal
  metadata?: Record<string, unknown>
}

export interface ChunkInfo {
  chunk: Blob
  index: number
  total: number
  hash: string
  fileName: string
  fileSize: number
}

/**
 * 计算文件哈希值（简化版，使用文件名和大小）
 */
const calculateFileHash = async (file: File): Promise<string> => {
  // 简化版：使用文件名、大小和修改时间生成哈希
  // 生产环境建议使用 spark-md5 或 crypto-js 计算真实的文件哈希
  const str = `${file.name}-${file.size}-${file.lastModified}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * 将文件分片
 */
const createFileChunks = (file: File, chunkSize: number): Blob[] => {
  const chunks: Blob[] = []
  let start = 0

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size)
    chunks.push(file.slice(start, end))
    start = end
  }

  return chunks
}

/**
 * 上传单个分片
 */
const uploadChunk = async (chunkInfo: ChunkInfo, signal?: AbortSignal): Promise<void> => {
  const formData = new FormData()
  formData.append('chunk', chunkInfo.chunk)
  formData.append('index', chunkInfo.index.toString())
  formData.append('total', chunkInfo.total.toString())
  formData.append('hash', chunkInfo.hash)
  formData.append('fileName', chunkInfo.fileName)
  formData.append('fileSize', chunkInfo.fileSize.toString())

  try {
    await axios.post('/api/upload/chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      signal,
      timeout: 60000 // 60秒超时
    })
  } catch (error) {
    if (axios.isCancel(error) || (error as Error).name === 'AbortError') {
      throw new Error('Upload paused')
    }
    throw error
  }
}

/**
 * 合并分片
 */
const mergeChunks = async (
  fileName: string,
  hash: string,
  total: number,
  metadata?: Record<string, unknown>,
  signal?: AbortSignal
): Promise<void> => {
  try {
    await axios.post(
      '/api/upload/merge',
      {
        fileName,
        hash,
        total,
        metadata
      },
      {
        signal,
        timeout: 120000 // 120秒超时
      }
    )
  } catch (error) {
    if (axios.isCancel(error) || (error as Error).name === 'AbortError') {
      throw new Error('Upload paused')
    }
    throw error
  }
}

/**
 * 检查文件是否已上传（秒传功能）
 */
const checkFileExists = async (
  hash: string,
  fileName: string
): Promise<{ exists: boolean; uploadedChunks?: number[] }> => {
  try {
    const response = await axios.get('/api/upload/check', {
      params: { hash, fileName }
    })
    return response.data
  } catch (error) {
    console.error('Check file exists error:', error)
    return { exists: false }
  }
}

/**
 * 上传文件（支持分片上传）
 */
export const uploadFileWithChunks = async (options: UploadOptions): Promise<void> => {
  const {
    file,
    chunkSize = 2 * 1024 * 1024, // 默认2MB
    onProgress,
    signal,
    metadata
  } = options

  // 计算文件哈希
  const hash = await calculateFileHash(file)

  // 检查文件是否已存在（秒传）
  const checkResult = await checkFileExists(hash, file.name)
  if (checkResult.exists) {
    onProgress?.(1)
    return
  }

  // 创建分片
  const chunks = createFileChunks(file, chunkSize)
  const total = chunks.length

  // 已上传的分片索引
  const uploadedChunks = new Set(checkResult.uploadedChunks || [])

  // 需要上传的分片
  const chunksToUpload = chunks
    .map((chunk, index) => ({ chunk, index }))
    .filter(item => !uploadedChunks.has(item.index))

  // 上传分片
  let uploadedCount = uploadedChunks.size

  for (const { chunk, index } of chunksToUpload) {
    // 检查是否被取消
    if (signal?.aborted) {
      throw new Error('Upload paused')
    }

    const chunkInfo: ChunkInfo = {
      chunk,
      index,
      total,
      hash,
      fileName: file.name,
      fileSize: file.size
    }

    await uploadChunk(chunkInfo, signal)

    uploadedCount++
    onProgress?.(uploadedCount / total)
  }

  // 合并分片
  await mergeChunks(file.name, hash, total, metadata, signal)

  // 完成
  onProgress?.(1)
}

/**
 * 批量上传文件（带并发控制）
 */
export const uploadFilesWithConcurrency = async (
  files: File[],
  options: {
    maxConcurrent?: number
    chunkSize?: number
    onFileProgress?: (file: File, progress: number) => void
    onFileComplete?: (file: File) => void
    onFileError?: (file: File, error: Error) => void
    signal?: AbortSignal
  }
): Promise<void> => {
  const {
    maxConcurrent = 6,
    chunkSize,
    onFileProgress,
    onFileComplete,
    onFileError,
    signal
  } = options

  const queue = [...files]
  const activeUploads: Promise<void>[] = []

  const uploadNext = async (): Promise<void> => {
    while (queue.length > 0) {
      if (signal?.aborted) {
        throw new Error('Upload cancelled')
      }

      const file = queue.shift()
      if (!file) break

      try {
        await uploadFileWithChunks({
          file,
          chunkSize,
          onProgress: progress => {
            onFileProgress?.(file, progress)
          },
          signal
        })
        onFileComplete?.(file)
      } catch (error) {
        onFileError?.(file, error as Error)
      }
    }
  }

  // 启动并发上传
  for (let i = 0; i < Math.min(maxConcurrent, files.length); i++) {
    activeUploads.push(uploadNext())
  }

  await Promise.all(activeUploads)
}

/**
 * 简单的单文件上传（不分片）
 */
export const uploadSingleFile = async (
  file: File,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<unknown> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post('/api/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
      if (progressEvent.total) {
        const progress = progressEvent.loaded / progressEvent.total
        onProgress?.(progress)
      }
    },
    signal
  })

  return response.data
}
