/**
 * API 示例
 * 演示如何使用封装的 HTTP 工具
 */

import { http, uploadFile, downloadFile } from '@/utils/http'

// ==================== 基础请求示例 ====================

/**
 * 获取用户列表
 */
export function getUserList(params?: {
  page?: number
  pageSize?: number
  keyword?: string
}) {
  return http.get('/users', params)
}

/**
 * 获取用户详情
 */
export function getUserDetail(id: string) {
  return http.get(`/users/${id}`)
}

/**
 * 创建用户
 */
export function createUser(data: {
  username: string
  email: string
  password: string
}) {
  return http.post('/users', data)
}

/**
 * 更新用户
 */
export function updateUser(id: string, data: Partial<{
  username: string
  email: string
}>) {
  return http.put(`/users/${id}`, data)
}

/**
 * 删除用户
 */
export function deleteUser(id: string) {
  return http.delete(`/users/${id}`)
}

// ==================== 登录相关 ====================

/**
 * 登录
 */
export function login(data: {
  username: string
  password: string
}) {
  return http.post<{
    token: string
    refreshToken: string
    userInfo: any
  }>('/auth/login', data, {
    needToken: false // 登录接口不需要 token
  })
}

/**
 * 登出
 */
export function logout() {
  return http.post('/auth/logout')
}

/**
 * 刷新 Token
 */
export function refreshToken(refreshToken: string) {
  return http.post<{
    token: string
    refreshToken: string
  }>('/auth/refresh-token', { refreshToken }, {
    needToken: false
  })
}

// ==================== 文件上传示例 ====================

/**
 * 上传头像
 */
export function uploadAvatar(file: File, onProgress?: (percent: number) => void) {
  return uploadFile('/upload/avatar', file, {
    onUploadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
      onProgress?.(percent)
    }
  })
}

/**
 * 上传图片
 */
export function uploadImage(file: File) {
  return uploadFile('/upload/image', file)
}

/**
 * 批量上传图片
 */
export function uploadImages(files: File[]) {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  return http.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ==================== 文件下载示例 ====================

/**
 * 下载文件
 */
export function downloadUserData(userId: string) {
  return downloadFile(`/download/user-data/${userId}`, `user-${userId}.xlsx`)
}

/**
 * 导出 Excel
 */
export function exportExcel(params: any) {
  return downloadFile('/export/excel', 'data.xlsx', {
    params,
    showLoading: true
  })
}

// ==================== 高级配置示例 ====================

/**
 * 不显示加载提示的请求
 */
export function getDataSilently() {
  return http.get('/data', {}, {
    showLoading: false
  })
}

/**
 * 不显示错误提示的请求
 */
export function tryGetData() {
  return http.get('/data', {}, {
    showError: false
  })
}

/**
 * 带重试的请求
 */
export function getDataWithRetry() {
  return http.get('/data', {}, {
    retryCount: 3,
    retryDelay: 1000
  })
}

/**
 * 自定义错误处理
 */
export function getDataWithCustomError() {
  return http.get('/data', {}, {
    customErrorHandler: (error) => {
      console.error('Custom error handler:', error)
      // 自定义错误处理逻辑
    }
  })
}
