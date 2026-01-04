import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface TableRow {
  id: string | number
  [key: string]: any
}

export interface RowDifference {
  rowIndex: number
  diffCount: number
  diffFields: string[]
  leftData: TableRow
  rightData: TableRow
}

export interface DataComparisonOptions {
  leftData: TableRow[]
  rightData: TableRow[]
  columns: string[] // 需要比较的列
  idField?: string // 用于匹配行的字段，默认为 'id'
}

export interface DataComparisonReturn {
  differences: Ref<RowDifference[]>
  leftTableData: Ref<TableRow[]>
  rightTableData: Ref<TableRow[]>
  applyLeftToRight: (rowIndex: number) => void
  applyRightToLeft: (rowIndex: number) => void
  applyAllLeftToRight: () => void
  applyAllRightToLeft: () => void
  updateLeftCell: (rowIndex: number, field: string, value: any) => void
  updateRightCell: (rowIndex: number, field: string, value: any) => void
  recompare: () => void
}

/**
 * 数据对比 Composable
 */
export function useDataComparison(options: DataComparisonOptions): DataComparisonReturn {
  const { columns, idField = 'id' } = options

  const leftTableData = ref<TableRow[]>([...options.leftData])
  const rightTableData = ref<TableRow[]>([...options.rightData])
  const differences = ref<RowDifference[]>([])

  /**
   * 比较两行数据
   */
  const compareRows = (leftRow: TableRow, rightRow: TableRow): { count: number; fields: string[] } => {
    let diffCount = 0
    const diffFields: string[] = []

    for (const column of columns) {
      if (leftRow[column] !== rightRow[column]) {
        diffCount++
        diffFields.push(column)
      }
    }

    return { count: diffCount, fields: diffFields }
  }

  /**
   * 重新计算差异
   */
  const recompare = () => {
    const diffs: RowDifference[] = []
    const maxLength = Math.max(leftTableData.value.length, rightTableData.value.length)

    let totalDiffCount = 0
    for (let i = 0; i < maxLength; i++) {
      const leftRow = leftTableData.value[i]
      const rightRow = rightTableData.value[i]

      if (!leftRow || !rightRow) {
        // 如果某一侧没有数据，视为完全不同
        diffs.push({
          rowIndex: i,
          diffCount: columns.length,
          diffFields: [...columns],
          leftData: leftRow || ({} as TableRow),
          rightData: rightRow || ({} as TableRow)
        })
        totalDiffCount++
      } else {
        const { count, fields } = compareRows(leftRow, rightRow)
        if (count > 0) {
          totalDiffCount++
        }
        diffs.push({
          rowIndex: i,
          diffCount: count,
          diffFields: fields,
          leftData: leftRow,
          rightData: rightRow
        })
      }
    }

    differences.value = diffs
    console.log(`差异计算完成: 总行数 ${maxLength}, 差异行数 ${totalDiffCount}`)
    if (totalDiffCount > 0) {
      const firstDiff = diffs.find(d => d.diffCount > 0)
      if (firstDiff) {
        console.log('第一个差异行:', firstDiff)
      }
    }
  }

  /**
   * 应用左表数据到右表（单行）
   */
  const applyLeftToRight = (rowIndex: number) => {
    const leftRow = leftTableData.value[rowIndex]
    if (leftRow && rightTableData.value[rowIndex]) {
      rightTableData.value[rowIndex] = { ...leftRow }
      recompare()
    }
  }

  /**
   * 应用右表数据到左表（单行）
   */
  const applyRightToLeft = (rowIndex: number) => {
    const rightRow = rightTableData.value[rowIndex]
    if (rightRow && leftTableData.value[rowIndex]) {
      leftTableData.value[rowIndex] = { ...rightRow }
      recompare()
    }
  }

  /**
   * 应用所有左表数据到右表
   */
  const applyAllLeftToRight = () => {
    rightTableData.value = leftTableData.value.map(row => ({ ...row }))
    recompare()
  }

  /**
   * 应用所有右表数据到左表
   */
  const applyAllRightToLeft = () => {
    leftTableData.value = rightTableData.value.map(row => ({ ...row }))
    recompare()
  }

  /**
   * 更新左表单元格
   */
  const updateLeftCell = (rowIndex: number, field: string, value: any) => {
    if (leftTableData.value[rowIndex]) {
      leftTableData.value[rowIndex][field] = value
      recompare()
    }
  }

  /**
   * 更新右表单元格
   */
  const updateRightCell = (rowIndex: number, field: string, value: any) => {
    if (rightTableData.value[rowIndex]) {
      rightTableData.value[rowIndex][field] = value
      recompare()
    }
  }

  // 初始化时计算差异
  recompare()

  return {
    differences,
    leftTableData,
    rightTableData,
    applyLeftToRight,
    applyRightToLeft,
    applyAllLeftToRight,
    applyAllRightToLeft,
    updateLeftCell,
    updateRightCell,
    recompare
  }
}
