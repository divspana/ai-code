/**
 * 文件上传逻辑 Composable
 */

import { ElMessage } from 'element-plus'
import type { FileItem } from '../types'
import { validateFileSize, validateFileCount } from '../utils/validateFile'

export function useFileUpload() {
  /**
   * 模拟文件上传
   */
  const simulateUpload = (fileItem: FileItem, onProgress: (file: FileItem) => void) => {
    const interval = setInterval(() => {
      fileItem.progress += Math.random() * 30

      if (fileItem.progress >= 100) {
        fileItem.progress = 100
        fileItem.status = 'success'

        // 创建预览 URL
        if (fileItem.file) {
          fileItem.url = URL.createObjectURL(fileItem.file)
        }

        clearInterval(interval)
        ElMessage.success(`${fileItem.name} 上传成功`)
      }

      onProgress(fileItem)
    }, 500)

    return interval
  }

  /**
   * 验证文件
   */
  const validateFile = (
    file: File,
    maxSizeMB: number,
    currentCount: number,
    maxCount: number
  ): { valid: boolean; message?: string } => {
    if (!validateFileSize(file, maxSizeMB)) {
      return {
        valid: false,
        message: `文件大小不能超过 ${maxSizeMB}MB`
      }
    }

    if (!validateFileCount(currentCount, maxCount)) {
      return {
        valid: false,
        message: `最多只能上传 ${maxCount} 个文件`
      }
    }

    return { valid: true }
  }

  /**
   * 创建文件项
   */
  const createFileItem = (file: File): FileItem => {
    return {
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      path: file.name,
      uploadTime: new Date().toISOString(),
      status: 'uploading',
      progress: 0,
      file: file
    }
  }

  return {
    simulateUpload,
    validateFile,
    createFileItem
  }
}
