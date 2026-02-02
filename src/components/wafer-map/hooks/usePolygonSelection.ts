/**
 * 多边形框选 Hook
 * 负责多边形顶点的添加、绘制和完成逻辑
 */

import { ref, computed } from 'vue'
import { isPointInPolygon, isRectIntersectPolygon } from '../utils/polygonUtils'
import type { DiePosition } from '../types'

export interface PolygonPoint {
  x: number
  y: number
}

export function usePolygonSelection() {
  // 多边形顶点
  const points = ref<PolygonPoint[]>([])

  // 是否已完成
  const isComplete = ref(false)

  // 是否激活（是否在多边形模式下）
  const isActive = ref(false)

  /**
   * 添加顶点
   */
  const addPoint = (x: number, y: number) => {
    points.value.push({ x, y })
  }

  /**
   * 移除最后一个顶点
   */
  const removeLastPoint = () => {
    if (points.value.length > 0) {
      points.value.pop()
    }
  }

  /**
   * 清空多边形
   */
  const clear = () => {
    points.value = []
    isComplete.value = false
  }

  /**
   * 完成多边形
   */
  const complete = () => {
    if (points.value.length >= 3) {
      isComplete.value = true
      return true
    }
    return false
  }

  /**
   * 获取多边形内的 Die
   */
  const getDiesInPolygon = (diePositions: DiePosition[], dieWidth: number, dieHeight: number) => {
    const dies: DiePosition[] = []

    diePositions.forEach(die => {
      // 检查 Die 的中心点或矩形是否在多边形内
      const dieCenter = {
        x: die.canvasX + dieWidth / 2,
        y: die.canvasY + dieHeight / 2
      }

      const dieRect = {
        x: die.canvasX,
        y: die.canvasY,
        width: dieWidth,
        height: dieHeight
      }

      if (
        isPointInPolygon(dieCenter, points.value) ||
        isRectIntersectPolygon(dieRect, points.value)
      ) {
        dies.push(die)
      }
    })

    return dies
  }

  /**
   * 绘制多边形
   */
  const render = (ctx: CanvasRenderingContext2D, canvasWidth: number) => {
    if (!isActive.value) return

    ctx.save()
    // 重置变换，使用屏幕坐标系
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // 显示操作提示
    if (points.value.length === 0) {
      ctx.fillStyle = '#409EFF'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.fillText('点击添加多边形顶点，右键或双击完成', canvasWidth / 2, 40)
      ctx.shadowBlur = 0
    }

    if (points.value.length > 0) {
      // 绘制线段的阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // 绘制已有的线段
      ctx.strokeStyle = '#409EFF'
      ctx.lineWidth = 5
      ctx.setLineDash([10, 6])
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(points.value[0].x, points.value[0].y)
      for (let i = 1; i < points.value.length; i++) {
        ctx.lineTo(points.value[i].x, points.value[i].y)
      }
      ctx.stroke()

      // 重置阴影
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // 绘制顶点
      points.value.forEach((point, index) => {
        // 绘制外圈光晕
        ctx.beginPath()
        ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
        ctx.fillStyle = index === 0 ? 'rgba(103, 194, 58, 0.3)' : 'rgba(64, 158, 255, 0.3)'
        ctx.fill()

        // 绘制中圈
        ctx.beginPath()
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2)
        ctx.fillStyle = index === 0 ? '#67C23A' : '#409EFF'
        ctx.fill()

        // 绘制白色边框
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.stroke()

        // 绘制内圈高光
        ctx.beginPath()
        ctx.arc(point.x - 2, point.y - 2, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fill()
      })

      // 显示点数提示
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(8, 8, 200, 70)

      ctx.strokeStyle = '#409EFF'
      ctx.lineWidth = 2
      ctx.strokeRect(8, 8, 200, 70)

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`已添加 ${points.value.length} 个点`, 20, 35)

      if (points.value.length >= 3) {
        ctx.fillStyle = '#67C23A'
        ctx.font = 'bold 14px Arial'
        ctx.fillText('✓ 右键或双击完成', 20, 60)
      } else {
        ctx.fillStyle = '#E6A23C'
        ctx.font = 'bold 14px Arial'
        ctx.fillText(`⚠ 还需 ${3 - points.value.length} 个点`, 20, 60)
      }

      // 如果多边形已完成，绘制闭合线和填充
      if (isComplete.value && points.value.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(points.value[0].x, points.value[0].y)
        for (let i = 1; i < points.value.length; i++) {
          ctx.lineTo(points.value[i].x, points.value[i].y)
        }
        ctx.closePath()

        // 填充
        ctx.fillStyle = 'rgba(64, 158, 255, 0.3)'
        ctx.fill()

        // 边框
        ctx.setLineDash([])
        ctx.strokeStyle = '#409EFF'
        ctx.lineWidth = 5
        ctx.stroke()
      }
    }

    ctx.restore()
  }

  // 计算属性
  const pointCount = computed(() => points.value.length)
  const canComplete = computed(() => points.value.length >= 3)

  return {
    // 状态
    points,
    isComplete,
    isActive,
    pointCount,
    canComplete,

    // 方法
    addPoint,
    removeLastPoint,
    clear,
    complete,
    getDiesInPolygon,
    render
  }
}
