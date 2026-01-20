/**
 * Composable for managing defect processing Web Worker
 */

import { ref, onUnmounted } from 'vue'

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

interface ProcessedDefect {
  x: number
  y: number
  size: number
  color: string
}

interface ProcessDefectsParams {
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
  decimationLevel: number
}

interface ProcessDefectsResult {
  defectsByColor: Map<string, ProcessedDefect[]>
  totalCount: number
  drawnCount: number
  skippedCount: number
  processingTime: number
}

export function useDefectWorker() {
  const worker = ref<Worker | null>(null)
  const isProcessing = ref(false)
  const lastResult = ref<ProcessDefectsResult | null>(null)

  /**
   * Initialize the worker
   */
  const initWorker = () => {
    if (worker.value) return

    try {
      // Create worker from the worker file
      worker.value = new Worker(new URL('../workers/defectWorker.ts', import.meta.url), {
        type: 'module'
      })

      worker.value.onerror = error => {
        console.error('Worker error:', error)
        isProcessing.value = false
      }
    } catch (error) {
      console.error('Failed to create worker:', error)
    }
  }

  /**
   * Process defects using the worker
   */
  const processDefects = (params: ProcessDefectsParams): Promise<ProcessDefectsResult> => {
    return new Promise((resolve, reject) => {
      if (!worker.value) {
        initWorker()
      }

      if (!worker.value) {
        reject(new Error('Worker not available'))
        return
      }

      isProcessing.value = true

      // Set up one-time message handler
      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'defectsProcessed') {
          // Convert array back to Map
          const defectsByColor = new Map<string, ProcessedDefect[]>(e.data.defectsByColorArray)

          const result: ProcessDefectsResult = {
            defectsByColor,
            totalCount: e.data.totalCount,
            drawnCount: e.data.drawnCount,
            skippedCount: e.data.skippedCount,
            processingTime: e.data.processingTime
          }

          lastResult.value = result
          isProcessing.value = false
          worker.value?.removeEventListener('message', handleMessage)
          resolve(result)
        }
      }

      worker.value.addEventListener('message', handleMessage)

      // Send data to worker
      worker.value.postMessage({
        type: 'processDefects',
        ...params
      })
    })
  }

  /**
   * Terminate the worker
   */
  const terminateWorker = () => {
    if (worker.value) {
      worker.value.terminate()
      worker.value = null
    }
    isProcessing.value = false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    terminateWorker()
  })

  return {
    isProcessing,
    lastResult,
    initWorker,
    processDefects,
    terminateWorker
  }
}
