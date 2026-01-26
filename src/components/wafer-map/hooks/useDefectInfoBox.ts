/**
 * 坏点信息框 Hook
 * 负责绘制和管理坏点信息框
 */

import { ref } from 'vue'
import type { SelectedDefectInfo } from '../types/defectData'
import { optimizeLabelLayout, initializeLabelPosition } from '../utils/labelLayout'
import type { LabelLayoutConfig } from '../utils/labelLayout'
import { createInfoBoxOptimizer, type OptimizationConfig } from '../utils/infoBoxOptimizer'

// 信息框配置常量
export const INFO_BOX_CONFIG = {
  WIDTH: 250,
  HEIGHT: 80,
  PADDING: 8,
  LINE_HEIGHT: 14,
  OFFSET: 60, // 信息框相对坏点的偏移距离
  LAYOUT: {
    minDistance: -20, // 允许轻微重叠
    maxIterations: 15,
    overlapThreshold: 0.3, // 重叠面积阈值 30%
    pushDistance: 5
  }
}

export interface DefectInfoBoxOptions {
  canvasSize: number
  enableDrag?: boolean
  enableOptimization?: boolean // 是否启用性能优化
  optimizationConfig?: Partial<OptimizationConfig> // 优化配置
}

export function useDefectInfoBox(options: DefectInfoBoxOptions) {
  const { canvasSize, enableOptimization = false, optimizationConfig } = options

  // 选中的坏点信息
  const selectedDefects = ref<SelectedDefectInfo[]>([])
  const totalDefectsCount = ref(0) // 总坏点数（优化前）

  // 拖拽状态
  const draggingIndex = ref<number | null>(null)
  const dragOffset = ref({ x: 0, y: 0 })
  const hoveredIndex = ref<number | null>(null)

  // 性能优化器
  const optimizer = enableOptimization ? createInfoBoxOptimizer(optimizationConfig) : null

  /**
   * 设置选中的坏点数据
   */
  const setSelectedDefects = (
    defects: Array<{ canvasX: number; canvasY: number; [key: string]: unknown }>
  ) => {
    totalDefectsCount.value = defects.length

    // 如果启用优化且数量过多，先进行优化
    let optimizedDefects = defects
    if (optimizer && defects.length > 100) {
      const viewport = { width: canvasSize, height: canvasSize }
      optimizedDefects = optimizer.optimize(defects as SelectedDefectInfo[], viewport)
    }

    const defectsWithLabels: SelectedDefectInfo[] = optimizedDefects.map((defect, index) => {
      // 初始化信息框位置
      const { labelX, labelY } = initializeLabelPosition(
        defect.canvasX,
        defect.canvasY,
        INFO_BOX_CONFIG.WIDTH,
        INFO_BOX_CONFIG.HEIGHT,
        canvasSize,
        INFO_BOX_CONFIG.OFFSET
      )

      return {
        ...defect,
        x: defect.canvasX,
        y: defect.canvasY,
        index,
        labelX,
        labelY,
        labelHeight: INFO_BOX_CONFIG.HEIGHT
      }
    })

    // 应用智能布局算法
    if (defectsWithLabels.length > 1) {
      const layoutConfig: LabelLayoutConfig = {
        labelWidth: INFO_BOX_CONFIG.WIDTH,
        labelHeight: INFO_BOX_CONFIG.HEIGHT,
        ...INFO_BOX_CONFIG.LAYOUT,
        canvasSize
      }
      optimizeLabelLayout(defectsWithLabels, layoutConfig)
    }

    selectedDefects.value = defectsWithLabels
  }

  /**
   * 清空选中的坏点
   */
  const clearSelectedDefects = () => {
    selectedDefects.value = []
    draggingIndex.value = null
    hoveredIndex.value = null
  }

  /**
   * 检测鼠标是否在某个信息框上
   */
  const getInfoBoxIndexAtPosition = (mouseX: number, mouseY: number): number => {
    for (let i = selectedDefects.value.length - 1; i >= 0; i--) {
      const defect = selectedDefects.value[i]
      if (
        mouseX >= defect.labelX &&
        mouseX <= defect.labelX + INFO_BOX_CONFIG.WIDTH &&
        mouseY >= defect.labelY &&
        mouseY <= defect.labelY + INFO_BOX_CONFIG.HEIGHT
      ) {
        return i
      }
    }
    return -1
  }

  /**
   * 开始拖拽信息框
   */
  const startDrag = (index: number, mouseX: number, mouseY: number) => {
    draggingIndex.value = index
    const defect = selectedDefects.value[index]
    dragOffset.value = {
      x: mouseX - defect.labelX,
      y: mouseY - defect.labelY
    }
  }

  /**
   * 更新拖拽位置
   */
  const updateDrag = (mouseX: number, mouseY: number) => {
    if (draggingIndex.value !== null) {
      const defect = selectedDefects.value[draggingIndex.value]
      if (defect) {
        defect.labelX = mouseX - dragOffset.value.x
        defect.labelY = mouseY - dragOffset.value.y
        return true
      }
    }
    return false
  }

  /**
   * 结束拖拽
   */
  const endDrag = () => {
    draggingIndex.value = null
  }

  /**
   * 更新 hover 状态
   */
  const updateHover = (mouseX: number, mouseY: number) => {
    hoveredIndex.value = getInfoBoxIndexAtPosition(mouseX, mouseY)
    return hoveredIndex.value !== -1
  }

  /**
   * 绘制信息框和连线
   */
  const render = (ctx: CanvasRenderingContext2D) => {
    if (selectedDefects.value.length === 0) return

    const { WIDTH, HEIGHT, PADDING, LINE_HEIGHT } = INFO_BOX_CONFIG
    const labelHalfHeight = HEIGHT / 2

    ctx.save()

    // 设置文本样式（只设置一次）
    ctx.font = '10px "Courier New", monospace'
    ctx.textBaseline = 'top'

    selectedDefects.value.forEach((defect, index) => {
      const { canvasX: x1, canvasY: y1, labelX: x2, labelY: y2 } = defect

      // 绘制连线（从坏点到信息框左边缘中心）
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2 + labelHalfHeight)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.stroke()

      // 绘制信息框背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x2, y2, WIDTH, HEIGHT)

      // 绘制信息框边框
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.strokeRect(x2, y2, WIDTH, HEIGHT)

      // 绘制文本
      ctx.fillStyle = '#000000'

      // 构建文本内容
      const texts = [
        `logicx = ${defect.x?.toFixed(1) || 'N/A'}`,
        `logicy = ${defect.y?.toFixed(1) || 'N/A'}`,
        `defectId = ${index + 1}`,
        `type = ${defect.type || 'unknown'}`,
        `index = ${defect.index}`
      ]

      // 如果是聚类，添加聚类信息
      const defectWithCluster = defect as SelectedDefectInfo & {
        isCluster?: boolean
        clusterSize?: number
      }
      if (defectWithCluster.isCluster && defectWithCluster.clusterSize) {
        texts.push(`cluster: ${defectWithCluster.clusterSize} defects`)
      }

      const textX = x2 + PADDING
      let textY = y2 + PADDING

      for (let i = 0; i < texts.length; i++) {
        ctx.fillText(texts[i], textX, textY)
        textY += LINE_HEIGHT
      }
    })

    ctx.restore()
  }

  /**
   * 更新优化配置
   */
  const updateOptimizationConfig = (config: Partial<OptimizationConfig>) => {
    if (optimizer) {
      optimizer.updateConfig(config)
    }
  }

  return {
    // 状态
    selectedDefects,
    totalDefectsCount,
    draggingIndex,
    hoveredIndex,

    // 方法
    setSelectedDefects,
    clearSelectedDefects,
    getInfoBoxIndexAtPosition,
    startDrag,
    updateDrag,
    endDrag,
    updateHover,
    render,
    updateOptimizationConfig
  }
}
