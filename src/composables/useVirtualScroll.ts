import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface VirtualScrollOptions {
  itemHeight: number // 每行高度
  bufferSize?: number // 缓冲区大小（额外渲染的行数）
  containerHeight?: number // 容器高度
}

export interface VirtualScrollReturn {
  visibleData: Ref<any[]>
  containerStyle: Ref<{ height: string }>
  contentStyle: Ref<{ height: string; transform: string }>
  scrollTop: Ref<number>
  handleScroll: (event: Event) => void
  scrollToIndex: (index: number) => void
  setData: (data: any[]) => void
}

/**
 * 虚拟滚动 Composable - 支持大数据量渲染
 */
export function useVirtualScroll(options: VirtualScrollOptions): VirtualScrollReturn {
  const { itemHeight, bufferSize = 30, containerHeight = 600 } = options

  const scrollTop = ref(0)
  const allData = ref<any[]>([])

  // 计算可见区域的起始和结束索引
  const startIndex = computed(() => {
    if (allData.value.length === 0) return 0
    
    // 计算起始索引，减去缓冲区
    const index = Math.floor(scrollTop.value / itemHeight) - bufferSize
    return Math.max(0, Math.min(index, allData.value.length - 1))
  })

  const endIndex = computed(() => {
    if (allData.value.length === 0) return 0
    
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    // 增加缓冲区大小，前后各多渲染 bufferSize 行
    const index = startIndex.value + visibleCount + bufferSize * 2
    return Math.max(startIndex.value + 1, Math.min(allData.value.length, index))
  })

  // 实际渲染的数据量
  const renderCount = computed(() => endIndex.value - startIndex.value)

  // 可见数据
  const visibleData = computed(() => {
    if (allData.value.length === 0) {
      return []
    }

    const start = startIndex.value
    const end = endIndex.value
    
    // 确保索引有效且 start < end
    if (start < 0 || start >= allData.value.length || end <= start || end > allData.value.length) {
      console.warn('虚拟滚动索引异常:', { start, end, dataLength: allData.value.length, scrollTop: scrollTop.value })
      // 返回安全的数据范围
      const safeStart = Math.max(0, Math.min(start, allData.value.length - 1))
      const safeEnd = Math.min(allData.value.length, Math.max(safeStart + 1, end))
      
      return allData.value.slice(safeStart, safeEnd).map((item, index) => ({
        ...item,
        _virtualIndex: safeStart + index
      }))
    }

    return allData.value.slice(start, end).map((item, index) => ({
      ...item,
      _virtualIndex: start + index
    }))
  })

  // 容器样式
  const containerStyle = computed(() => ({
    height: `${containerHeight}px`
  }))

  // 内容样式 - 使用 padding 而不是 transform 来避免空白问题
  const contentStyle = computed(() => {
    const totalHeight = allData.value.length * itemHeight
    const offsetY = startIndex.value * itemHeight
    
    return {
      height: `${totalHeight}px`,
      transform: `translateY(${offsetY}px)`,
      willChange: 'transform'
    }
  })

  // 滚动处理 - 添加边界检查和防抖优化
  let scrollTimer: number | null = null
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    const newScrollTop = target.scrollTop
    
    // 立即更新滚动位置，不使用防抖，确保快速响应
    const maxScrollTop = allData.value.length * itemHeight - containerHeight
    scrollTop.value = Math.max(0, Math.min(newScrollTop, maxScrollTop))
  }

  // 滚动到指定索引
  const scrollToIndex = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, allData.value.length - 1))
    scrollTop.value = safeIndex * itemHeight
  }

  // 设置数据
  const setData = (data: any[]) => {
    const oldLength = allData.value.length
    allData.value = data
    
    // 只在数据长度变化较大或首次加载时重置滚动位置
    if (oldLength === 0 || Math.abs(data.length - oldLength) > oldLength * 0.5) {
      scrollTop.value = 0
    } else {
      // 确保当前滚动位置在有效范围内
      const maxScrollTop = Math.max(0, data.length * itemHeight - containerHeight)
      if (scrollTop.value > maxScrollTop) {
        scrollTop.value = maxScrollTop
      }
    }
  }

  return {
    visibleData,
    containerStyle,
    contentStyle,
    scrollTop,
    handleScroll,
    scrollToIndex,
    setData
  }
}
