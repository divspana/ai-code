/**
 * 坏点索引 Hook
 * 提供高效的坏点查找和过滤功能
 */

import { ref, watch, type Ref } from 'vue'
import { createDefectIndex, createSpatialIndex } from '../utils/defectIndex'
import type { Defect } from '../types'

export interface DefectIndexOptions {
  defects: Ref<Defect[]>
  diePositions: Ref<Array<{ row: number; col: number; canvasX: number; canvasY: number }>>
  autoRebuild?: boolean // 是否自动重建索引
}

export function useDefectIndex(options: DefectIndexOptions) {
  const { defects, diePositions, autoRebuild = true } = options

  // 创建索引实例
  const dieIndex = createDefectIndex()
  const spatialIndex = createSpatialIndex(10)

  // 索引状态
  const isIndexBuilt = ref(false)
  const indexStats = ref({
    totalDefects: 0,
    dieCount: 0,
    avgDefectsPerDie: 0,
    maxDefectsPerDie: 0,
    buildTime: 0
  })

  /**
   * 构建索引
   */
  const buildIndex = () => {
    const startTime = performance.now()

    // 构建 Die 索引
    dieIndex.buildIndex(defects.value)

    // 构建 Die 位置索引
    dieIndex.buildDiePositionIndex(diePositions.value)

    // 构建空间索引
    spatialIndex.buildIndex(defects.value)

    const endTime = performance.now()

    // 更新统计信息
    const stats = dieIndex.getStats()
    indexStats.value = {
      ...stats,
      buildTime: Math.round(endTime - startTime)
    }

    isIndexBuilt.value = true

    console.log(`[DefectIndex] 索引构建完成:`, {
      总坏点数: stats.totalDefects,
      Die数量: stats.dieCount,
      平均每Die坏点数: stats.avgDefectsPerDie.toFixed(1),
      最大每Die坏点数: stats.maxDefectsPerDie,
      构建耗时: `${indexStats.value.buildTime}ms`
    })
  }

  /**
   * 重建索引
   */
  const rebuildIndex = () => {
    dieIndex.clear()
    spatialIndex.clear()
    buildIndex()
  }

  /**
   * 获取指定 Die 上的坏点
   * 时间复杂度: O(1)
   */
  const getDefectsByDie = (dieRow: number, dieCol: number): Defect[] => {
    if (!isIndexBuilt.value) {
      buildIndex()
    }
    return dieIndex.getDefectsByDie(dieRow, dieCol)
  }

  /**
   * 批量获取多个 Die 上的坏点（优化版）
   * 时间复杂度: O(k) - k是选中的Die数量
   *
   * 性能对比：
   * - 原始方法: O(n) - n是所有坏点数（100w）
   * - 优化方法: O(k) - k是选中的Die数（通常 < 100）
   */
  const getDefectsByDies = (dies: Array<{ row: number; col: number }>): Defect[] => {
    if (!isIndexBuilt.value) {
      buildIndex()
    }

    const startTime = performance.now()
    const result = dieIndex.getDefectsByDies(dies)
    const endTime = performance.now()

    console.log(`[DefectIndex] 查询完成:`, {
      选中Die数: dies.length,
      找到坏点数: result.length,
      查询耗时: `${(endTime - startTime).toFixed(2)}ms`
    })

    return result
  }

  /**
   * 获取 Die 的 Canvas 位置
   * 时间复杂度: O(1)
   */
  const getDiePosition = (dieRow: number, dieCol: number) => {
    if (!isIndexBuilt.value) {
      buildIndex()
    }
    return dieIndex.getDiePosition(dieRow, dieCol)
  }

  /**
   * 范围查询：获取指定区域内的坏点
   */
  const queryRange = (minRow: number, maxRow: number, minCol: number, maxCol: number): Defect[] => {
    if (!isIndexBuilt.value) {
      buildIndex()
    }
    return spatialIndex.queryRange(minRow, maxRow, minCol, maxCol)
  }

  /**
   * 清空索引
   */
  const clearIndex = () => {
    dieIndex.clear()
    spatialIndex.clear()
    isIndexBuilt.value = false
  }

  // 自动重建索引
  if (autoRebuild) {
    watch(
      () => defects.value,
      () => {
        if (defects.value.length > 0) {
          rebuildIndex()
        }
      },
      { immediate: true }
    )

    watch(
      () => diePositions.value,
      () => {
        if (diePositions.value.length > 0 && defects.value.length > 0) {
          rebuildIndex()
        }
      }
    )
  }

  return {
    // 状态
    isIndexBuilt,
    indexStats,

    // 方法
    buildIndex,
    rebuildIndex,
    getDefectsByDie,
    getDefectsByDies,
    getDiePosition,
    queryRange,
    clearIndex
  }
}
