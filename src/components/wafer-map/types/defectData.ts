/**
 * 新的坏点数据格式类型定义
 */

/**
 * 坏点数据格式 - 数组形式
 * logicx 和 logicy 是对应的坐标数组
 */
export interface DefectArrayData {
  logicx: number[] // X 坐标数组
  logicy: number[] // Y 坐标数组
  defectType?: string[] // 坏点类型数组（可选）
  [key: string]: number[] | string[] | undefined // 其他扩展字段
}

/**
 * 单个坏点信息
 */
export interface DefectPoint {
  x: number // X 坐标
  y: number // Y 坐标
  type?: string // 坏点类型
  index: number // 在原始数据中的索引
  [key: string]: string | number | undefined // 其他扩展属性
}

/**
 * 选中的坏点信息（用于绘制信息框）
 */
export interface SelectedDefectInfo extends DefectPoint {
  canvasX: number // Canvas 上的 X 坐标
  canvasY: number // Canvas 上的 Y 坐标
  labelX: number // 信息框 X 坐标
  labelY: number // 信息框 Y 坐标
  labelHeight: number // 信息框高度
}

/**
 * 数据转换工具
 */
export class DefectDataConverter {
  /**
   * 将数组格式转换为点数组
   */
  static arrayToPoints(data: DefectArrayData): DefectPoint[] {
    const { logicx, logicy, defectType, ...rest } = data
    const length = Math.min(logicx.length, logicy.length)
    const points: DefectPoint[] = []

    for (let i = 0; i < length; i++) {
      const point: DefectPoint = {
        x: logicx[i],
        y: logicy[i],
        index: i
      }

      if (defectType && defectType[i]) {
        point.type = defectType[i]
      }

      // 添加其他扩展字段
      for (const key in rest) {
        const value = rest[key]
        if (Array.isArray(value) && value[i] !== undefined) {
          point[key] = value[i]
        }
      }

      points.push(point)
    }

    return points
  }

  /**
   * 将点数组转换为数组格式
   */
  static pointsToArray(points: DefectPoint[]): DefectArrayData {
    const logicx: number[] = []
    const logicy: number[] = []
    const defectType: string[] = []
    const extraFields: Record<string, (string | number)[]> = {}

    points.forEach(point => {
      logicx.push(point.x)
      logicy.push(point.y)

      if (point.type) {
        defectType.push(point.type)
      }

      // 处理其他字段
      for (const key in point) {
        if (key !== 'x' && key !== 'y' && key !== 'type' && key !== 'index') {
          if (!extraFields[key]) {
            extraFields[key] = []
          }
          extraFields[key].push(point[key])
        }
      }
    })

    const result: DefectArrayData = { logicx, logicy }

    if (defectType.length > 0) {
      result.defectType = defectType
    }

    // 添加其他字段
    Object.assign(result, extraFields)

    return result
  }

  /**
   * 验证数据格式
   */
  static validate(data: DefectArrayData): boolean {
    if (!data.logicx || !data.logicy) {
      return false
    }

    if (!Array.isArray(data.logicx) || !Array.isArray(data.logicy)) {
      return false
    }

    if (data.logicx.length !== data.logicy.length) {
      return false
    }

    return true
  }
}
