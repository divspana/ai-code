/**
 * Axios 请求封装
 */

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElLoading, type LoadingInstance } from 'element-plus'
import type { RequestConfig } from './types'
import { BASE_URL, REQUEST_TIMEOUT, HTTP_STATUS, BUSINESS_CODE, ERROR_MESSAGE_MAP, WHITE_LIST, RETRY_CONFIG } from './config'
import { getToken, clearTokens } from './token'

class HttpRequest {
  private instance: AxiosInstance
  private loadingInstance: LoadingInstance | null = null
  private requestCount = 0

  constructor() {
    // 创建 axios 实例
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })

    // 设置拦截器
    this.setupInterceptors()
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        return this.handleRequest(config as RequestConfig)
      },
      (error: AxiosError) => {
        return this.handleRequestError(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        return this.handleResponse(response)
      },
      (error: AxiosError) => {
        return this.handleResponseError(error)
      }
    )
  }

  /**
   * 处理请求
   */
  private handleRequest(config: RequestConfig): InternalAxiosRequestConfig {
    // 显示加载提示
    if (config.showLoading !== false) {
      this.showLoading()
    }

    // 添加 Token
    const needToken = config.needToken !== false
    const isWhiteList = WHITE_LIST.some(url => config.url?.includes(url))
    
    if (needToken && !isWhiteList) {
      const token = getToken()
      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // 添加时间戳（防止缓存）
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }

    return config as InternalAxiosRequestConfig
  }

  /**
   * 处理请求错误
   */
  private handleRequestError(error: AxiosError): Promise<never> {
    this.hideLoading()
    ElMessage.error('请求发送失败')
    return Promise.reject(error)
  }

  /**
   * 处理响应
   */
  private handleResponse(response: any): any {
    this.hideLoading()

    const { data, config } = response
    const requestConfig = config as RequestConfig

    // 如果是文件流，直接返回
    if (response.config.responseType === 'blob') {
      return response
    }

    // 处理业务状态码
    if (data.code === BUSINESS_CODE.SUCCESS) {
      return data.data
    }

    // Token 过期
    if (data.code === BUSINESS_CODE.TOKEN_EXPIRED) {
      this.handleTokenExpired()
      return Promise.reject(new Error('Token 已过期'))
    }

    // 无权限
    if (data.code === BUSINESS_CODE.NO_PERMISSION) {
      if (requestConfig.showError !== false) {
        ElMessage.error('无权限访问')
      }
      return Promise.reject(new Error('无权限'))
    }

    // 其他业务错误
    if (requestConfig.showError !== false) {
      ElMessage.error(data.message || '请求失败')
    }

    return Promise.reject(data)
  }

  /**
   * 处理响应错误
   */
  private async handleResponseError(error: AxiosError): Promise<never> {
    this.hideLoading()

    const { response, config } = error
    const requestConfig = config as RequestConfig

    // 网络错误
    if (!response) {
      if (requestConfig?.showError !== false) {
        ElMessage.error('网络连接失败，请检查网络')
      }
      return Promise.reject(error)
    }

    const { status } = response

    // 处理 HTTP 状态码
    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        this.handleTokenExpired()
        break
      case HTTP_STATUS.FORBIDDEN:
        ElMessage.error('没有权限访问')
        break
      case HTTP_STATUS.NOT_FOUND:
        ElMessage.error('请求的资源不存在')
        break
      case HTTP_STATUS.REQUEST_TIMEOUT:
        ElMessage.error('请求超时')
        break
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
      case HTTP_STATUS.GATEWAY_TIMEOUT:
        ElMessage.error('服务器错误，请稍后重试')
        break
      default:
        if (requestConfig?.showError !== false) {
          const message = ERROR_MESSAGE_MAP[status] || '请求失败'
          ElMessage.error(message)
        }
    }

    // 自定义错误处理
    if (requestConfig?.customErrorHandler) {
      requestConfig.customErrorHandler(error)
    }

    // 请求重试
    if (requestConfig?.retryCount && requestConfig.retryCount > 0) {
      return this.retryRequest(error)
    }

    return Promise.reject(error)
  }

  /**
   * 处理 Token 过期
   */
  private handleTokenExpired(): void {
    clearTokens()
    ElMessage.warning('登录已过期，请重新登录')
    
    // 跳转到登录页
    // 这里可以使用 router.push('/login')
    // 或者触发一个全局事件
    window.location.href = '/login'
  }

  /**
   * 请求重试
   */
  private async retryRequest(error: AxiosError): Promise<never> {
    const config = error.config as RequestConfig
    
    if (!config || !config.retryCount) {
      return Promise.reject(error)
    }

    config.retryCount -= 1

    const delay = config.retryDelay || RETRY_CONFIG.delay
    await new Promise(resolve => setTimeout(resolve, delay))

    return this.instance.request(config)
  }

  /**
   * 显示加载提示
   */
  private showLoading(): void {
    if (this.requestCount === 0) {
      this.loadingInstance = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
    }
    this.requestCount++
  }

  /**
   * 隐藏加载提示
   */
  private hideLoading(): void {
    this.requestCount--
    if (this.requestCount <= 0) {
      this.requestCount = 0
      this.loadingInstance?.close()
      this.loadingInstance = null
    }
  }

  /**
   * GET 请求
   */
  get<T = any>(url: string, params?: any, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, { params, ...config })
  }

  /**
   * POST 请求
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  /**
   * PUT 请求
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  /**
   * DELETE 请求
   */
  delete<T = any>(url: string, params?: any, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, { params, ...config })
  }

  /**
   * PATCH 请求
   */
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.patch(url, data, config)
  }

  /**
   * 获取 axios 实例
   */
  getInstance(): AxiosInstance {
    return this.instance
  }
}

// 创建实例
const httpRequest = new HttpRequest()

// 导出请求方法
export const http = {
  get: httpRequest.get.bind(httpRequest),
  post: httpRequest.post.bind(httpRequest),
  put: httpRequest.put.bind(httpRequest),
  delete: httpRequest.delete.bind(httpRequest),
  patch: httpRequest.patch.bind(httpRequest),
  getInstance: httpRequest.getInstance.bind(httpRequest)
}

export default http
