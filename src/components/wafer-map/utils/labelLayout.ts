/**
 * 信息框布局工具
 * 用于优化信息框位置，避免严重重叠
 */

export interface LabelInfo {
  x: number // 坏点 X 坐标
  y: number // 坏点 Y 坐标
  labelX: number // 信息框 X 坐标
  labelY: number // 信息框 Y 坐标
  labelHeight: number // 信息框高度
  type?: string
  dieRow?: number
  dieCol?: number
  relX?: number
  relY?: number
}

export interface LabelLayoutConfig {
  labelWidth: number // 信息框宽度
  labelHeight: number // 信息框高度
  minDistance: number // 最小间距（负值表示允许重叠）
  maxIterations: number // 最大迭代次数
  overlapThreshold: number // 重叠面积阈值（0-1）
  pushDistance: number // 推开距离
  canvasSize: number // Canvas 尺寸
}

/**
 * 检测两个矩形是否重叠
 */
export const isRectOverlap = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number,
  margin: number = 0
): boolean => {
  return !(
    x1 + w1 + margin < x2 ||
    x2 + w2 + margin < x1 ||
    y1 + h1 + margin < y2 ||
    y2 + h2 + margin < y1
  )
}

/**
 * 计算两个矩形的重叠面积
 */
export const calculateOverlapArea = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): number => {
  const overlapX = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2))
  const overlapY = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2))
  return overlapX * overlapY
}

/**
 * 智能布局算法：调整信息框位置避免严重重叠
 * 使用力导向布局算法，只处理重叠面积超过阈值的情况
 */
export const optimizeLabelLayout = (labels: LabelInfo[], config: LabelLayoutConfig): void => {
  const {
    labelWidth,
    labelHeight,
    minDistance,
    maxIterations,
    overlapThreshold,
    pushDistance,
    canvasSize
  } = config

  const totalArea = labelWidth * labelHeight

  // 轻量级布局算法 - 只解决严重重叠问题
  for (let iter = 0; iter < maxIterations; iter++) {
    let hasSeriousOverlap = false

    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const label1 = labels[i]
        const label2 = labels[j]

        // 检测是否重叠
        if (
          isRectOverlap(
            label1.labelX,
            label1.labelY,
            labelWidth,
            labelHeight,
            label2.labelX,
            label2.labelY,
            labelWidth,
            labelHeight,
            minDistance
          )
        ) {
          // 计算重叠面积
          const overlapArea = calculateOverlapArea(
            label1.labelX,
            label1.labelY,
            labelWidth,
            labelHeight,
            label2.labelX,
            label2.labelY,
            labelWidth,
            labelHeight
          )

          // 只处理重叠面积超过阈值的情况
          if (overlapArea > totalArea * overlapThreshold) {
            hasSeriousOverlap = true

            // 计算两个信息框中心点
            const center1X = label1.labelX + labelWidth / 2
            const center1Y = label1.labelY + labelHeight / 2
            const center2X = label2.labelX + labelWidth / 2
            const center2Y = label2.labelY + labelHeight / 2

            // 计算排斥力方向
            const dx = center2X - center1X
            const dy = center2Y - center1Y
            const distance = Math.sqrt(dx * dx + dy * dy) || 1

            // 归一化方向向量
            const nx = dx / distance
            const ny = dy / distance

            // 调整位置（两个都移动，保持相对平衡）
            label1.labelX -= nx * pushDistance
            label1.labelY -= ny * pushDistance
            label2.labelX += nx * pushDistance
            label2.labelY += ny * pushDistance

            // 确保不超出边界
            label1.labelX = Math.max(10, Math.min(canvasSize - labelWidth - 10, label1.labelX))
            label1.labelY = Math.max(10, Math.min(canvasSize - labelHeight - 10, label1.labelY))
            label2.labelX = Math.max(10, Math.min(canvasSize - labelWidth - 10, label2.labelX))
            label2.labelY = Math.max(10, Math.min(canvasSize - labelHeight - 10, label2.labelY))
          }
        }
      }
    }

    // 如果没有严重重叠了，提前退出
    if (!hasSeriousOverlap) break
  }
}

/**
 * 初始化信息框位置
 */
export const initializeLabelPosition = (
  defectX: number,
  defectY: number,
  labelWidth: number,
  labelHeight: number,
  canvasSize: number,
  offset: number = 60
): { labelX: number; labelY: number } => {
  let labelX = defectX + offset
  let labelY = defectY - labelHeight / 2 // 垂直居中对齐坏点

  // 如果超出右边界，放到左边
  if (labelX + labelWidth > canvasSize) {
    labelX = defectX - labelWidth - offset
  }

  // 如果超出上边界
  if (labelY < 0) {
    labelY = 10
  }

  // 如果超出下边界
  if (labelY + labelHeight > canvasSize) {
    labelY = canvasSize - labelHeight - 10
  }

  return { labelX, labelY }
}
