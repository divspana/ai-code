/**
 * 多图层 Canvas 管理 Hook
 * 采用策略模式管理不同图层的渲染
 */

import { ref, onUnmounted } from 'vue'
import type { LayerType, LayerContext } from '../types'

export function useCanvasLayers() {
  const backgroundCanvas = ref<HTMLCanvasElement>()
  const defectsCanvas = ref<HTMLCanvasElement>()
  const interactionCanvas = ref<HTMLCanvasElement>()

  const layers = ref<Map<LayerType, LayerContext>>(new Map())

  /**
   * 初始化所有图层
   */
  const initializeLayers = (width: number, height: number) => {
    const canvases = [
      { type: 'background' as LayerType, canvas: backgroundCanvas.value },
      { type: 'defects' as LayerType, canvas: defectsCanvas.value },
      { type: 'interaction' as LayerType, canvas: interactionCanvas.value }
    ]

    canvases.forEach(({ type, canvas }) => {
      if (!canvas) return

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d', {
        alpha: type !== 'background', // 背景层不透明
        desynchronized: true, // 提升性能
        willReadFrequently: false
      })

      if (ctx) {
        layers.value.set(type, { canvas, ctx })
      }
    })
  }

  /**
   * 获取指定图层
   */
  const getLayer = (type: LayerType): LayerContext | undefined => {
    return layers.value.get(type)
  }

  /**
   * 清空指定图层
   */
  const clearLayer = (type: LayerType) => {
    const layer = layers.value.get(type)
    if (layer) {
      const { canvas, ctx } = layer
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  /**
   * 清空所有图层
   */
  const clearAllLayers = () => {
    layers.value.forEach((_, type) => clearLayer(type))
  }

  /**
   * 重置图层变换
   */
  const resetTransform = (type: LayerType) => {
    const layer = layers.value.get(type)
    if (layer) {
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
  }

  /**
   * 重置所有图层变换
   */
  const resetAllTransforms = () => {
    layers.value.forEach((_, type) => resetTransform(type))
  }

  /**
   * 调整所有图层大小
   */
  const resizeAllLayers = (width: number, height: number) => {
    layers.value.forEach(({ canvas }) => {
      canvas.width = width
      canvas.height = height
    })
  }

  // 清理
  onUnmounted(() => {
    clearAllLayers()
    layers.value.clear()
  })

  return {
    // Canvas refs
    backgroundCanvas,
    defectsCanvas,
    interactionCanvas,

    // 方法
    initializeLayers,
    getLayer,
    clearLayer,
    clearAllLayers,
    resetTransform,
    resetAllTransforms,
    resizeAllLayers
  }
}
