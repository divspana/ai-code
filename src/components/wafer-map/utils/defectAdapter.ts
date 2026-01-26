/**
 * 坏点数据适配器
 * 用于处理和转换坏点数据
 */

import type { DefectArrayData, DefectPoint } from '../types/defectData'
import { DefectDataConverter } from '../types/defectData'

export interface WaferCoordinate {
  dieRow: number
  dieCol: number
  x: number // 在 Die 内的相对位置 (0-1)
  y: number // 在 Die 内的相对位置 (0-1)
}

/**
 * 坐标转换配置
 */
export interface CoordinateConfig {
  waferRows: number // 晶圆行数
  waferCols: number // 晶圆列数
  dieWidth: number // Die 宽度
  dieHeight: number // Die 高度
}

/**
 * 坐标适配器
 */
export class DefectAdapter {
  private config: CoordinateConfig

  constructor(config: CoordinateConfig) {
    this.config = config
  }

  /**
   * 将逻辑坐标转换为 Die 坐标
   * 假设 logicx 和 logicy 是晶圆上的绝对坐标
   */
  logicToWafer(logicX: number, logicY: number): WaferCoordinate {
    const { waferRows, waferCols, dieWidth, dieHeight } = this.config

    // 计算在哪个 Die 上
    const dieCol = Math.floor(logicX / dieWidth)
    const dieRow = Math.floor(logicY / dieHeight)

    // 计算在 Die 内的相对位置 (0-1)
    const x = (logicX % dieWidth) / dieWidth
    const y = (logicY % dieHeight) / dieHeight

    return {
      dieRow: Math.min(dieRow, waferRows - 1),
      dieCol: Math.min(dieCol, waferCols - 1),
      x,
      y
    }
  }

  /**
   * 批量转换坐标
   */
  convertArrayData(data: DefectArrayData): Array<DefectPoint & WaferCoordinate> {
    if (!DefectDataConverter.validate(data)) {
      throw new Error('Invalid defect data format')
    }

    const points = DefectDataConverter.arrayToPoints(data)

    return points.map(point => {
      const waferCoord = this.logicToWafer(point.x, point.y)
      return {
        ...point,
        ...waferCoord
      }
    })
  }

  /**
   * 过滤指定区域内的坏点
   */
  filterByRegion(
    data: DefectArrayData,
    region: { minX: number; maxX: number; minY: number; maxY: number }
  ): DefectArrayData {
    const points = DefectDataConverter.arrayToPoints(data)
    const filtered = points.filter(
      point =>
        point.x >= region.minX &&
        point.x <= region.maxX &&
        point.y >= region.minY &&
        point.y <= region.maxY
    )
    return DefectDataConverter.pointsToArray(filtered)
  }

  /**
   * 过滤指定 Die 上的坏点
   */
  filterByDies(
    data: DefectArrayData,
    dies: Array<{ row: number; col: number }>
  ): Array<DefectPoint & WaferCoordinate> {
    const converted = this.convertArrayData(data)
    const dieSet = new Set(dies.map(die => `${die.row},${die.col}`))

    return converted.filter(point => {
      const key = `${point.dieRow},${point.dieCol}`
      return dieSet.has(key)
    })
  }

  /**
   * 计算坏点在 Canvas 上的位置
   */
  calculateCanvasPosition(
    point: DefectPoint & WaferCoordinate,
    diePositions: Array<{ row: number; col: number; canvasX: number; canvasY: number }>,
    scale: number
  ): { canvasX: number; canvasY: number } | null {
    const diePos = diePositions.find(d => d.row === point.dieRow && d.col === point.dieCol)

    if (!diePos) {
      return null
    }

    const { dieWidth, dieHeight } = this.config
    const canvasX = diePos.canvasX + point.x * scale * dieWidth
    const canvasY = diePos.canvasY + point.y * scale * dieHeight

    return { canvasX, canvasY }
  }

  /**
   * 批量计算 Canvas 位置
   */
  calculateCanvasPositions(
    points: Array<DefectPoint & WaferCoordinate>,
    diePositions: Array<{ row: number; col: number; canvasX: number; canvasY: number }>,
    scale: number
  ): Array<DefectPoint & WaferCoordinate & { canvasX: number; canvasY: number }> {
    return points
      .map(point => {
        const pos = this.calculateCanvasPosition(point, diePositions, scale)
        if (!pos) return null
        return { ...point, ...pos }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
  }
}

/**
 * 创建默认适配器
 */
export function createDefectAdapter(config: CoordinateConfig): DefectAdapter {
  return new DefectAdapter(config)
}
