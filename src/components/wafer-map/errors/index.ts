/**
 * Wafer Map 错误类定义
 */

export class WaferMapError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'WaferMapError'

    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack
    }
  }
}

/**
 * 配置验证错误
 */
export class ConfigValidationError extends WaferMapError {
  constructor(field: string, value: unknown, reason?: string) {
    const message = reason
      ? `Invalid configuration: ${field} = ${value} (${reason})`
      : `Invalid configuration: ${field} = ${value}`

    super(message, 'CONFIG_VALIDATION_ERROR', { field, value, reason })
    this.name = 'ConfigValidationError'
  }
}

/**
 * 渲染错误
 */
export class RenderError extends WaferMapError {
  constructor(layer: string, cause?: Error) {
    super(`Failed to render layer: ${layer}`, 'RENDER_ERROR', { layer, cause: cause?.message })
    this.name = 'RenderError'
  }
}

/**
 * 数据处理错误
 */
export class DataProcessingError extends WaferMapError {
  constructor(operation: string, cause?: Error) {
    super(`Data processing failed: ${operation}`, 'DATA_PROCESSING_ERROR', {
      operation,
      cause: cause?.message
    })
    this.name = 'DataProcessingError'
  }
}

/**
 * Canvas 初始化错误
 */
export class CanvasInitError extends WaferMapError {
  constructor(reason: string) {
    super(`Failed to initialize canvas: ${reason}`, 'CANVAS_INIT_ERROR', { reason })
    this.name = 'CanvasInitError'
  }
}
