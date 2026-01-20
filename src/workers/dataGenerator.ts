/**
 * Web Worker for generating large defect datasets
 * 用于生成大量缺陷数据的 Web Worker
 */

interface GenerateRequest {
  type: 'generate'
  count: number
  waferConfig: {
    diameter: number
    dieWidth: number
    dieHeight: number
    scribeLineX: number
    scribeLineY: number
    dieOffsetX: number
    dieOffsetY: number
    edgeExclusion: number
  }
}

interface GenerateResponse {
  type: 'complete'
  defects: Array<{
    dieRow: number
    dieCol: number
    x: number
    y: number
    type: string
    size: number
  }>
  possibleDiesCount: number
  generateTime: number
}

interface ProgressResponse {
  type: 'progress'
  current: number
  total: number
  percentage: number
}

self.onmessage = (e: MessageEvent<GenerateRequest>) => {
  const { count, waferConfig } = e.data

  const startTime = performance.now()
  const defectTypes = ['scratch', 'particle', 'void', 'crack', 'contamination']

  // 计算晶圆上可能的 Die 范围
  const waferRadius = waferConfig.diameter / 2
  const dieWidthWithScribe = waferConfig.dieWidth + waferConfig.scribeLineX
  const dieHeightWithScribe = waferConfig.dieHeight + waferConfig.scribeLineY

  // 计算最大行列数
  const maxRows = Math.ceil(waferRadius / dieHeightWithScribe) * 2
  const maxCols = Math.ceil(waferRadius / dieWidthWithScribe) * 2

  // 生成所有可能的 Die 位置
  const possibleDies: Array<{ row: number; col: number }> = []
  for (let row = -Math.floor(maxRows / 2); row <= Math.floor(maxRows / 2); row++) {
    for (let col = -Math.floor(maxCols / 2); col <= Math.floor(maxCols / 2); col++) {
      const centerX_mm = col * dieWidthWithScribe + waferConfig.dieOffsetX
      const centerY_mm = row * dieHeightWithScribe + waferConfig.dieOffsetY
      const distanceToCenter = Math.sqrt(centerX_mm * centerX_mm + centerY_mm * centerY_mm)

      if (distanceToCenter <= waferRadius - waferConfig.edgeExclusion) {
        possibleDies.push({ row, col })
      }
    }
  }

  // 生成缺陷数据
  const defects = []
  const progressInterval = Math.floor(count / 20) // 每 5% 报告一次进度

  for (let i = 0; i < count; i++) {
    const randomDie = possibleDies[Math.floor(Math.random() * possibleDies.length)]

    defects.push({
      dieRow: randomDie.row,
      dieCol: randomDie.col,
      x: Math.random(),
      y: Math.random(),
      type: defectTypes[Math.floor(Math.random() * defectTypes.length)],
      size: 0.5
    })

    // 报告进度
    if (i > 0 && i % progressInterval === 0) {
      const progress: ProgressResponse = {
        type: 'progress',
        current: i,
        total: count,
        percentage: Math.floor((i / count) * 100)
      }
      self.postMessage(progress)
    }
  }

  const generateTime = performance.now() - startTime

  // 发送完成消息
  const response: GenerateResponse = {
    type: 'complete',
    defects,
    possibleDiesCount: possibleDies.length,
    generateTime
  }

  self.postMessage(response)
}

export {}
