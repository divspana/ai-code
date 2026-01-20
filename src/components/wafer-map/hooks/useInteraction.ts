/**
 * 交互层管理 Hook
 * 负责鼠标事件、缩放、平移、选择、Tooltip 等交互功能
 */

import { ref, computed } from 'vue'
import type { DieInfo, DiePosition, Defect } from '../types'
import { INTERACTION_CONFIG } from '../constants'

export function useInteraction() {
  // ==================== 状态 ====================

  // 缩放和平移
  const zoom = ref(1)
  const pan = ref({ x: 0, y: 0 })

  // 选择框
  const isSelecting = ref(false)
  const selectionStart = ref({ x: 0, y: 0 })
  const selectionEnd = ref({ x: 0, y: 0 })

  // Tooltip
  const tooltip = ref({
    visible: false,
    x: 0,
    y: 0,
    dieInfo: null as DieInfo | null
  })

  // 鼠标状态
  const lastMousePos = ref({ x: 0, y: 0 })
  const isPanning = ref(false)

  // ==================== 计算属性 ====================

  const selectionRect = computed(() => {
    const minX = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const minY = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const maxX = Math.max(selectionStart.value.x, selectionEnd.value.x)
    const maxY = Math.max(selectionStart.value.y, selectionEnd.value.y)
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  })

  // ==================== 辅助方法 ====================

  /**
   * 根据画布坐标获取 Die 信息
   */
  const getDieAtPosition = (
    canvasX: number,
    canvasY: number,
    diePositions: DiePosition[],
    dieWidth: number,
    dieHeight: number,
    defects: Defect[]
  ): DieInfo | null => {
    for (const die of diePositions) {
      const dieLeft = die.canvasX
      const dieRight = die.canvasX + dieWidth
      const dieTop = die.canvasY
      const dieBottom = die.canvasY + dieHeight

      if (canvasX >= dieLeft && canvasX <= dieRight && canvasY >= dieTop && canvasY <= dieBottom) {
        // 找到对应的缺陷
        const dieDefects = defects.filter(
          defect => defect.dieRow === die.row && defect.dieCol === die.col
        )

        return {
          row: die.row,
          col: die.col,
          x: die.physicalX,
          y: die.physicalY,
          defects: dieDefects
        }
      }
    }
    return null
  }

  /**
   * 获取选择框内的 Dies
   */
  const getDiesInSelection = (
    rect: { x: number; y: number; width: number; height: number },
    diePositions: DiePosition[],
    dieWidth: number,
    dieHeight: number,
    defects: Defect[]
  ): DieInfo[] => {
    const dies: DieInfo[] = []

    diePositions.forEach(die => {
      const dieCenterX = die.canvasX + dieWidth / 2
      const dieCenterY = die.canvasY + dieHeight / 2

      if (
        dieCenterX >= rect.x &&
        dieCenterX <= rect.x + rect.width &&
        dieCenterY >= rect.y &&
        dieCenterY <= rect.y + rect.height
      ) {
        const dieDefects = defects.filter(
          defect => defect.dieRow === die.row && defect.dieCol === die.col
        )

        dies.push({
          row: die.row,
          col: die.col,
          x: die.physicalX,
          y: die.physicalY,
          defects: dieDefects
        })
      }
    })

    return dies
  }

  // ==================== 事件处理 ====================

  /**
   * 鼠标按下
   */
  const handleMouseDown = (event: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (event.button === 0) {
      // 左键：开始选择
      isSelecting.value = true
      selectionStart.value = { x, y }
      selectionEnd.value = { x, y }
      tooltip.value.visible = false
    } else if (event.button === 2) {
      // 右键：开始平移
      isPanning.value = true
      lastMousePos.value = { x: event.clientX, y: event.clientY }
    }
  }

  /**
   * 鼠标移动
   */
  const handleMouseMove = (
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    diePositions: DiePosition[],
    dieWidth: number,
    dieHeight: number,
    defects: Defect[],
    enableTooltip: boolean
  ) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (isSelecting.value) {
      // 更新选择框
      selectionEnd.value = { x, y }
      tooltip.value.visible = false
    } else if (isPanning.value) {
      // 平移
      const deltaX = event.clientX - lastMousePos.value.x
      const deltaY = event.clientY - lastMousePos.value.y
      pan.value.x += deltaX
      pan.value.y += deltaY
      lastMousePos.value = { x: event.clientX, y: event.clientY }
      tooltip.value.visible = false
    } else if (enableTooltip) {
      // 显示 Tooltip
      const dieInfo = getDieAtPosition(x, y, diePositions, dieWidth, dieHeight, defects)
      if (dieInfo) {
        tooltip.value = {
          visible: true,
          x: x + INTERACTION_CONFIG.TOOLTIP_OFFSET,
          y: y + INTERACTION_CONFIG.TOOLTIP_OFFSET,
          dieInfo
        }
      } else {
        tooltip.value.visible = false
      }
    }
  }

  /**
   * 鼠标抬起
   */
  const handleMouseUp = (
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    diePositions: DiePosition[],
    dieWidth: number,
    dieHeight: number,
    defects: Defect[]
  ) => {
    if (isSelecting.value) {
      isSelecting.value = false

      const rect = selectionRect.value
      // 只有选择框足够大时才触发选择事件
      if (
        rect.width > INTERACTION_CONFIG.MIN_SELECTION_SIZE &&
        rect.height > INTERACTION_CONFIG.MIN_SELECTION_SIZE
      ) {
        const selectedDies = getDiesInSelection(rect, diePositions, dieWidth, dieHeight, defects)
        return { type: 'selection', dies: selectedDies }
      }
    }

    if (isPanning.value) {
      isPanning.value = false
    }

    return null
  }

  /**
   * 鼠标离开
   */
  const handleMouseLeave = () => {
    isSelecting.value = false
    isPanning.value = false
    tooltip.value.visible = false
  }

  /**
   * 点击事件
   */
  const handleClick = (
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    diePositions: DiePosition[],
    dieWidth: number,
    dieHeight: number,
    defects: Defect[]
  ) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const dieInfo = getDieAtPosition(x, y, diePositions, dieWidth, dieHeight, defects)
    if (dieInfo) {
      return { type: 'click', die: dieInfo }
    }
    return null
  }

  /**
   * 滚轮缩放
   */
  const handleWheel = (event: WheelEvent, enableZoom: boolean) => {
    if (!enableZoom) return

    event.preventDefault()

    const delta = -event.deltaY * INTERACTION_CONFIG.WHEEL_ZOOM_SPEED
    const newZoom = Math.max(
      INTERACTION_CONFIG.MIN_ZOOM,
      Math.min(INTERACTION_CONFIG.MAX_ZOOM, zoom.value + delta)
    )

    zoom.value = newZoom
    return newZoom
  }

  /**
   * 绘制选择框
   */
  const drawSelectionBox = (ctx: CanvasRenderingContext2D) => {
    if (!isSelecting.value) return

    const rect = selectionRect.value

    // 填充
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

    // 边框
    ctx.strokeStyle = '#409EFF'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    ctx.setLineDash([])
  }

  /**
   * 重置状态
   */
  const reset = () => {
    zoom.value = 1
    pan.value = { x: 0, y: 0 }
    isSelecting.value = false
    isPanning.value = false
    tooltip.value.visible = false
  }

  return {
    // 状态
    zoom,
    pan,
    isSelecting,
    selectionStart,
    selectionEnd,
    selectionRect,
    tooltip,

    // 方法
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
    handleWheel,
    drawSelectionBox,
    getDieAtPosition,
    getDiesInSelection,
    reset
  }
}
