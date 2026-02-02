/**
 * WaferMap 专用缩放 Hook
 * 支持多图层同步缩放和平移
 */

import { ref, computed } from 'vue'
import type { LayerType } from '../types'

export interface WaferZoomConfig {
  minZoom?: number
  maxZoom?: number
  zoomSpeed?: number
  smoothZoom?: boolean
  zoomStep?: number
}

const DEFAULT_CONFIG: Required<WaferZoomConfig> = {
  minZoom: 0.5,
  maxZoom: 5,
  zoomSpeed: 0.001,
  smoothZoom: true,
  zoomStep: 0.2
}

export function useWaferZoom(config: WaferZoomConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // 缩放状态
  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)
  const targetScale = ref(1)
  const animationFrameId = ref<number | null>(null)

  // 拖拽状态
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const dragStartTranslateX = ref(0)
  const dragStartTranslateY = ref(0)

  // 存储所有图层的 context
  const layerContexts = ref<Map<LayerType, CanvasRenderingContext2D>>(new Map())

  /**
   * 注册图层 context
   */
  const registerLayer = (type: LayerType, ctx: CanvasRenderingContext2D) => {
    layerContexts.value.set(type, ctx)
  }

  /**
   * 注销图层
   */
  const unregisterLayer = (type: LayerType) => {
    layerContexts.value.delete(type)
  }

  /**
   * 应用变换到所有图层
   */
  const applyTransformToAllLayers = () => {
    layerContexts.value.forEach(ctx => {
      // 重置变换
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      // 应用新的变换：先平移，再缩放
      ctx.translate(translateX.value, translateY.value)
      ctx.scale(scale.value, scale.value)
    })
  }

  /**
   * 处理滚轮事件
   */
  const handleWheel = (event: WheelEvent, containerRect: DOMRect, onZoomChange?: () => void) => {
    event.preventDefault()

    // 计算鼠标在容器中的位置
    const mouseX = event.clientX - containerRect.left
    const mouseY = event.clientY - containerRect.top

    // 计算缩放前鼠标在画布上的坐标（考虑当前的平移和缩放）
    const beforeZoomX = (mouseX - translateX.value) / scale.value
    const beforeZoomY = (mouseY - translateY.value) / scale.value

    // 计算新的缩放比例
    const delta = -event.deltaY * finalConfig.zoomSpeed
    let newScale = scale.value * (1 + delta)

    // 限制缩放范围
    newScale = Math.max(finalConfig.minZoom, Math.min(finalConfig.maxZoom, newScale))

    if (finalConfig.smoothZoom) {
      targetScale.value = newScale
      startSmoothZoom(mouseX, mouseY, beforeZoomX, beforeZoomY, onZoomChange)
    } else {
      applyZoom(newScale, mouseX, mouseY, beforeZoomX, beforeZoomY)
      applyTransformToAllLayers()
      onZoomChange?.()
    }
  }

  /**
   * 应用缩放
   */
  const applyZoom = (
    newScale: number,
    mouseX: number,
    mouseY: number,
    beforeZoomX: number,
    beforeZoomY: number
  ) => {
    scale.value = newScale

    // 计算缩放后鼠标应该在画布上的坐标
    const afterZoomX = beforeZoomX * newScale
    const afterZoomY = beforeZoomY * newScale

    // 调整平移，使鼠标位置保持不变
    translateX.value = mouseX - afterZoomX
    translateY.value = mouseY - afterZoomY
  }

  /**
   * 平滑缩放动画
   */
  const startSmoothZoom = (
    mouseX: number,
    mouseY: number,
    beforeZoomX: number,
    beforeZoomY: number,
    onZoomChange?: () => void
  ) => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
    }

    const animate = () => {
      const diff = targetScale.value - scale.value

      if (Math.abs(diff) > 0.001) {
        const newScale = scale.value + diff * 0.2
        applyZoom(newScale, mouseX, mouseY, beforeZoomX, beforeZoomY)
        applyTransformToAllLayers()
        onZoomChange?.()
        animationFrameId.value = requestAnimationFrame(animate)
      } else {
        applyZoom(targetScale.value, mouseX, mouseY, beforeZoomX, beforeZoomY)
        applyTransformToAllLayers()
        onZoomChange?.()
        animationFrameId.value = null
      }
    }

    animate()
  }

  /**
   * 缩放到指定比例
   */
  const zoomTo = (
    newScale: number,
    centerX?: number,
    centerY?: number,
    onZoomChange?: () => void
  ) => {
    newScale = Math.max(finalConfig.minZoom, Math.min(finalConfig.maxZoom, newScale))

    if (centerX !== undefined && centerY !== undefined) {
      const beforeZoomX = (centerX - translateX.value) / scale.value
      const beforeZoomY = (centerY - translateY.value) / scale.value

      if (finalConfig.smoothZoom) {
        targetScale.value = newScale
        startSmoothZoom(centerX, centerY, beforeZoomX, beforeZoomY, onZoomChange)
      } else {
        applyZoom(newScale, centerX, centerY, beforeZoomX, beforeZoomY)
        applyTransformToAllLayers()
        onZoomChange?.()
      }
    } else {
      scale.value = newScale
      targetScale.value = newScale
      applyTransformToAllLayers()
      onZoomChange?.()
    }
  }

  /**
   * 放大
   */
  const zoomIn = (centerX?: number, centerY?: number, onZoomChange?: () => void) => {
    const newScale = scale.value + finalConfig.zoomStep
    zoomTo(newScale, centerX, centerY, onZoomChange)
  }

  /**
   * 缩小
   */
  const zoomOut = (centerX?: number, centerY?: number, onZoomChange?: () => void) => {
    const newScale = scale.value - finalConfig.zoomStep
    zoomTo(newScale, centerX, centerY, onZoomChange)
  }

  /**
   * 重置缩放
   */
  const resetZoom = (onZoomChange?: () => void) => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }

    scale.value = 1
    translateX.value = 0
    translateY.value = 0
    targetScale.value = 1

    applyTransformToAllLayers()
    onZoomChange?.()
  }

  /**
   * 适应容器
   */
  const fitToContainer = (
    contentWidth: number,
    contentHeight: number,
    containerWidth: number,
    containerHeight: number,
    padding: number = 20,
    onZoomChange?: () => void
  ) => {
    const scaleX = (containerWidth - padding * 2) / contentWidth
    const scaleY = (containerHeight - padding * 2) / contentHeight
    const newScale = Math.min(scaleX, scaleY)

    scale.value = Math.max(finalConfig.minZoom, Math.min(finalConfig.maxZoom, newScale))
    targetScale.value = scale.value

    // 居中
    translateX.value = (containerWidth - contentWidth * scale.value) / 2
    translateY.value = (containerHeight - contentHeight * scale.value) / 2

    applyTransformToAllLayers()
    onZoomChange?.()
  }

  /**
   * 获取逆变换矩阵（用于将屏幕坐标转换为画布坐标）
   */
  const screenToCanvas = (screenX: number, screenY: number) => {
    return {
      x: (screenX - translateX.value) / scale.value,
      y: (screenY - translateY.value) / scale.value
    }
  }

  /**
   * 画布坐标转屏幕坐标
   */
  const canvasToScreen = (canvasX: number, canvasY: number) => {
    return {
      x: canvasX * scale.value + translateX.value,
      y: canvasY * scale.value + translateY.value
    }
  }

  /**
   * 缩放百分比
   */
  const zoomPercentage = computed(() => Math.round(scale.value * 100))

  /**
   * 是否可以继续放大
   */
  const canZoomIn = computed(() => scale.value < finalConfig.maxZoom)

  /**
   * 是否可以继续缩小
   */
  const canZoomOut = computed(() => scale.value > finalConfig.minZoom)

  /**
   * 开始拖拽
   */
  const startDrag = (clientX: number, clientY: number) => {
    isDragging.value = true
    dragStartX.value = clientX
    dragStartY.value = clientY
    dragStartTranslateX.value = translateX.value
    dragStartTranslateY.value = translateY.value
  }

  /**
   * 拖拽移动
   */
  const onDrag = (clientX: number, clientY: number, onPanChange?: () => void) => {
    if (!isDragging.value) return

    const deltaX = clientX - dragStartX.value
    const deltaY = clientY - dragStartY.value

    translateX.value = dragStartTranslateX.value + deltaX
    translateY.value = dragStartTranslateY.value + deltaY

    applyTransformToAllLayers()
    onPanChange?.()
  }

  /**
   * 结束拖拽
   */
  const endDrag = () => {
    isDragging.value = false
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }
    isDragging.value = false
    layerContexts.value.clear()
  }

  return {
    // 状态
    scale,
    translateX,
    translateY,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
    isDragging,

    // 图层管理
    registerLayer,
    unregisterLayer,
    applyTransformToAllLayers,

    // 缩放方法
    handleWheel,
    zoomTo,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContainer,

    // 拖拽方法
    startDrag,
    onDrag,
    endDrag,

    // 坐标转换
    screenToCanvas,
    canvasToScreen,

    // 清理
    cleanup
  }
}
