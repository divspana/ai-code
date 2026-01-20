/**
 * Wafer 配置预设
 */

import type { WaferConfig } from '../types'

/**
 * 300mm 晶圆预设
 */
export const WAFER_300MM: WaferConfig = {
  diameter: 300,
  edgeExclusion: 3,
  notch: 'DOWN',
  dieWidth: 10,
  dieHeight: 10,
  dieOffsetX: 0,
  dieOffsetY: 0,
  scribeLineX: 0.2,
  scribeLineY: 0.2,
  reticleX: 2,
  reticleY: 2,
  showReticleBorder: false,
  xPositive: 'RIGHT',
  yPositive: 'UP'
}

/**
 * 200mm 晶圆预设
 */
export const WAFER_200MM: WaferConfig = {
  diameter: 200,
  edgeExclusion: 2,
  notch: 'DOWN',
  dieWidth: 8,
  dieHeight: 8,
  dieOffsetX: 0,
  dieOffsetY: 0,
  scribeLineX: 0.15,
  scribeLineY: 0.15,
  reticleX: 2,
  reticleY: 2,
  showReticleBorder: false,
  xPositive: 'RIGHT',
  yPositive: 'UP'
}

/**
 * 150mm 晶圆预设
 */
export const WAFER_150MM: WaferConfig = {
  diameter: 150,
  edgeExclusion: 1.5,
  notch: 'DOWN',
  dieWidth: 6,
  dieHeight: 6,
  dieOffsetX: 0,
  dieOffsetY: 0,
  scribeLineX: 0.1,
  scribeLineY: 0.1,
  reticleX: 1,
  reticleY: 1,
  showReticleBorder: false,
  xPositive: 'RIGHT',
  yPositive: 'UP'
}

/**
 * 所有预设配置
 */
export const WAFER_PRESETS = {
  WAFER_300MM,
  WAFER_200MM,
  WAFER_150MM
} as const

export type WaferPresetName = keyof typeof WAFER_PRESETS

/**
 * 获取预设配置
 */
export function getPreset(name: WaferPresetName): WaferConfig {
  return { ...WAFER_PRESETS[name] }
}

/**
 * 创建自定义配置（基于预设）
 */
export function createConfig(
  preset: WaferPresetName,
  overrides?: Partial<WaferConfig>
): WaferConfig {
  return {
    ...WAFER_PRESETS[preset],
    ...overrides
  }
}
