/**
 * 文件上传
 */

import type { UploadConfig } from './types'
import { http } from './request'

/**
 * 上传单个文件
 */
export function uploadFile(
  url: string,
  file: File,
  config?: UploadConfig
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)

  return http.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  })
}

/**
 * 上传多个文件
 */
export function uploadFiles(
  url: string,
  files: File[],
  config?: UploadConfig
): Promise<any> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  return http.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  })
}

/**
 * 上传文件（带额外参数）
 */
export function uploadFileWithData(
  url: string,
  file: File,
  data: Record<string, any>,
  config?: UploadConfig
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)

  // 添加额外参数
  Object.keys(data).forEach(key => {
    formData.append(key, data[key])
  })

  return http.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  })
}

/**
 * Base64 上传
 */
export function uploadBase64(
  url: string,
  base64: string,
  filename: string,
  config?: UploadConfig
): Promise<any> {
  // 将 base64 转换为 Blob
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  const blob = new Blob([u8arr], { type: mime })
  const file = new File([blob], filename, { type: mime })

  return uploadFile(url, file, config)
}

/**
 * 分片上传
 */
export async function uploadChunks(
  url: string,
  file: File,
  chunkSize: number = 2 * 1024 * 1024, // 默认 2MB
  config?: UploadConfig
): Promise<any> {
  const chunks: Blob[] = []
  let start = 0

  // 分片
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size)
    chunks.push(file.slice(start, end))
    start = end
  }

  const totalChunks = chunks.length
  const uploadPromises: Promise<any>[] = []

  // 上传每个分片
  chunks.forEach((chunk, index) => {
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('filename', file.name)
    formData.append('chunkIndex', index.toString())
    formData.append('totalChunks', totalChunks.toString())

    const promise = http.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config,
      onUploadProgress: (progressEvent) => {
        // 计算总进度
        const chunkProgress = progressEvent.loaded / (progressEvent.total || 1)
        const totalProgress = ((index + chunkProgress) / totalChunks) * 100
        
        if (config?.onUploadProgress) {
          config.onUploadProgress({
            ...progressEvent,
            loaded: Math.floor((totalProgress / 100) * file.size),
            total: file.size
          })
        }
      }
    })

    uploadPromises.push(promise)
  })

  // 等待所有分片上传完成
  return Promise.all(uploadPromises)
}

/**
 * 上传文件夹
 */
export function uploadFolder(
  url: string,
  files: File[],
  config?: UploadConfig
): Promise<any> {
  const formData = new FormData()
  
  files.forEach(file => {
    // 保留文件路径信息
    formData.append('files', file, file.webkitRelativePath || file.name)
  })

  return http.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  })
}
