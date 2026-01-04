<template>
  <div class="data-comparison-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="total-info">总行数: {{ totalRows }}</span>
        <span class="diff-info">差异行数: {{ diffRowsCount }}</span>
        <span class="diff-cells-info">差异单元格: {{ totalDiffCells }}</span>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" size="small" @click="handleApplyAllLeft">
          <el-icon><DArrowLeft /></el-icon>
          全部应用左表
        </el-button>
        <el-button type="primary" size="small" @click="handleApplyAllRight">
          全部应用右表
          <el-icon><DArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 表格对比区域 -->
    <div class="comparison-wrapper">
      <!-- 差异列 -->
      <div class="diff-column">
        <div class="header-cell">差异</div>
        <div
          class="scroll-container"
          :style="containerStyle"
          @scroll="handleDiffScroll"
          ref="diffScrollRef"
        >
          <div class="scroll-content" :style="contentStyle">
            <div
              v-for="item in visibleData"
              :key="item._virtualIndex"
              class="diff-cell"
              :class="{ 'has-diff': item.diffCount > 0 }"
            >
              {{ item.diffCount }}
            </div>
          </div>
        </div>
      </div>

      <!-- 左表 -->
      <div class="table-wrapper left-table">
        <div class="table-header">
          <div class="header-title">左表数据</div>
          <div class="header-scroll-wrapper" ref="leftHeaderScrollRef">
            <div class="header-row">
              <div v-for="col in columns" :key="col" class="header-cell">
                {{ col }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="scroll-container"
          :style="containerStyle"
          @scroll="handleLeftScroll"
          ref="leftScrollRef"
        >
          <div class="scroll-content" :style="contentStyle">
            <div
              v-for="item in visibleData"
              :key="item._virtualIndex"
              class="table-row"
              :class="{ 'diff-row': item.diffCount > 0 }"
            >
              <div
                v-for="col in columns"
                :key="col"
                class="table-cell"
                :class="{ 
                  'diff-cell-highlight': item.diffFields.includes(col),
                  'cell-selected': isCellSelected(item._virtualIndex, col)
                }"
              >
                <div
                  v-if="editingCell.row === item._virtualIndex && editingCell.col === col && editingCell.side === 'left'"
                  class="cell-editor"
                >
                  <el-input
                    v-model="editValue"
                    size="small"
                    @blur="handleBlur"
                    @keyup.enter="handleBlur"
                    ref="inputRef"
                  />
                </div>
                <div
                  v-else
                  class="cell-content"
                  @click="selectCell(item._virtualIndex, col, 'left')"
                  @dblclick="startEdit(item._virtualIndex, col, 'left', item.leftData[col])"
                >
                  {{ item.leftData[col] }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作列 -->
      <div class="action-column">
        <div class="header-cell">操作</div>
        <div
          class="scroll-container"
          :style="containerStyle"
          @scroll="handleActionScroll"
          ref="actionScrollRef"
        >
          <div class="scroll-content" :style="contentStyle">
            <div
              v-for="item in visibleData"
              :key="item._virtualIndex"
              class="action-cell-row"
            >
              <template v-if="item.diffCount > 0">
                <!-- 差异导航按钮 -->
                <div class="diff-nav-buttons">
                  <el-button
                    size="small"
                    circle
                    @click="navigateToPrevDiff(item._virtualIndex, item.diffFields)"
                    title="上一个差异字段"
                    :disabled="!hasPrevDiff(item._virtualIndex, item.diffFields)"
                  >
                    <el-icon><ArrowLeft /></el-icon>
                  </el-button>
                  <span class="diff-indicator">{{ getCurrentDiffIndex(item._virtualIndex, item.diffFields) }}/{{ item.diffCount }}</span>
                  <el-button
                    size="small"
                    circle
                    @click="navigateToNextDiff(item._virtualIndex, item.diffFields)"
                    title="下一个差异字段"
                    :disabled="!hasNextDiff(item._virtualIndex, item.diffFields)"
                  >
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
                
                <!-- 应用数据按钮 -->
                <div class="apply-buttons">
                  <el-button
                    type="primary"
                    size="small"
                    @click="applyRightToLeft(item._virtualIndex)"
                    title="应用右表数据到左表"
                  >
                    <el-icon><DArrowLeft /></el-icon>
                  </el-button>
                  <el-button
                    type="primary"
                    size="small"
                    @click="applyLeftToRight(item._virtualIndex)"
                    title="应用左表数据到右表"
                  >
                    <el-icon><DArrowRight /></el-icon>
                  </el-button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 右表 -->
      <div class="table-wrapper right-table">
        <div class="table-header">
          <div class="header-title">右表数据</div>
          <div class="header-scroll-wrapper" ref="rightHeaderScrollRef">
            <div class="header-row">
              <div v-for="col in columns" :key="col" class="header-cell">
                {{ col }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="scroll-container"
          :style="containerStyle"
          @scroll="handleRightScroll"
          ref="rightScrollRef"
        >
          <div class="scroll-content" :style="contentStyle">
            <div
              v-for="item in visibleData"
              :key="item._virtualIndex"
              class="table-row"
              :class="{ 'diff-row': item.diffCount > 0 }"
            >
              <div
                v-for="col in columns"
                :key="col"
                class="table-cell"
                :class="{ 
                  'diff-cell-highlight': item.diffFields.includes(col),
                  'cell-selected': isCellSelected(item._virtualIndex, col)
                }"
              >
                <div
                  v-if="editingCell.row === item._virtualIndex && editingCell.col === col && editingCell.side === 'right'"
                  class="cell-editor"
                >
                  <el-input
                    v-model="editValue"
                    size="small"
                    @blur="handleBlur"
                    @keyup.enter="handleBlur"
                    ref="inputRef"
                  />
                </div>
                <div
                  v-else
                  class="cell-content"
                  @click="selectCell(item._virtualIndex, col, 'right')"
                  @dblclick="startEdit(item._virtualIndex, col, 'right', item.rightData[col])"
                >
                  {{ item.rightData[col] }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { DArrowLeft, DArrowRight, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useVirtualScroll } from '@/composables/useVirtualScroll'
import { useDataComparison } from '@/composables/useDataComparison'
import type { TableRow } from '@/composables/useDataComparison'

interface Props {
  leftData: TableRow[]
  rightData: TableRow[]
  columns: string[]
  rowHeight?: number
  containerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  rowHeight: 40,
  containerHeight: 600
})

// 数据对比
const {
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
} = useDataComparison({
  leftData: props.leftData,
  rightData: props.rightData,
  columns: props.columns
})

// 监听 props 变化，更新内部数据
watch(() => [props.leftData, props.rightData], ([newLeft, newRight]) => {
  console.log('Props 数据变化检测到')
  console.log('左表数据长度:', newLeft.length)
  console.log('右表数据长度:', newRight.length)
  if (newLeft.length > 0 && newRight.length > 0) {
    console.log('左表第一行:', newLeft[0])
    console.log('右表第一行:', newRight[0])
  }
  leftTableData.value = [...newLeft]
  rightTableData.value = [...newRight]
  recompare()
}, { deep: true })

// 虚拟滚动 - 增加缓冲区以避免快速滚动时出现空白
const {
  visibleData,
  containerStyle,
  contentStyle,
  scrollTop,
  handleScroll,
  setData
} = useVirtualScroll({
  itemHeight: props.rowHeight,
  bufferSize: 50, // 增加缓冲区到50行，防止快速拖动时出现空白
  containerHeight: props.containerHeight
})

// 设置虚拟滚动数据
watch(differences, (newDiffs) => {
  setData(newDiffs)
}, { immediate: true })

// 滚动引用
const leftScrollRef = ref<HTMLElement>()
const rightScrollRef = ref<HTMLElement>()
const diffScrollRef = ref<HTMLElement>()
const actionScrollRef = ref<HTMLElement>()
const leftHeaderScrollRef = ref<HTMLElement>()
const rightHeaderScrollRef = ref<HTMLElement>()

let isScrolling = false
let isCellScrolling = false

// 同步滚动处理 - 简化逻辑，避免递归调用
const syncScroll = (sourceRef: HTMLElement) => {
  if (isScrolling || isCellScrolling) return
  isScrolling = true

  const scrollTop = sourceRef.scrollTop
  const scrollLeft = sourceRef.scrollLeft

  // 立即同步所有容器的滚动位置
  const allScrollRefs = [
    leftScrollRef.value,
    rightScrollRef.value,
    diffScrollRef.value,
    actionScrollRef.value
  ]

  const allHeaderRefs = [
    leftHeaderScrollRef.value,
    rightHeaderScrollRef.value
  ]

  // 同步所有滚动容器
  allScrollRefs.forEach(ref => {
    if (ref && ref !== sourceRef) {
      ref.scrollTop = scrollTop
      ref.scrollLeft = scrollLeft
    }
  })

  // 同步表头横向滚动
  allHeaderRefs.forEach(ref => {
    if (ref) {
      ref.scrollLeft = scrollLeft
    }
  })

  // 更新虚拟滚动状态
  handleScroll({ target: sourceRef } as any)

  // 延迟重置标志，确保同步完成
  requestAnimationFrame(() => {
    isScrolling = false
  })
}

const handleLeftScroll = (event: Event) => {
  syncScroll(event.target as HTMLElement)
}

const handleRightScroll = (event: Event) => {
  syncScroll(event.target as HTMLElement)
}

const handleDiffScroll = (event: Event) => {
  syncScroll(event.target as HTMLElement)
}

const handleActionScroll = (event: Event) => {
  syncScroll(event.target as HTMLElement)
}

// 单元格选择功能
const selectedCell = ref<{ row: number; col: string } | null>(null)

// 当前行的差异字段导航索引
const currentDiffIndexMap = ref<Map<number, number>>(new Map())

// 选择单元格并联动高亮
const selectCell = (row: number, col: string, side: 'left' | 'right') => {
  console.log('selectCell 被调用:', { row, col, side })
  selectedCell.value = { row, col }
  
  // 使用 nextTick 确保在 DOM 更新后滚动
  nextTick(() => {
    scrollToCenterCell(col, side)
  })
}

// 滚动到指定单元格的中心（仅横向，左右表同步滚动）
const scrollToCenterCell = (colName: string, side: 'left' | 'right') => {
  console.log('scrollToCenterCell 开始执行:', { colName, side })
  
  // 设置标志位，防止同步滚动干扰
  isCellScrolling = true
  
  // 获取左右表的滚动容器和表头容器
  const leftContainer = leftScrollRef.value
  const rightContainer = rightScrollRef.value
  const leftHeader = leftHeaderScrollRef.value
  const rightHeader = rightHeaderScrollRef.value
  
  console.log('滚动容器:', {
    leftContainer: !!leftContainer,
    rightContainer: !!rightContainer,
    leftHeader: !!leftHeader,
    rightHeader: !!rightHeader
  })
  
  if (!leftContainer || !rightContainer) {
    console.error('滚动容器不存在!')
    isCellScrolling = false
    return
  }
  
  // 计算横向滚动位置（使列显示在容器中心）
  const colIndex = props.columns.indexOf(colName)
  const cellWidth = 150 // 单元格宽度
  
  // 获取容器宽度（使用左表容器宽度作为参考）
  const containerWidth = leftContainer.clientWidth
  
  // 目标横向位置 = 列索引 × 列宽 - 容器宽度/2 + 列宽/2
  const targetScrollLeft = colIndex * cellWidth - containerWidth / 2 + cellWidth / 2
  
  // 计算最大滚动距离
  const totalWidth = props.columns.length * cellWidth
  const maxScrollLeft = Math.max(0, totalWidth - containerWidth)
  
  // 确保在有效范围内
  const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft))
  
  console.log('横向滚动计算:', {
    side,
    colName,
    colIndex,
    cellWidth,
    containerWidth,
    totalWidth,
    targetScrollLeft,
    maxScrollLeft,
    finalScrollLeft,
    columnsLength: props.columns.length
  })
  
  // 同步滚动左右表（横向）
  console.log('执行左右表同步滚动:', { left: finalScrollLeft })
  leftContainer.scrollTo({
    left: finalScrollLeft,
    behavior: 'smooth'
  })
  rightContainer.scrollTo({
    left: finalScrollLeft,
    behavior: 'smooth'
  })
  
  // 同步左右表头横向滚动
  if (leftHeader) {
    leftHeader.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    })
  }
  if (rightHeader) {
    rightHeader.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    })
  }
  
  // 滚动完成后重置标志位
  setTimeout(() => {
    isCellScrolling = false
    console.log('滚动后位置:', {
      leftScrollLeft: leftContainer.scrollLeft,
      rightScrollLeft: rightContainer.scrollLeft,
      expected: finalScrollLeft
    })
  }, 500)
}

// 检查单元格是否被选中
const isCellSelected = (row: number, col: string) => {
  return selectedCell.value?.row === row && selectedCell.value?.col === col
}

// 差异字段导航功能
// 获取当前差异字段的索引（1-based）
const getCurrentDiffIndex = (row: number, diffFields: string[]) => {
  if (!selectedCell.value || selectedCell.value.row !== row) {
    return 1 // 默认第一个
  }
  const index = diffFields.indexOf(selectedCell.value.col)
  return index >= 0 ? index + 1 : 1
}

// 检查是否有上一个差异字段
const hasPrevDiff = (row: number, diffFields: string[]) => {
  const currentIndex = getCurrentDiffIndex(row, diffFields)
  return currentIndex > 1
}

// 检查是否有下一个差异字段
const hasNextDiff = (row: number, diffFields: string[]) => {
  const currentIndex = getCurrentDiffIndex(row, diffFields)
  return currentIndex < diffFields.length
}

// 导航到上一个差异字段
const navigateToPrevDiff = (row: number, diffFields: string[]) => {
  const currentIndex = getCurrentDiffIndex(row, diffFields)
  if (currentIndex > 1) {
    const prevField = diffFields[currentIndex - 2]
    // 选中左表的差异字段
    selectCell(row, prevField, 'left')
  }
}

// 导航到下一个差异字段
const navigateToNextDiff = (row: number, diffFields: string[]) => {
  const currentIndex = getCurrentDiffIndex(row, diffFields)
  if (currentIndex < diffFields.length) {
    const nextField = diffFields[currentIndex]
    // 选中左表的差异字段
    selectCell(row, nextField, 'left')
  }
}

// 编辑功能
const editingCell = ref<{ row: number; col: string; side: 'left' | 'right' } | { row: null; col: null; side: null }>({
  row: null,
  col: null,
  side: null
})
const editValue = ref('')
const inputRef = ref()

const startEdit = (row: number, col: string, side: 'left' | 'right', value: any) => {
  // 先选中单元格
  selectCell(row, col, side)
  
  // 再进入编辑模式
  editingCell.value = { row, col, side }
  editValue.value = value
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleBlur = () => {
  if (editingCell.value.row !== null && editingCell.value.col !== null) {
    const row = editingCell.value.row as number
    const col = editingCell.value.col as string
    if (editingCell.value.side === 'left') {
      updateLeftCell(row, col, editValue.value)
    } else {
      updateRightCell(row, col, editValue.value)
    }
  }
  editingCell.value = { row: null, col: null, side: null }
  editValue.value = ''
}

// 统计信息
const totalRows = computed(() => differences.value.length)
const diffRowsCount = computed(() => differences.value.filter(d => d.diffCount > 0).length)
const totalDiffCells = computed(() => differences.value.reduce((sum, d) => sum + d.diffCount, 0))

// 应用操作
const handleApplyAllLeft = () => {
  applyAllRightToLeft()
}

const handleApplyAllRight = () => {
  applyAllLeftToRight()
}
</script>

<style scoped lang="scss">
.data-comparison-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;

  .toolbar-left {
    display: flex;
    gap: 20px;

    span {
      font-size: 14px;
      color: #606266;

      &.diff-info {
        color: #e6a23c;
        font-weight: 500;
      }

      &.diff-cells-info {
        color: #f56c6c;
        font-weight: 500;
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
  }
}

.comparison-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.diff-column {
  width: 80px;
  flex-shrink: 0;
  border-right: 2px solid #dcdfe6;
  background: #fafafa;

  .header-cell {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    background: #f5f7fa;
    border-bottom: 1px solid #dcdfe6;
  }

  .diff-cell {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #909399;
    border-bottom: 1px solid #ebeef5;
    transition: all 0.2s;

    &.has-diff {
      background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      background-color: #f56c6c;
      border-left: 3px solid #f56c6c;
      box-shadow: inset 0 0 10px rgba(245, 108, 108, 0.3);
    }
  }
}

.action-column {
  width: 200px;
  flex-shrink: 0;
  border-right: 2px solid #dcdfe6;
  border-left: 2px solid #dcdfe6;
  background: #f9fafb;

  .header-cell {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    background: #e8f4ff;
    border-bottom: 1px solid #dcdfe6;
  }

  .action-cell-row {
    height: 40px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 4px;
    border-bottom: 1px solid #ebeef5;
    background: #fff;

    .diff-nav-buttons {
      display: flex;
      align-items: center;
      gap: 4px;

      .diff-indicator {
        font-size: 12px;
        color: #606266;
        font-weight: 600;
        min-width: 30px;
        text-align: center;
      }

      .el-button {
        width: 24px;
        height: 24px;
        padding: 0;
        
        &:hover:not(:disabled) {
          transform: scale(1.1);
        }
      }
    }

    .apply-buttons {
      display: flex;
      gap: 4px;

      .el-button {
        padding: 2px 6px;
        
        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }
}

.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;

  .header-title {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 15px;
    color: #303133;
    border-bottom: 1px solid #dcdfe6;
  }

  .header-scroll-wrapper {
    overflow-x: auto;
    overflow-y: hidden;
    
    &::-webkit-scrollbar {
      height: 0;
      display: none;
    }
  }

  .header-row {
    display: flex;
    height: 40px;
    min-width: max-content;

    .header-cell {
      flex: 0 0 150px;
      min-width: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      color: #606266;
      border-right: 1px solid #dcdfe6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &:last-child {
        border-right: none;
      }
    }
  }
}

.scroll-container {
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
  
  // 性能优化
  will-change: scroll-position;
  contain: layout style paint;
  
  // 启用硬件加速
  transform: translateZ(0);
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
}

.scroll-content {
  position: relative;
  will-change: transform;
  min-width: max-content;
  
  // 性能优化
  backface-visibility: hidden;
  perspective: 1000px;
}

.table-row {
  display: flex;
  height: 40px;
  border-bottom: 1px solid #ebeef5;
  min-width: max-content;
  transition: background 0.2s;

  &.diff-row {
    background: #fff5f5;
    border-left: 3px solid #f56c6c;
  }

  &:hover {
    background: #f5f7fa;
    
    &.diff-row {
      background: #ffe8e8;
    }
  }
}

.table-cell {
  flex: 0 0 150px;
  min-width: 150px;
  max-width: 150px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-right: 1px solid #ebeef5;
  font-size: 13px;
  color: #606266;
  overflow: hidden;

  &:last-child {
    border-right: none;
  }

  &.diff-cell-highlight {
    background: #ffe5e5;
    color: #d03050;
    font-weight: 600;
    border: 2px solid #f56c6c !important;
    box-shadow: 0 0 0 1px #f56c6c inset;
    position: relative;
    padding-left: 20px !important;
    
    &::before {
      content: '⚠';
      position: absolute;
      left: 6px;
      top: 50%;
      transform: translateY(-50%);
      color: #f56c6c;
      font-size: 12px;
      font-weight: bold;
    }
    
    .cell-content {
      color: #d03050;
      font-weight: 600;
    }
  }

  &.cell-selected {
    background: #e6f7ff !important;
    border: 2px solid #1890ff !important;
    box-shadow: 0 0 8px rgba(24, 144, 255, 0.4);
    position: relative;
    z-index: 10;
    
    .cell-content {
      color: #1890ff;
      font-weight: 600;
    }

    // 选中状态优先级高于差异状态
    &.diff-cell-highlight {
      background: #e6f7ff !important;
      border-color: #1890ff !important;
      
      &::before {
        color: #1890ff;
      }
      
      .cell-content {
        color: #1890ff;
      }
    }
  }
}

.cell-content {
  width: 100%;
  cursor: pointer;
  padding: 4px;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: rgba(64, 158, 255, 0.1);
  }
}

.cell-editor {
  width: 100%;
}
</style>
