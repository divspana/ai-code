/**
 * 数据验证工具
 */

import { ConfigValidationError } from '../errors'
import type { WaferConfig, Defect } from '../types'

export class Validators {
  /**
   * 验证值为正数
   */
  static isPositive(value: number, name: string): void {
    if (value <= 0) {
      throw new ConfigValidationError(name, value, 'must be positive')
    }
  }

  /**
   * 验证值在范围内
   */
  static isInRange(value: number, min: number, max: number, name: string): void {
    if (value < min || value > max) {
      throw new ConfigValidationError(name, value, `must be between ${min} and ${max}`)
    }
  }

  /**
   * 验证数组非空
   */
  static isNotEmpty<T>(array: T[], name: string): void {
    if (array.length === 0) {
      throw new ConfigValidationError(name, array, 'cannot be empty')
    }
  }

  /**
   * 验证值非空
   */
  static isNotNull<T>(value: T | null | undefined, name: string): asserts value is T {
    if (value === null || value === undefined) {
      throw new ConfigValidationError(name, value, 'cannot be null or undefined')
    }
  }

  /**
   * 验证 Wafer 配置
   */
  static validateWaferConfig(config: WaferConfig): void {
    // 晶圆参数
    this.isPositive(config.diameter, 'diameter')
    this.isInRange(config.edgeExclusion, 0, config.diameter / 2, 'edgeExclusion')

    // Die 参数
    this.isPositive(config.dieWidth, 'dieWidth')
    this.isPositive(config.dieHeight, 'dieHeight')

    // Scribe Line
    if (config.scribeLineX < 0) {
      throw new ConfigValidationError('scribeLineX', config.scribeLineX, 'cannot be negative')
    }
    if (config.scribeLineY < 0) {
      throw new ConfigValidationError('scribeLineY', config.scribeLineY, 'cannot be negative')
    }

    // Reticle
    this.isPositive(config.reticleX, 'reticleX')
    this.isPositive(config.reticleY, 'reticleY')

    // 检查 Die 尺寸是否合理
    const maxDieSize = config.diameter / 2
    if (config.dieWidth > maxDieSize || config.dieHeight > maxDieSize) {
      throw new ConfigValidationError(
        'dieSize',
        `${config.dieWidth}x${config.dieHeight}`,
        `too large for wafer diameter ${config.diameter}`
      )
    }
  }

  /**
   * 验证缺陷数据
   */
  static validateDefect(defect: Defect): void {
    // 验证 Die 坐标
    if (!Number.isInteger(defect.dieRow) || !Number.isInteger(defect.dieCol)) {
      throw new ConfigValidationError(
        'diePosition',
        `(${defect.dieRow}, ${defect.dieCol})`,
        'must be integers'
      )
    }

    // 验证相对位置 (0-1)
    this.isInRange(defect.x, 0, 1, 'defect.x')
    this.isInRange(defect.y, 0, 1, 'defect.y')

    // 验证尺寸
    if (defect.size !== undefined) {
      this.isPositive(defect.size, 'defect.size')
    }

    // 验证类型
    if (!defect.type || defect.type.trim() === '') {
      throw new ConfigValidationError('defect.type', defect.type, 'cannot be empty')
    }
  }

  /**
   * 批量验证缺陷数据
   */
  static validateDefects(defects: Defect[]): void {
    defects.forEach((defect, index) => {
      try {
        this.validateDefect(defect)
      } catch (error) {
        if (error instanceof ConfigValidationError) {
          throw new ConfigValidationError(`defects[${index}]`, defect, error.message)
        }
        throw error
      }
    })
  }
}
