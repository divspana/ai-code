/**
 * Data decimation and viewport management utilities
 * For handling large datasets efficiently
 */

export interface Viewport {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

/**
 * Calculate viewport based on canvas size and zoom level
 */
export function calculateViewport(
  canvasWidth: number,
  canvasHeight: number,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0
): Viewport {
  const halfWidth = canvasWidth / zoom / 2
  const halfHeight = canvasHeight / zoom / 2

  return {
    minX: panX - halfWidth,
    minY: panY - halfHeight,
    maxX: panX + halfWidth,
    maxY: panY + halfHeight,
    width: canvasWidth / zoom,
    height: canvasHeight / zoom
  }
}

/**
 * Check if a point is within viewport (with optional margin)
 */
export function isInViewport(point: Point, viewport: Viewport, margin: number = 0): boolean {
  return (
    point.x >= viewport.minX - margin &&
    point.x <= viewport.maxX + margin &&
    point.y >= viewport.minY - margin &&
    point.y <= viewport.maxY + margin
  )
}

/**
 * Calculate decimation level based on data count
 * Returns 0-3 where 0 = no decimation, 3 = heavy decimation
 */
export function calculateDecimationLevel(dataCount: number): number {
  if (dataCount < 10000) return 0 // No decimation
  if (dataCount < 50000) return 1 // Light decimation (50%)
  if (dataCount < 200000) return 2 // Medium decimation (20%)
  return 3 // Heavy decimation (5%)
}

/**
 * Grid-based spatial indexing for fast viewport queries
 */
export class SpatialIndex<T extends Point> {
  private grid: Map<string, T[]>
  private cellSize: number

  constructor(cellSize: number = 100) {
    this.grid = new Map()
    this.cellSize = cellSize
  }

  /**
   * Add item to spatial index
   */
  add(item: T): void {
    const key = this.getCellKey(item.x, item.y)
    if (!this.grid.has(key)) {
      this.grid.set(key, [])
    }
    this.grid.get(key)!.push(item)
  }

  /**
   * Query items within viewport
   */
  query(viewport: Viewport, margin: number = 0): T[] {
    const results: T[] = []
    const minCellX = Math.floor((viewport.minX - margin) / this.cellSize)
    const maxCellX = Math.ceil((viewport.maxX + margin) / this.cellSize)
    const minCellY = Math.floor((viewport.minY - margin) / this.cellSize)
    const maxCellY = Math.ceil((viewport.maxY + margin) / this.cellSize)

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const key = `${x},${y}`
        const items = this.grid.get(key)
        if (items) {
          results.push(...items)
        }
      }
    }

    return results
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.grid.clear()
  }

  /**
   * Get cell key for coordinates
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    return `${cellX},${cellY}`
  }

  /**
   * Get statistics
   */
  getStats(): { totalCells: number; totalItems: number; avgItemsPerCell: number } {
    const totalCells = this.grid.size
    let totalItems = 0
    this.grid.forEach(items => {
      totalItems += items.length
    })
    return {
      totalCells,
      totalItems,
      avgItemsPerCell: totalCells > 0 ? totalItems / totalCells : 0
    }
  }
}

/**
 * LOD (Level of Detail) manager
 * Adjusts rendering detail based on zoom level and data density
 */
export class LODManager {
  private levels: number[]

  constructor(levels: number[] = [1, 0.5, 0.2, 0.05]) {
    this.levels = levels
  }

  /**
   * Get appropriate LOD level based on zoom and data count
   */
  getLODLevel(zoom: number, dataCount: number): number {
    // Higher zoom = more detail
    // More data = less detail

    if (zoom > 2) {
      // Zoomed in - show more detail
      if (dataCount < 50000) return 0
      if (dataCount < 200000) return 1
      return 2
    } else if (zoom > 1) {
      // Normal zoom
      if (dataCount < 10000) return 0
      if (dataCount < 100000) return 1
      if (dataCount < 500000) return 2
      return 3
    } else {
      // Zoomed out - show less detail
      if (dataCount < 5000) return 0
      if (dataCount < 50000) return 1
      if (dataCount < 200000) return 2
      return 3
    }
  }

  /**
   * Get sampling rate for a LOD level
   */
  getSamplingRate(level: number): number {
    return this.levels[Math.min(level, this.levels.length - 1)]
  }

  /**
   * Should render this item based on LOD level
   */
  shouldRender(level: number): boolean {
    if (level === 0) return true
    const rate = this.getSamplingRate(level)
    return Math.random() < rate
  }
}

/**
 * Performance monitor for tracking render performance
 */
export class PerformanceMonitor {
  private samples: number[] = []
  private maxSamples: number

  constructor(maxSamples: number = 60) {
    this.maxSamples = maxSamples
  }

  /**
   * Record a frame time
   */
  record(time: number): void {
    this.samples.push(time)
    if (this.samples.length > this.maxSamples) {
      this.samples.shift()
    }
  }

  /**
   * Get average frame time
   */
  getAverage(): number {
    if (this.samples.length === 0) return 0
    const sum = this.samples.reduce((a, b) => a + b, 0)
    return sum / this.samples.length
  }

  /**
   * Get FPS (frames per second)
   */
  getFPS(): number {
    const avg = this.getAverage()
    return avg > 0 ? 1000 / avg : 0
  }

  /**
   * Check if performance is good (>30 FPS)
   */
  isPerformanceGood(): boolean {
    return this.getFPS() > 30
  }

  /**
   * Clear samples
   */
  clear(): void {
    this.samples = []
  }
}
