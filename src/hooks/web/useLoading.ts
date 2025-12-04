/**
 * 加载状态 Hook
 */

import { ref } from 'vue'
import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

export function useLoading(options = {}) {
  const loading = ref(false)
  let loadingInstance: LoadingInstance | null = null

  const openLoading = (text = '加载中...') => {
    loading.value = true
    loadingInstance = ElLoading.service({
      lock: true,
      text,
      background: 'rgba(0, 0, 0, 0.7)',
      ...options
    })
  }

  const closeLoading = () => {
    loading.value = false
    loadingInstance?.close()
    loadingInstance = null
  }

  return {
    loading,
    openLoading,
    closeLoading
  }
}
