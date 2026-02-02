/**
 * 交互模式管理 Hook
 * 负责管理和协调不同的交互模式（矩形框选、多边形框选、拖拽）
 */

import { ref } from 'vue'
import type { InteractionMode } from '../types'

export function useInteractionMode(initialMode: InteractionMode = 'select') {
  // 当前交互模式
  const mode = ref<InteractionMode>(initialMode)

  /**
   * 设置交互模式
   */
  const setMode = (newMode: InteractionMode) => {
    mode.value = newMode
  }

  /**
   * 是否是矩形框选模式
   */
  const isSelectMode = () => mode.value === 'select'

  /**
   * 是否是多边形框选模式
   */
  const isPolygonMode = () => mode.value === 'polygon'

  /**
   * 是否是拖拽模式
   */
  const isPanMode = () => mode.value === 'pan'

  /**
   * 获取鼠标样式
   */
  const getCursorStyle = (isOverLabel: boolean = false): string => {
    if (isOverLabel) return 'move'

    switch (mode.value) {
      case 'select':
        return 'crosshair'
      case 'polygon':
        return 'crosshair'
      case 'pan':
        return 'grab'
      default:
        return 'default'
    }
  }

  return {
    // 状态
    mode,

    // 方法
    setMode,
    isSelectMode,
    isPolygonMode,
    isPanMode,
    getCursorStyle
  }
}
