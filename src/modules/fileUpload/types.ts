/**
 * 文件上传模块类型定义
 */

export interface FileItem {
  id: string
  name: string
  size: number
  type: string
  path: string
  uploadTime: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  url?: string
  file?: File
}

export interface UploadConfig {
  maxSize: number
  maxFiles: number
  autoUpload: boolean
  multiple: boolean
  acceptTypes: string
}

export interface Statistics {
  total: number
  totalSize: string
  success: number
  uploading: number
  error: number
  types: {
    image: number
    video: number
    audio: number
    document: number
    other: number
  }
}

export type FileType = 'all' | 'image' | 'video' | 'audio' | 'document' | 'other'
export type ViewMode = 'list' | 'grid'
