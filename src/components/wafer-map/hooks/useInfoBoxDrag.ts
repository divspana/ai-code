/**
 * 信息框拖拽 Hook
 * 负责信息框的拖拽交互
 */

import { ref } from 'vue'

export function useInfoBoxDrag() {
  // 正在拖拽的信息框索引
  const draggingIndex = ref<number | null>(null)

  // 拖拽偏移量
  const dragOffset = ref({ x: 0, y: 0 })

  // 悬停的信息框索引
  const hoveredIndex = ref<number | null>(null)

  /**
   * 开始拖拽信息框
   */
  const startDrag = (
    index: number,
    mouseX: number,
    mouseY: number,
    labelX: number,
    labelY: number
  ) => {
    draggingIndex.value = index
    dragOffset.value = {
      x: mouseX - labelX,
      y: mouseY - labelY
    }
  }

  /**
   * 拖拽移动
   */
  const onDrag = (mouseX: number, mouseY: number) => {
    if (draggingIndex.value === null) return null

    return {
      index: draggingIndex.value,
      x: mouseX - dragOffset.value.x,
      y: mouseY - dragOffset.value.y
    }
  }

  /**
   * 结束拖拽
   */
  const endDrag = () => {
    draggingIndex.value = null
  }

  /**
   * 设置悬停索引
   */
  const setHoveredIndex = (index: number | null) => {
    hoveredIndex.value = index
  }

  /**
   * 检测鼠标是否在信息框上
   */
  const getLabelIndexAtPosition = (
    mouseX: number,
    mouseY: number,
    labels: Array<{ labelX: number; labelY: number }>,
    labelWidth: number,
    labelHeight: number
  ): number => {
    for (let i = labels.length - 1; i >= 0; i--) {
      const label = labels[i]
      if (
        mouseX >= label.labelX &&
        mouseX <= label.labelX + labelWidth &&
        mouseY >= label.labelY &&
        mouseY <= label.labelY + labelHeight
      ) {
        return i
      }
    }
    return -1
  }

  return {
    // 状态
    draggingIndex,
    dragOffset,
    hoveredIndex,

    // 方法
    startDrag,
    onDrag,
    endDrag,
    setHoveredIndex,
    getLabelIndexAtPosition
  }
}
