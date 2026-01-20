/**
 * Performance optimization utilities for Wafer Map rendering
 * Integrates all optimization strategies in a simple API
 */

import { calculateDecimationLevel, type Viewport } from './dataDecimation'

export interface Defect {
  dieRow: number
  dieCol: number
  x: number
  y: number
  type: string
  size?: number
  severity?: string
}

export interface DiePosition {
  row: number
  col: number
  canvasX: number
  canvasY: number
  physicalX: number
  physicalY: number
}

export interface OptimizedDefect {
  x: number
  y: number
  size: number
  color: string
}

export interface RenderOptions {
  viewport: Viewport
  scale: number
  centerX: number
  centerY: number
  dieWidth: number
  dieHeight: number
  enableDecimation: boolean
  enableViewportCulling: boolean
}

// Default defect colors
const DEFECT_COLORS: Record<string, string> = {
  scratch: '#FF4444',
  particle: '#FFA500',
  void: '#9370DB',
  crack: '#DC143C',
  contamination: '#FFD700',
  default: '#FF0000'
}

/**
 * Optimized defect processor
 * Applies viewport culling and data decimation
 */
export class DefectProcessor {
  private dieMap: Map<string, DiePosition> = new Map()

  /**
   * Build Die lookup map for fast access
   */
  buildDieMap(validDiePositions: DiePosition[]): void {
    this.dieMap.clear()
    validDiePositions.forEach(die => {
      this.dieMap.set(`${die.row},${die.col}`, die)
    })
  }

  /**
   * Process defects with optimizations
   */
  processDefects(defects: Defect[], options: RenderOptions): Map<string, OptimizedDefect[]> {
    const startTime = performance.now()
    const defectsByColor = new Map<string, OptimizedDefect[]>()

    let drawnCount = 0
    let skippedCount = 0

    // Calculate decimation level
    const decimationLevel = options.enableDecimation ? calculateDecimationLevel(defects.length) : 0

    const decimationThresholds = [1, 0.5, 0.2, 0.05]
    const threshold = decimationThresholds[Math.min(decimationLevel, 3)]

    // Process each defect
    defects.forEach(defect => {
      // Apply decimation
      if (options.enableDecimation && decimationLevel > 0 && Math.random() > threshold) {
        skippedCount++
        return
      }

      // Find the Die
      const dieKey = `${defect.dieRow},${defect.dieCol}`
      const die = this.dieMap.get(dieKey)

      if (!die) {
        skippedCount++
        return
      }

      // Calculate defect position
      const dieOffsetX = defect.x * options.dieWidth
      const dieOffsetY = defect.y * options.dieHeight
      const defectX = die.canvasX + dieOffsetX
      const defectY = die.canvasY + dieOffsetY

      // Viewport culling
      if (options.enableViewportCulling) {
        const margin = 50
        if (
          defectX < options.viewport.minX - margin ||
          defectX > options.viewport.maxX + margin ||
          defectY < options.viewport.minY - margin ||
          defectY > options.viewport.maxY + margin
        ) {
          skippedCount++
          return
        }
      }

      // Get color and size
      const color = DEFECT_COLORS[defect.type] || DEFECT_COLORS.default
      const size = (defect.size || 2) * options.scale

      // Group by color
      if (!defectsByColor.has(color)) {
        defectsByColor.set(color, [])
      }
      defectsByColor.get(color)!.push({ x: defectX, y: defectY, size, color })
      drawnCount++
    })

    const processingTime = performance.now() - startTime
    console.log(
      `Defect processing: total=${defects.length}, drawn=${drawnCount}, ` +
        `skipped=${skippedCount}, time=${processingTime.toFixed(2)}ms, ` +
        `decimation=${decimationLevel}`
    )

    return defectsByColor
  }

  /**
   * Clear the Die map
   */
  clear(): void {
    this.dieMap.clear()
  }
}

/**
 * Batch render defects by color
 * Optimized for Canvas 2D rendering
 */
export function renderDefectsByColor(
  ctx: CanvasRenderingContext2D,
  defectsByColor: Map<string, OptimizedDefect[]>
): void {
  defectsByColor.forEach((defects, color) => {
    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 0.5

    // Use Path2D for better performance
    const path = new Path2D()
    defects.forEach(({ x, y, size }) => {
      path.arc(x, y, size, 0, Math.PI * 2)
      path.moveTo(x + size, y) // Move to avoid connecting arcs
    })

    ctx.fill(path)
    ctx.stroke(path)
  })
}

/**
 * Create offscreen canvas for caching
 */
export function createOffscreenCanvas(
  width: number,
  height: number
): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true
  })!
  return { canvas, ctx }
}

/**
 * Simple frame rate limiter
 */
export class FrameLimiter {
  private lastFrameTime = 0
  private targetFPS: number

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS
  }

  /**
   * Check if enough time has passed to render next frame
   */
  shouldRender(): boolean {
    const now = performance.now()
    const elapsed = now - this.lastFrameTime
    const minFrameTime = 1000 / this.targetFPS

    if (elapsed >= minFrameTime) {
      this.lastFrameTime = now
      return true
    }
    return false
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.lastFrameTime = 0
  }
}

/**
 * Debounced render helper
 */
export function createDebouncedRender(renderFn: () => void, delay: number = 100): () => void {
  let timeoutId: number | null = null

  return () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = window.setTimeout(() => {
      renderFn()
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttled render helper
 */
export function createThrottledRender(renderFn: () => void, delay: number = 16): () => void {
  let lastRun = 0
  let timeoutId: number | null = null

  return () => {
    const now = Date.now()

    if (now - lastRun >= delay) {
      renderFn()
      lastRun = now
    } else {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(
        () => {
          renderFn()
          lastRun = Date.now()
          timeoutId = null
        },
        delay - (now - lastRun)
      )
    }
  }
}
