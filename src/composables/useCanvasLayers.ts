/**
 * Multi-layer canvas management for performance optimization
 * Separates static background, dynamic defects, and interaction layers
 */

import { ref, onUnmounted } from 'vue'

export interface CanvasLayers {
  background: HTMLCanvasElement
  defects: HTMLCanvasElement
  interaction: HTMLCanvasElement
}

export interface LayerContexts {
  background: CanvasRenderingContext2D
  defects: CanvasRenderingContext2D
  interaction: CanvasRenderingContext2D
}

export function useCanvasLayers() {
  const backgroundCanvas = ref<HTMLCanvasElement>()
  const defectsCanvas = ref<HTMLCanvasElement>()
  const interactionCanvas = ref<HTMLCanvasElement>()

  const contexts = ref<Partial<LayerContexts>>({})

  /**
   * Initialize all canvas layers with the same size
   */
  const initializeLayers = (width: number, height: number) => {
    const canvases = [backgroundCanvas.value, defectsCanvas.value, interactionCanvas.value]
    const keys: (keyof LayerContexts)[] = ['background', 'defects', 'interaction']

    canvases.forEach((canvas, index) => {
      if (!canvas) return

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d', {
        alpha: index > 0, // Only background is opaque
        desynchronized: true, // Better performance
        willReadFrequently: false
      })

      if (ctx) {
        contexts.value[keys[index]] = ctx
      }
    })
  }

  /**
   * Clear a specific layer
   */
  const clearLayer = (layer: keyof LayerContexts) => {
    const ctx = contexts.value[layer]
    const canvas = getCanvas(layer)
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  /**
   * Clear all layers
   */
  const clearAllLayers = () => {
    clearLayer('background')
    clearLayer('defects')
    clearLayer('interaction')
  }

  /**
   * Get canvas element by layer name
   */
  const getCanvas = (layer: keyof LayerContexts): HTMLCanvasElement | undefined => {
    switch (layer) {
      case 'background':
        return backgroundCanvas.value
      case 'defects':
        return defectsCanvas.value
      case 'interaction':
        return interactionCanvas.value
    }
  }

  /**
   * Get context by layer name
   */
  const getContext = (layer: keyof LayerContexts): CanvasRenderingContext2D | undefined => {
    return contexts.value[layer]
  }

  /**
   * Reset transform for a specific layer
   */
  const resetTransform = (layer: keyof LayerContexts) => {
    const ctx = contexts.value[layer]
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
  }

  /**
   * Reset transform for all layers
   */
  const resetAllTransforms = () => {
    resetTransform('background')
    resetTransform('defects')
    resetTransform('interaction')
  }

  /**
   * Enable/disable image smoothing for a layer
   */
  const setImageSmoothing = (layer: keyof LayerContexts, enabled: boolean) => {
    const ctx = contexts.value[layer]
    if (ctx) {
      ctx.imageSmoothingEnabled = enabled
      if (!enabled) {
        ctx.imageSmoothingQuality = 'low'
      }
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    clearAllLayers()
    contexts.value = {}
  })

  return {
    // Canvas refs
    backgroundCanvas,
    defectsCanvas,
    interactionCanvas,

    // Methods
    initializeLayers,
    clearLayer,
    clearAllLayers,
    getCanvas,
    getContext,
    resetTransform,
    resetAllTransforms,
    setImageSmoothing
  }
}
