/**
 * 鼠标滚轮缩放 Hook
 * 实现以鼠标位置为中心的平滑缩放功能
 */

import { ref, computed } from 'vue'

export interface WheelZoomConfig {
  minZoom?: number // 最小缩放比例
  maxZoom?: number // 最大缩放比例
  zoomSpeed?: number // 缩放速度
  smoothZoom?: boolean // 是否启用平滑缩放
  zoomStep?: number // 缩放步进值
}

export interface ZoomState {
  scale: number // 当前缩放比例
  translateX: number // X 轴平移
  translateY: number // Y 轴平移
}

const DEFAULT_CONFIG: Required<WheelZoomConfig> = {
  minZoom: 0.1,
  maxZoom: 10,
  zoomSpeed: 0.001,
  smoothZoom: true,
  zoomStep: 0.1
}

export function useWheelZoom(config: WheelZoomConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // 缩放状态
  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)

  // 目标缩放值（用于平滑过渡）
  const targetScale = ref(1)
  const animationFrameId = ref<number | null>(null)

  /**
   * 处理滚轮事件
   * @param event 滚轮事件
   * @param containerRect 容器的边界矩形
   */
  const handleWheel = (event: WheelEvent, containerRect: DOMRect) => {
    event.preventDefault()

    // 计算鼠标在容器中的位置
    const mouseX = event.clientX - containerRect.left
    const mouseY = event.clientY - containerRect.top

    // 计算缩放前鼠标在画布上的坐标
    const beforeZoomX = (mouseX - translateX.value) / scale.value
    const beforeZoomY = (mouseY - translateY.value) / scale.value

    // 计算新的缩放比例
    const delta = -event.deltaY * finalConfig.zoomSpeed
    let newScale = scale.value * (1 + delta)

    // 限制缩放范围
    newScale = Math.max(finalConfig.minZoom, Math.min(finalConfig.maxZoom, newScale))

    if (finalConfig.smoothZoom) {
      // 平滑缩放
      targetScale.value = newScale
      startSmoothZoom(mouseX, mouseY, beforeZoomX, beforeZoomY)
    } else {
      // 立即缩放
      applyZoom(newScale, mouseX, mouseY, beforeZoomX, beforeZoomY)
    }
  }

  /**
   * 应用缩放变换
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
   * 启动平滑缩放动画
   */
  const startSmoothZoom = (
    mouseX: number,
    mouseY: number,
    beforeZoomX: number,
    beforeZoomY: number
  ) => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
    }

    const animate = () => {
      const diff = targetScale.value - scale.value

      if (Math.abs(diff) > 0.001) {
        const newScale = scale.value + diff * 0.2 // 缓动系数
        applyZoom(newScale, mouseX, mouseY, beforeZoomX, beforeZoomY)
        animationFrameId.value = requestAnimationFrame(animate)
      } else {
        applyZoom(targetScale.value, mouseX, mouseY, beforeZoomX, beforeZoomY)
        animationFrameId.value = null
      }
    }

    animate()
  }

  /**
   * 缩放到指定比例
   * @param newScale 目标缩放比例
   * @param centerX 缩放中心 X 坐标（可选，默认为画布中心）
   * @param centerY 缩放中心 Y 坐标（可选，默认为画布中心）
   */
  const zoomTo = (newScale: number, centerX?: number, centerY?: number) => {
    newScale = Math.max(finalConfig.minZoom, Math.min(finalConfig.maxZoom, newScale))

    if (centerX !== undefined && centerY !== undefined) {
      const beforeZoomX = (centerX - translateX.value) / scale.value
      const beforeZoomY = (centerY - translateY.value) / scale.value

      if (finalConfig.smoothZoom) {
        targetScale.value = newScale
        startSmoothZoom(centerX, centerY, beforeZoomX, beforeZoomY)
      } else {
        applyZoom(newScale, centerX, centerY, beforeZoomX, beforeZoomY)
      }
    } else {
      // 以当前中心缩放
      if (finalConfig.smoothZoom) {
        targetScale.value = newScale
      } else {
        scale.value = newScale
      }
    }
  }

  /**
   * 放大
   */
  const zoomIn = (centerX?: number, centerY?: number) => {
    const newScale = scale.value + finalConfig.zoomStep
    zoomTo(newScale, centerX, centerY)
  }

  /**
   * 缩小
   */
  const zoomOut = (centerX?: number, centerY?: number) => {
    const newScale = scale.value - finalConfig.zoomStep
    zoomTo(newScale, centerX, centerY)
  }

  /**
   * 重置缩放
   */
  const resetZoom = () => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }

    scale.value = 1
    translateX.value = 0
    translateY.value = 0
    targetScale.value = 1
  }

  /**
   * 适应容器大小
   * @param contentWidth 内容宽度
   * @param contentHeight 内容高度
   * @param containerWidth 容器宽度
   * @param containerHeight 容器高度
   * @param padding 边距
   */
  const fitToContainer = (
    contentWidth: number,
    contentHeight: number,
    containerWidth: number,
    containerHeight: number,
    padding: number = 20
  ) => {
    const scaleX = (containerWidth - padding * 2) / contentWidth
    const scaleY = (containerHeight - padding * 2) / contentHeight
    const newScale = Math.min(scaleX, scaleY)

    scale.value = Math.max(finalConfig.minZoom, Math.min(finalConfig.maxZoom, newScale))

    // 居中
    translateX.value = (containerWidth - contentWidth * scale.value) / 2
    translateY.value = (containerHeight - contentHeight * scale.value) / 2
  }

  /**
   * 获取变换矩阵字符串（用于 CSS transform）
   */
  const transformStyle = computed(() => {
    return `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`
  })

  /**
   * 获取当前缩放状态
   */
  const zoomState = computed<ZoomState>(() => ({
    scale: scale.value,
    translateX: translateX.value,
    translateY: translateY.value
  }))

  /**
   * 是否可以继续放大
   */
  const canZoomIn = computed(() => scale.value < finalConfig.maxZoom)

  /**
   * 是否可以继续缩小
   */
  const canZoomOut = computed(() => scale.value > finalConfig.minZoom)

  /**
   * 缩放百分比
   */
  const zoomPercentage = computed(() => Math.round(scale.value * 100))

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }
  }

  return {
    // 状态
    scale,
    translateX,
    translateY,
    zoomState,
    transformStyle,
    canZoomIn,
    canZoomOut,
    zoomPercentage,

    // 方法
    handleWheel,
    zoomTo,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContainer,
    cleanup
  }
}

/**
 * 创建滚轮缩放实例
 */
export function createWheelZoom(config?: WheelZoomConfig) {
  return useWheelZoom(config)
}
