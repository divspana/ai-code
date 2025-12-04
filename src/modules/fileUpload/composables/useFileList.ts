/**
 * 文件列表管理 Composable
 */

import { ref, computed } from 'vue'
import type { FileItem, FileType } from '../types'
import { formatFileSize } from '../utils/formatFileSize'
import { isDocumentType } from '../utils/fileTypeHelper'

export function useFileList() {
  const fileList = ref<FileItem[]>([])
  const filterType = ref<FileType>('all')

  // 过滤后的文件列表
  const filteredFiles = computed(() => {
    if (filterType.value === 'all') return fileList.value

    return fileList.value.filter(file => {
      switch (filterType.value) {
        case 'image':
          return file.type.startsWith('image/')
        case 'video':
          return file.type.startsWith('video/')
        case 'audio':
          return file.type.startsWith('audio/')
        case 'document':
          return isDocumentType(file.type)
        case 'other':
          return !file.type.startsWith('image/') &&
                 !file.type.startsWith('video/') &&
                 !file.type.startsWith('audio/') &&
                 !isDocumentType(file.type)
        default:
          return true
      }
    })
  })

  // 统计信息
  const statistics = computed(() => {
    const total = fileList.value.length
    const totalSize = fileList.value.reduce((sum, file) => sum + file.size, 0)
    const success = fileList.value.filter(f => f.status === 'success').length
    const uploading = fileList.value.filter(f => f.status === 'uploading').length
    const error = fileList.value.filter(f => f.status === 'error').length

    return {
      total,
      totalSize: formatFileSize(totalSize),
      success,
      uploading,
      error,
      types: {
        image: fileList.value.filter(f => f.type.startsWith('image/')).length,
        video: fileList.value.filter(f => f.type.startsWith('video/')).length,
        audio: fileList.value.filter(f => f.type.startsWith('audio/')).length,
        document: fileList.value.filter(f => isDocumentType(f.type)).length,
        other: fileList.value.filter(f =>
          !f.type.startsWith('image/') &&
          !f.type.startsWith('video/') &&
          !f.type.startsWith('audio/') &&
          !isDocumentType(f.type)
        ).length
      }
    }
  })

  // 添加文件
  const addFile = (file: FileItem) => {
    fileList.value.push(file)
  }

  // 删除文件
  const removeFile = (id: string) => {
    const index = fileList.value.findIndex(f => f.id === id)
    if (index > -1) {
      const file = fileList.value[index]
      // 释放 URL
      if (file?.url) {
        URL.revokeObjectURL(file.url)
      }
      fileList.value.splice(index, 1)
    }
  }

  // 更新文件
  const updateFile = (id: string, updates: Partial<FileItem>) => {
    const file = fileList.value.find(f => f.id === id)
    if (file) {
      Object.assign(file, updates)
    }
  }

  // 清空所有文件
  const clearAll = () => {
    // 释放所有 URL
    fileList.value.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    })
    fileList.value = []
  }

  return {
    fileList,
    filterType,
    filteredFiles,
    statistics,
    addFile,
    removeFile,
    updateFile,
    clearAll
  }
}
