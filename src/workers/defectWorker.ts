/**
 * Web Worker for processing defect data
 * Handles viewport culling and data decimation for large datasets
 */

interface Defect {
  dieRow: number
  dieCol: number
  x: number
  y: number
  type: string
  size?: number
  severity?: string
}

interface DiePosition {
  row: number
  col: number
  canvasX: number
  canvasY: number
  physicalX: number
  physicalY: number
}

interface ProcessDefectsMessage {
  type: 'processDefects'
  defects: Defect[]
  validDiePositions: DiePosition[]
  viewport: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  scale: number
  centerX: number
  centerY: number
  dieWidth: number
  dieHeight: number
  decimationLevel: number // 0 = no decimation, 1 = light, 2 = medium, 3 = heavy
}

interface ProcessedDefect {
  x: number
  y: number
  size: number
  color: string
}

// Default defect colors
const defectColors: Record<string, string> = {
  scratch: '#FF4444',
  particle: '#FFA500',
  void: '#9370DB',
  crack: '#DC143C',
  contamination: '#FFD700',
  default: '#FF0000'
}

self.onmessage = (e: MessageEvent<ProcessDefectsMessage>) => {
  const startTime = performance.now()

  const { defects, validDiePositions, viewport, scale, dieWidth, dieHeight, decimationLevel } =
    e.data

  // Create a map for quick Die lookup
  const dieMap = new Map<string, DiePosition>()
  validDiePositions.forEach(die => {
    dieMap.set(`${die.row},${die.col}`, die)
  })

  // Process defects with viewport culling and decimation
  const defectsByColor = new Map<string, ProcessedDefect[]>()
  let drawnCount = 0
  let skippedCount = 0

  // Calculate decimation threshold based on level
  const decimationThresholds = [1, 0.5, 0.2, 0.05] // 100%, 50%, 20%, 5%
  const threshold = decimationThresholds[Math.min(decimationLevel, 3)]

  defects.forEach(defect => {
    // Apply decimation (skip some defects based on level)
    if (decimationLevel > 0 && Math.random() > threshold) {
      skippedCount++
      return
    }

    // Find the Die this defect belongs to
    const dieKey = `${defect.dieRow},${defect.dieCol}`
    const die = dieMap.get(dieKey)

    if (!die) {
      skippedCount++
      return
    }

    // Calculate defect position on canvas
    const dieOffsetX = defect.x * dieWidth
    const dieOffsetY = defect.y * dieHeight
    const defectX = die.canvasX + dieOffsetX
    const defectY = die.canvasY + dieOffsetY

    // Viewport culling: skip defects outside visible area
    const margin = 50 // Add margin to include defects near edges
    if (
      defectX < viewport.minX - margin ||
      defectX > viewport.maxX + margin ||
      defectY < viewport.minY - margin ||
      defectY > viewport.maxY + margin
    ) {
      skippedCount++
      return
    }

    // Get defect color and size
    const color = defectColors[defect.type] || defectColors.default
    const size = (defect.size || 2) * scale

    // Group by color for batch rendering
    if (!defectsByColor.has(color)) {
      defectsByColor.set(color, [])
    }
    defectsByColor.get(color)!.push({ x: defectX, y: defectY, size, color })
    drawnCount++
  })

  const processingTime = performance.now() - startTime

  // Send results back to main thread
  // Note: Map cannot be transferred directly, convert to array
  const defectsByColorArray = Array.from(defectsByColor.entries())

  self.postMessage({
    type: 'defectsProcessed',
    defectsByColorArray,
    totalCount: defects.length,
    drawnCount,
    skippedCount,
    processingTime
  })
}
