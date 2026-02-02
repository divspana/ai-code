/**
 * 坏点选择 Hook
 * 负责根据选中的 Die 获取和管理坏点数据
 */

import { ref } from 'vue'
import type { Defect, DieInfo, DiePosition } from '../types'
import { initializeLabelPosition } from '../utils/labelLayout'

export interface SelectedDefect {
  x: number
  y: number
  type: string
  dieRow: number
  dieCol: number
  relX: number
  relY: number
  labelX: number
  labelY: number
  labelHeight: number
}

export function useDefectSelection() {
  // 选中的坏点
  const selectedDefects = ref<SelectedDefect[]>([])

  // 是否只显示选中的坏点
  const showOnlySelected = ref(false)

  /**
   * 根据选中的 Die 获取坏点
   */
  const getDefectsInDies = (
    dies: DieInfo[],
    allDefects: Defect[],
    diePositions: DiePosition[],
    scale: number,
    canvasSize: number,
    labelWidth: number,
    labelHeight: number
  ) => {
    const selected: SelectedDefect[] = []

    dies.forEach(die => {
      // 找到对应的 Die 位置
      const diePos = diePositions.find(d => d.row === die.row && d.col === die.col)
      if (!diePos) return

      // 找到该 Die 内的所有坏点
      const defectsInDie = allDefects.filter(d => d.dieRow === die.row && d.dieCol === die.col)

      defectsInDie.forEach(defect => {
        // 计算坏点在画布上的坐标
        const x = diePos.canvasX + defect.x * scale
        const y = diePos.canvasY + defect.y * scale

        // 初始化信息框位置
        const { labelX, labelY } = initializeLabelPosition(
          x,
          y,
          labelWidth,
          labelHeight,
          canvasSize
        )

        selected.push({
          x,
          y,
          type: defect.type,
          dieRow: defect.dieRow,
          dieCol: defect.dieCol,
          relX: defect.x,
          relY: defect.y,
          labelX,
          labelY,
          labelHeight
        })
      })
    })

    selectedDefects.value = selected
    showOnlySelected.value = true
  }

  /**
   * 清除选择
   */
  const clearSelection = () => {
    selectedDefects.value = []
    showOnlySelected.value = false
  }

  /**
   * 更新信息框位置
   */
  const updateLabelPosition = (index: number, x: number, y: number) => {
    if (selectedDefects.value[index]) {
      selectedDefects.value[index].labelX = x
      selectedDefects.value[index].labelY = y
    }
  }

  return {
    // 状态
    selectedDefects,
    showOnlySelected,

    // 方法
    getDefectsInDies,
    clearSelection,
    updateLabelPosition
  }
}
