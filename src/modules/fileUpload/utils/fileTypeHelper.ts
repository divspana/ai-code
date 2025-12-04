/**
 * 文件类型辅助函数
 */

import { 
  Picture, 
  VideoCamera, 
  Headset, 
  Document, 
  Files 
} from '@element-plus/icons-vue'
import { DOCUMENT_TYPES } from '../constants'
import type { Component } from 'vue'

/**
 * 判断是否为文档类型
 */
export function isDocumentType(mimeType: string): boolean {
  return DOCUMENT_TYPES.includes(mimeType as any)
}

/**
 * 获取文件类型图标
 */
export function getFileIcon(mimeType: string): Component {
  if (mimeType.startsWith('image/')) return Picture
  if (mimeType.startsWith('video/')) return VideoCamera
  if (mimeType.startsWith('audio/')) return Headset
  if (isDocumentType(mimeType)) return Document
  return Files
}

/**
 * 获取文件类型颜色
 */
export function getFileTypeColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '#67C23A'
  if (mimeType.startsWith('video/')) return '#E6A23C'
  if (mimeType.startsWith('audio/')) return '#409EFF'
  if (isDocumentType(mimeType)) return '#F56C6C'
  return '#909399'
}
