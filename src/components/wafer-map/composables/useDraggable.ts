/**
 * 可拖拽功能 Composable
 * 提供通用的拖拽逻辑，可用于任何需要拖拽的元素
 */

import { ref, type Ref } from 'vue'

export interface DraggableItem {
  x: number
  y: number
  [key: string]: unknown
}

export interface DraggableOptions {
  /**
   * 拖拽开始回调
   */
  onDragStart?: (index: number, item: DraggableItem) => void

  /**
   * 拖拽中回调
   */
  onDragMove?: (index: number, item: DraggableItem, deltaX: number, deltaY: number) => void

  /**
   * 拖拽结束回调
   */
  onDragEnd?: (index: number, item: DraggableItem) => void

  /**
   * 是否启用拖拽
   */
  enabled?: boolean

  /**
   * 拖拽边界限制
   */
  bounds?: {
    minX?: number
    maxX?: number
    minY?: number
    maxY?: number
  }
}

export function useDraggable<T extends DraggableItem>(
  items: Ref<T[]>,
  options: DraggableOptions = {}
) {
  const draggingIndex = ref<number | null>(null)
  const dragOffset = ref({ x: 0, y: 0 })
  const isDragging = ref(false)

  /**
   * 开始拖拽
   */
  const onDragStart = (event: MouseEvent, index: number) => {
    if (options.enabled === false) return

    event.stopPropagation()
    event.preventDefault()

    const item = items.value[index]
    if (!item) return

    draggingIndex.value = index
    isDragging.value = true

    // 记录鼠标相对于元素的偏移
    dragOffset.value = {
      x: event.clientX - item.x,
      y: event.clientY - item.y
    }

    // 添加全局事件监听
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)

    // 触发回调
    options.onDragStart?.(index, item)
  }

  /**
   * 拖拽移动
   */
  const onDragMove = (event: MouseEvent) => {
    if (draggingIndex.value === null || !isDragging.value) return

    const item = items.value[draggingIndex.value]
    if (!item) return

    // 计算新位置
    let newX = event.clientX - dragOffset.value.x
    let newY = event.clientY - dragOffset.value.y

    // 应用边界限制
    if (options.bounds) {
      if (options.bounds.minX !== undefined) {
        newX = Math.max(options.bounds.minX, newX)
      }
      if (options.bounds.maxX !== undefined) {
        newX = Math.min(options.bounds.maxX, newX)
      }
      if (options.bounds.minY !== undefined) {
        newY = Math.max(options.bounds.minY, newY)
      }
      if (options.bounds.maxY !== undefined) {
        newY = Math.min(options.bounds.maxY, newY)
      }
    }

    // 计算位移
    const deltaX = newX - item.x
    const deltaY = newY - item.y

    // 更新位置
    item.x = newX
    item.y = newY

    // 触发回调
    options.onDragMove?.(draggingIndex.value, item, deltaX, deltaY)
  }

  /**
   * 结束拖拽
   */
  const onDragEnd = () => {
    if (draggingIndex.value === null) return

    const item = items.value[draggingIndex.value]
    const index = draggingIndex.value

    // 移除全局事件监听
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)

    // 触发回调
    if (item) {
      options.onDragEnd?.(index, item)
    }

    // 重置状态
    draggingIndex.value = null
    isDragging.value = false
  }

  /**
   * 手动清理
   */
  const cleanup = () => {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    draggingIndex.value = null
    isDragging.value = false
  }

  return {
    draggingIndex,
    isDragging,
    onDragStart,
    cleanup
  }
}
