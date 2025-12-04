/**
 * 文件下载
 */

import type { DownloadConfig } from './types'
import { http } from './request'

/**
 * 下载文件
 */
export function downloadFile(
  url: string,
  filename?: string,
  config?: DownloadConfig
): Promise<void> {
  return http.getInstance().get(url, {
    responseType: 'blob',
    ...config
  }).then(response => {
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    
    // 从响应头获取文件名或使用传入的文件名
    const contentDisposition = response.headers['content-disposition']
    let downloadFilename = filename
    
    if (!downloadFilename && contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        downloadFilename = filenameMatch[1].replace(/['"]/g, '')
        // 解码文件名
        downloadFilename = decodeURIComponent(downloadFilename)
      }
    }
    
    link.download = downloadFilename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  })
}

/**
 * 下载文件（POST 请求）
 */
export function downloadFileByPost(
  url: string,
  data: any,
  filename?: string,
  config?: DownloadConfig
): Promise<void> {
  return http.getInstance().post(url, data, {
    responseType: 'blob',
    ...config
  }).then(response => {
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    
    const contentDisposition = response.headers['content-disposition']
    let downloadFilename = filename
    
    if (!downloadFilename && contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        downloadFilename = filenameMatch[1].replace(/['"]/g, '')
        downloadFilename = decodeURIComponent(downloadFilename)
      }
    }
    
    link.download = downloadFilename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  })
}

/**
 * 导出文件（Excel、PDF 等）
 */
export function exportFile(
  url: string,
  params?: any,
  filename?: string,
  config?: DownloadConfig
): Promise<void> {
  return downloadFile(url, filename, {
    params,
    ...config
  })
}

/**
 * 批量下载文件
 */
export async function downloadMultipleFiles(
  urls: string[],
  filenames?: string[],
  config?: DownloadConfig
): Promise<void> {
  const promises = urls.map((url, index) => {
    const filename = filenames?.[index]
    return downloadFile(url, filename, config)
  })
  
  await Promise.all(promises)
}

/**
 * 下载 Base64 文件
 */
export function downloadBase64(
  base64: string,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  const byteCharacters = atob(base64.split(',')[1] || base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 预览文件（在新窗口打开）
 */
export function previewFile(url: string): void {
  window.open(url, '_blank')
}

/**
 * 获取文件流
 */
export function getFileStream(
  url: string,
  config?: DownloadConfig
): Promise<Blob> {
  return http.getInstance().get(url, {
    responseType: 'blob',
    ...config
  }).then(response => response.data)
}
