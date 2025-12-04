/**
 * 文件验证函数
 */

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 验证文件数量
 */
export function validateFileCount(currentCount: number, maxCount: number): boolean {
  return currentCount < maxCount
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File, acceptTypes: string): boolean {
  if (acceptTypes === '*') return true
  
  const types = acceptTypes.split(',').map(t => t.trim())
  return types.some(type => {
    if (type.endsWith('/*')) {
      const category = type.slice(0, -2)
      return file.type.startsWith(category + '/')
    }
    return file.type === type || file.name.endsWith(type)
  })
}
