/**
 * HTTP 请求相关类型定义
 */

import type { AxiosRequestConfig, AxiosProgressEvent } from 'axios'

// 响应数据结构
export interface ResponseData<T = any> {
  code: number
  data: T
  message: string
  success: boolean
  timestamp?: number
}

// 请求配置扩展
export interface RequestConfig extends AxiosRequestConfig {
  // 是否显示加载提示
  showLoading?: boolean
  // 是否显示错误提示
  showError?: boolean
  // 是否需要 token
  needToken?: boolean
  // 自定义错误处理
  customErrorHandler?: (error: any) => void
  // 重试次数
  retryCount?: number
  // 重试延迟（毫秒）
  retryDelay?: number
}

// 文件上传配置
export interface UploadConfig extends Omit<RequestConfig, 'onUploadProgress'> {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
}

// 文件下载配置
export interface DownloadConfig extends Omit<RequestConfig, 'onDownloadProgress'> {
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void
  filename?: string
}

// 请求取消器
export interface CancelToken {
  promise: Promise<any>
  reason?: string
}
