/**
 * 图表可见性检测 Hook
 * 使用 IntersectionObserver 监听元素是否在可见区域
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'

export interface UseChartVisibilityOptions {
  containerRef: Ref<HTMLElement | undefined>
  enabled?: boolean
  rootMargin?: string
  threshold?: number
  onVisible?: (visible: boolean) => void
}

export function useChartVisibility(options: UseChartVisibilityOptions) {
  const {
    containerRef,
    enabled = true,
    rootMargin = '50px',
    threshold = 0.1,
    onVisible
  } = options

  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  /**
   * 初始化 IntersectionObserver
   */
  const initObserver = () => {
    if (!enabled || !containerRef.value) return

    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const visible = entry.isIntersecting
          isVisible.value = visible
          
          if (onVisible) {
            onVisible(visible)
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(containerRef.value)
  }

  /**
   * 销毁 Observer
   */
  const destroyObserver = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  /**
   * 手动设置可见性
   */
  const setVisible = (visible: boolean) => {
    isVisible.value = visible
  }

  onMounted(() => {
    if (enabled) {
      initObserver()
    } else {
      // 如果禁用懒加载，直接设置为可见
      isVisible.value = true
    }
  })

  onBeforeUnmount(() => {
    destroyObserver()
  })

  return {
    isVisible,
    setVisible,
    initObserver,
    destroyObserver
  }
}
