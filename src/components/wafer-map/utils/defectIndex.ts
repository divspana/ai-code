/**
 * 坏点索引系统
 * 用于高效查找和过滤坏点数据
 */

import type { Defect } from '../types'

/**
 * Die 索引：将坏点按 Die 分组
 */
export class DefectDieIndex {
  private index: Map<string, Defect[]>
  private diePositionIndex: Map<string, { canvasX: number; canvasY: number }>

  constructor() {
    this.index = new Map()
    this.diePositionIndex = new Map()
  }

  /**
   * 构建索引
   * 时间复杂度: O(n) - n是坏点总数
   */
  buildIndex(defects: Defect[]): void {
    this.index.clear()

    defects.forEach(defect => {
      const key = this.getDieKey(defect.dieRow, defect.dieCol)

      if (!this.index.has(key)) {
        this.index.set(key, [])
      }

      this.index.get(key)!.push(defect)
    })
  }

  /**
   * 构建 Die 位置索引
   * 时间复杂度: O(m) - m是Die总数
   */
  buildDiePositionIndex(
    diePositions: Array<{ row: number; col: number; canvasX: number; canvasY: number }>
  ): void {
    this.diePositionIndex.clear()

    diePositions.forEach(pos => {
      const key = this.getDieKey(pos.row, pos.col)
      this.diePositionIndex.set(key, {
        canvasX: pos.canvasX,
        canvasY: pos.canvasY
      })
    })
  }

  /**
   * 获取指定 Die 上的所有坏点
   * 时间复杂度: O(1)
   */
  getDefectsByDie(dieRow: number, dieCol: number): Defect[] {
    const key = this.getDieKey(dieRow, dieCol)
    return this.index.get(key) || []
  }

  /**
   * 批量获取多个 Die 上的坏点
   * 时间复杂度: O(k) - k是选中的Die数量
   */
  getDefectsByDies(dies: Array<{ row: number; col: number }>): Defect[] {
    const result: Defect[] = []

    dies.forEach(die => {
      const defects = this.getDefectsByDie(die.row, die.col)
      result.push(...defects)
    })

    return result
  }

  /**
   * 获取 Die 的 Canvas 位置
   * 时间复杂度: O(1)
   */
  getDiePosition(dieRow: number, dieCol: number): { canvasX: number; canvasY: number } | null {
    const key = this.getDieKey(dieRow, dieCol)
    return this.diePositionIndex.get(key) || null
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalDefects: number
    dieCount: number
    avgDefectsPerDie: number
    maxDefectsPerDie: number
  } {
    let totalDefects = 0
    let maxDefectsPerDie = 0

    this.index.forEach(defects => {
      totalDefects += defects.length
      maxDefectsPerDie = Math.max(maxDefectsPerDie, defects.length)
    })

    return {
      totalDefects,
      dieCount: this.index.size,
      avgDefectsPerDie: this.index.size > 0 ? totalDefects / this.index.size : 0,
      maxDefectsPerDie
    }
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.index.clear()
    this.diePositionIndex.clear()
  }

  /**
   * 生成 Die 的唯一键
   */
  private getDieKey(row: number, col: number): string {
    return `${row},${col}`
  }
}

/**
 * 空间分区索引：用于快速范围查询
 */
export class SpatialIndex {
  private grid: Map<string, Defect[]>
  private cellSize: number

  constructor(cellSize: number = 10) {
    this.grid = new Map()
    this.cellSize = cellSize
  }

  /**
   * 构建空间索引
   */
  buildIndex(defects: Defect[]): void {
    this.grid.clear()

    defects.forEach(defect => {
      const key = this.getCellKey(defect.dieRow, defect.dieCol)

      if (!this.grid.has(key)) {
        this.grid.set(key, [])
      }

      this.grid.get(key)!.push(defect)
    })
  }

  /**
   * 范围查询：获取指定区域内的坏点
   */
  queryRange(minRow: number, maxRow: number, minCol: number, maxCol: number): Defect[] {
    const result: Defect[] = []
    const minCellRow = Math.floor(minRow / this.cellSize)
    const maxCellRow = Math.floor(maxRow / this.cellSize)
    const minCellCol = Math.floor(minCol / this.cellSize)
    const maxCellCol = Math.floor(maxCol / this.cellSize)

    for (let cellRow = minCellRow; cellRow <= maxCellRow; cellRow++) {
      for (let cellCol = minCellCol; cellCol <= maxCellCol; cellCol++) {
        const key = `${cellRow},${cellCol}`
        const defects = this.grid.get(key)

        if (defects) {
          // 精确过滤
          defects.forEach(defect => {
            if (
              defect.dieRow >= minRow &&
              defect.dieRow <= maxRow &&
              defect.dieCol >= minCol &&
              defect.dieCol <= maxCol
            ) {
              result.push(defect)
            }
          })
        }
      }
    }

    return result
  }

  private getCellKey(row: number, col: number): string {
    const cellRow = Math.floor(row / this.cellSize)
    const cellCol = Math.floor(col / this.cellSize)
    return `${cellRow},${cellCol}`
  }

  clear(): void {
    this.grid.clear()
  }
}

/**
 * 创建坏点索引
 */
export function createDefectIndex(): DefectDieIndex {
  return new DefectDieIndex()
}

/**
 * 创建空间索引
 */
export function createSpatialIndex(cellSize?: number): SpatialIndex {
  return new SpatialIndex(cellSize)
}
