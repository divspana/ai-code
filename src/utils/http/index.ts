/**
 * HTTP 工具导出
 */

// 导出请求实例
export { http, default } from './request'

// 导出类型
export type {
  ResponseData,
  RequestConfig,
  UploadConfig,
  DownloadConfig,
  CancelToken
} from './types'

// 导出配置
export {
  BASE_URL,
  REQUEST_TIMEOUT,
  HTTP_STATUS,
  BUSINESS_CODE,
  ERROR_MESSAGE_MAP
} from './config'

// 导出 Token 管理
export {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  clearTokens,
  hasToken
} from './token'

// 导出上传方法
export {
  uploadFile,
  uploadFiles,
  uploadFileWithData,
  uploadBase64,
  uploadChunks,
  uploadFolder
} from './upload'

// 导出下载方法
export {
  downloadFile,
  downloadFileByPost,
  exportFile,
  downloadMultipleFiles,
  downloadBase64,
  previewFile,
  getFileStream
} from './download'
