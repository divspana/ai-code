<template>
  <div class="data-comparison-view">
    <div class="page-header">
      <h2>数据对比工具</h2>
      <p class="description">支持10万+大数据对比，实时编辑，同步滚动</p>
    </div>

    <div class="control-panel">
      <el-button type="primary" @click="generateData(1000)">生成 1,000 行数据</el-button>
      <el-button type="primary" @click="generateData(10000)">生成 10,000 行数据</el-button>
      <el-button type="primary" @click="generateData(100000)">生成 100,000 行数据</el-button>
      <el-button type="warning" @click="introduceDifferences">引入随机差异</el-button>
      <el-button type="success" @click="checkDifferences">检查差异</el-button>
      <el-button @click="resetData">重置数据</el-button>
    </div>
    
    <div class="tips">
      💡 提示：单击任意单元格，该列会在当前表中横向滚动到中心位置，左右表同时高亮对应单元格
    </div>

    <div class="table-container">
      <DataComparisonTable
        v-if="leftData.length > 0"
        :left-data="leftData"
        :right-data="rightData"
        :columns="columns"
        :row-height="40"
        :container-height="650"
      />
      <el-empty v-else description="请先生成数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataComparisonTable from '@/components/DataComparisonTable.vue'
import type { TableRow } from '@/composables/useDataComparison'
import { ElMessage } from 'element-plus'

// 列定义
const columns = ['name', 'age', 'email', 'department', 'salary', 'status']

// 数据
const leftData = ref<TableRow[]>([])
const rightData = ref<TableRow[]>([])

// 生成随机数据
const generateRandomData = (count: number): TableRow[] => {
  const departments = ['技术部', '产品部', '运营部', '市场部', '人力资源部', '财务部']
  const statuses = ['在职', '离职', '试用期', '实习']
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

  const data: TableRow[] = []

  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      name: `${names[i % names.length]}${i + 1}`,
      age: 20 + Math.floor(Math.random() * 40),
      email: `user${i + 1}@example.com`,
      department: departments[Math.floor(Math.random() * departments.length)],
      salary: 5000 + Math.floor(Math.random() * 20000),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    })
  }

  return data
}

// 生成数据
const generateData = (count: number) => {
  const startTime = performance.now()
  
  const data = generateRandomData(count)
  leftData.value = JSON.parse(JSON.stringify(data))
  rightData.value = JSON.parse(JSON.stringify(data))

  const endTime = performance.now()
  const duration = (endTime - startTime).toFixed(2)

  ElMessage.success(`成功生成 ${count.toLocaleString()} 行数据，耗时 ${duration}ms`)
}

// 引入差异
const introduceDifferences = () => {
  if (rightData.value.length === 0) {
    ElMessage.warning('请先生成数据')
    return
  }

  const diffCount = Math.floor(rightData.value.length * 0.1) // 10% 的行有差异
  const changedRows = new Set<number>()

  while (changedRows.size < diffCount) {
    const randomIndex = Math.floor(Math.random() * rightData.value.length)
    changedRows.add(randomIndex)
  }

  // 创建新数组以触发响应式更新
  const newRightData = rightData.value.map((row, index) => {
    if (!changedRows.has(index)) {
      return { ...row }
    }

    // 复制行数据
    const newRow = { ...row }
    const fieldsToChange = Math.floor(Math.random() * 3) + 1 // 1-3 个字段
    const changedFields = new Set<string>()

    while (changedFields.size < fieldsToChange) {
      const randomColumn = columns[Math.floor(Math.random() * columns.length)]
      changedFields.add(randomColumn)
    }

    changedFields.forEach(field => {
      switch (field) {
        case 'name':
          newRow.name = newRow.name + '_修改'
          break
        case 'age':
          newRow.age = newRow.age + Math.floor(Math.random() * 10) - 5
          break
        case 'email':
          newRow.email = newRow.email.replace('@', '_modified@')
          break
        case 'department':
          newRow.department = newRow.department + '(调整)'
          break
        case 'salary':
          newRow.salary = newRow.salary + Math.floor(Math.random() * 5000) - 2500
          break
        case 'status':
          newRow.status = newRow.status === '在职' ? '离职' : '在职'
          break
      }
    })

    return newRow
  })

  rightData.value = newRightData
  
  // 调试：检查差异
  console.log('引入差异后的数据对比:')
  console.log('左表第一行:', leftData.value[0])
  console.log('右表第一行:', rightData.value[0])
  console.log('修改的行索引:', Array.from(changedRows).slice(0, 5))
  
  ElMessage.success(`已在 ${changedRows.size} 行中引入差异`)
}

// 检查差异
const checkDifferences = () => {
  if (leftData.value.length === 0 || rightData.value.length === 0) {
    ElMessage.warning('请先生成数据')
    return
  }

  let diffCount = 0
  const sampleDiffs: any[] = []

  for (let i = 0; i < Math.min(leftData.value.length, 10); i++) {
    const left = leftData.value[i]
    const right = rightData.value[i]
    
    let rowDiffs = 0
    const diffFields: string[] = []
    
    columns.forEach(col => {
      if (left[col] !== right[col]) {
        rowDiffs++
        diffFields.push(col)
      }
    })
    
    if (rowDiffs > 0) {
      diffCount++
      sampleDiffs.push({
        index: i,
        diffCount: rowDiffs,
        fields: diffFields,
        left: left,
        right: right
      })
    }
  }

  console.log('=== 手动差异检查 ===')
  console.log(`前10行中有 ${diffCount} 行存在差异`)
  console.log('差异详情:', sampleDiffs)
  
  if (diffCount > 0) {
    ElMessage.success(`前10行中发现 ${diffCount} 行差异，详情见控制台`)
  } else {
    ElMessage.info('前10行数据完全一致')
  }
}

// 重置数据
const resetData = () => {
  leftData.value = []
  rightData.value = []
  ElMessage.info('数据已重置')
}

// 初始化时生成一些示例数据并引入差异
generateData(1000)
setTimeout(() => {
  introduceDifferences()
}, 100)
</script>

<style scoped lang="scss">
.data-comparison-view {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #303133;
  }

  .description {
    margin: 0;
    font-size: 14px;
    color: #909399;
  }
}

.control-panel {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tips {
  padding: 12px 16px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  color: #0050b3;
  font-size: 14px;
  margin-bottom: 20px;
}

.table-container {
  flex: 1;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
</style>
