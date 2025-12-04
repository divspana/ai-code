/**
 * HTTP 配置
 */

// API 基础路径
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 30000

// Token 存储 key
export const TOKEN_KEY = 'access_token'

// Refresh Token 存储 key
export const REFRESH_TOKEN_KEY = 'refresh_token'

// 响应状态码
export const HTTP_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const

// 业务状态码
export const BUSINESS_CODE = {
  SUCCESS: 0,
  ERROR: -1,
  TOKEN_EXPIRED: 401,
  NO_PERMISSION: 403
} as const

// 错误消息映射
export const ERROR_MESSAGE_MAP: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求的资源不存在',
  408: '请求超时',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时'
}

// 请求重试配置
export const RETRY_CONFIG = {
  count: 3,
  delay: 1000
}

// 白名单：不需要 token 的接口
export const WHITE_LIST = ['/login', '/register', '/refresh-token']
