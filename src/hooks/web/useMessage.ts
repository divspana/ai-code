/**
 * 消息提示 Hook
 */

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { MessageOptions, NotificationOptions } from 'element-plus'

export function useMessage() {
  return {
    success: (message: string, options?: MessageOptions) => {
      return ElMessage.success({ message, ...options })
    },
    error: (message: string, options?: MessageOptions) => {
      return ElMessage.error({ message, ...options })
    },
    warning: (message: string, options?: MessageOptions) => {
      return ElMessage.warning({ message, ...options })
    },
    info: (message: string, options?: MessageOptions) => {
      return ElMessage.info({ message, ...options })
    },
    confirm: (message: string, title = '提示') => {
      return ElMessageBox.confirm(message, title, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    },
    notify: (options: NotificationOptions) => {
      return ElNotification(options)
    }
  }
}
