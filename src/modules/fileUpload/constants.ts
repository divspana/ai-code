/**
 * 文件上传模块常量定义
 */

// 文档类型 MIME
export const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
] as const

// 默认上传配置
export const DEFAULT_UPLOAD_CONFIG = {
  maxSize: 100, // MB
  maxFiles: 50,
  autoUpload: true,
  multiple: true,
  acceptTypes: '*'
} as const

// 文件大小单位
export const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
