/**
 * 性能管理 Hook
 * 负责性能监控、FPS 统计、视口计算等
 */

import { ref, computed } from 'vue'
import type { Viewport, PerformanceStats } from '../types'
import { PERFORMANCE_THRESHOLDS } from '../constants'

export function usePerformance() {
  // 性能统计
  const frameTimeSamples = ref<number[]>([])
  const maxSamples = 60

  const stats = ref<PerformanceStats>({
    fps: 0,
    renderTime: 0,
    defectsRendered: 0,
    defectsTotal: 0,
    lodLevel: 0
  })

  /**
   * 记录帧时间
   */
  const recordFrameTime = (time: number) => {
    frameTimeSamples.value.push(time)
    if (frameTimeSamples.value.length > maxSamples) {
      frameTimeSamples.value.shift()
    }

    // 更新统计
    stats.value.renderTime = time
    stats.value.fps = calculateFPS()
  }

  /**
   * 计算 FPS
   */
  const calculateFPS = (): number => {
    if (frameTimeSamples.value.length === 0) return 0
    const avgTime =
      frameTimeSamples.value.reduce((a, b) => a + b, 0) / frameTimeSamples.value.length
    return avgTime > 0 ? 1000 / avgTime : 0
  }

  /**
   * 计算视口
   */
  const calculateViewport = (
    canvasWidth: number,
    canvasHeight: number,
    zoom: number = 1,
    panX: number = 0,
    panY: number = 0
  ): Viewport => {
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
   * 计算 LOD 级别
   */
  const calculateLODLevel = (zoom: number, dataCount: number): number => {
    if (zoom > 2) {
      // 放大：显示更多细节
      if (dataCount < 50000) return 0
      if (dataCount < 200000) return 1
      return 2
    } else if (zoom > 1) {
      // 正常缩放
      if (dataCount < 10000) return 0
      if (dataCount < 100000) return 1
      if (dataCount < 500000) return 2
      return 3
    } else {
      // 缩小：显示更少细节
      if (dataCount < 5000) return 0
      if (dataCount < 50000) return 1
      if (dataCount < 200000) return 2
      return 3
    }
  }

  /**
   * 检查性能是否良好
   */
  const isPerformanceGood = computed(() => {
    return stats.value.fps >= PERFORMANCE_THRESHOLDS.MIN_FPS
  })

  /**
   * 获取性能建议
   */
  const getPerformanceSuggestion = (): string => {
    if (stats.value.fps < PERFORMANCE_THRESHOLDS.MIN_FPS) {
      return '性能较低，建议启用数据抽稀或减少缺陷数量'
    }
    if (stats.value.renderTime > PERFORMANCE_THRESHOLDS.WARNING_RENDER_TIME) {
      return '渲染时间较长，建议启用视口裁剪'
    }
    return '性能良好'
  }

  /**
   * 更新缺陷统计
   */
  const updateDefectStats = (rendered: number, total: number) => {
    stats.value.defectsRendered = rendered
    stats.value.defectsTotal = total
  }

  /**
   * 更新 LOD 级别
   */
  const updateLODLevel = (level: number) => {
    stats.value.lodLevel = level
  }

  /**
   * 重置统计
   */
  const reset = () => {
    frameTimeSamples.value = []
    stats.value = {
      fps: 0,
      renderTime: 0,
      defectsRendered: 0,
      defectsTotal: 0,
      lodLevel: 0
    }
  }

  return {
    // 状态
    stats,
    isPerformanceGood,

    // 方法
    recordFrameTime,
    calculateFPS,
    calculateViewport,
    calculateLODLevel,
    getPerformanceSuggestion,
    updateDefectStats,
    updateLODLevel,
    reset
  }
}
