<template>
  <div class="table-filter-sort-demo">
    <div class="page-header">
      <h2>Table Filter & Sort 解决方案演示</h2>
      <p class="description">
        演示如何解决 el-table-column 同时使用 filter 和 sortable 时的点击冲突问题
      </p>
    </div>

    <div class="demo-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>❌ 问题示例：点击表头任意位置都会触发排序</span>
          </div>
        </template>
        <el-table :data="tableData" style="width: 100%">
          <el-table-column
            prop="name"
            label="姓名"
            sortable
            :filters="nameFilters"
            :filter-method="filterName"
            width="200"
          />
          <el-table-column
            prop="department"
            label="部门"
            sortable
            :filters="deptFilters"
            :filter-method="filterDept"
            width="200"
          />
          <el-table-column prop="age" label="年龄" sortable width="120" />
          <el-table-column prop="email" label="邮箱" />
        </el-table>
      </el-card>
    </div>

    <div class="demo-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>✅ 方案1：自定义表头（完全控制）</span>
          </div>
        </template>
        <el-table :data="sortedData1" style="width: 100%">
          <el-table-column
            prop="name"
            label="姓名"
            :filters="nameFilters"
            :filter-method="filterName"
            width="200"
          >
            <template #header>
              <div class="custom-header">
                <span>姓名</span>
                <span class="sort-icon" @click.stop="handleSort1('name')">
                  <el-icon v-if="sortConfig1.column === 'name'">
                    <CaretTop v-if="sortConfig1.order === 'ascending'" />
                    <CaretBottom v-else />
                  </el-icon>
                  <el-icon v-else class="sort-icon-default">
                    <Sort />
                  </el-icon>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="department"
            label="部门"
            :filters="deptFilters"
            :filter-method="filterDept"
            width="200"
          >
            <template #header>
              <div class="custom-header">
                <span>部门</span>
                <span class="sort-icon" @click.stop="handleSort1('department')">
                  <el-icon v-if="sortConfig1.column === 'department'">
                    <CaretTop v-if="sortConfig1.order === 'ascending'" />
                    <CaretBottom v-else />
                  </el-icon>
                  <el-icon v-else class="sort-icon-default">
                    <Sort />
                  </el-icon>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="age" label="年龄" width="120">
            <template #header>
              <div class="custom-header">
                <span>年龄</span>
                <span class="sort-icon" @click.stop="handleSort1('age')">
                  <el-icon v-if="sortConfig1.column === 'age'">
                    <CaretTop v-if="sortConfig1.order === 'ascending'" />
                    <CaretBottom v-else />
                  </el-icon>
                  <el-icon v-else class="sort-icon-default">
                    <Sort />
                  </el-icon>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" />
        </el-table>
      </el-card>
    </div>

    <div class="demo-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>✅ 方案2：CSS 控制点击区域（最简单）</span>
          </div>
        </template>
        <el-table :data="tableData" style="width: 100%" class="css-controlled-table">
          <el-table-column
            prop="name"
            label="姓名"
            sortable
            :filters="nameFilters"
            :filter-method="filterName"
            width="200"
            class-name="custom-sortable-column"
          />
          <el-table-column
            prop="department"
            label="部门"
            sortable
            :filters="deptFilters"
            :filter-method="filterDept"
            width="200"
            class-name="custom-sortable-column"
          />
          <el-table-column
            prop="age"
            label="年龄"
            sortable
            width="120"
            class-name="custom-sortable-column"
          />
          <el-table-column prop="email" label="邮箱" />
        </el-table>
      </el-card>
    </div>

    <div class="demo-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>✅ 方案4：自定义 Filter 图标和内容（不使用插槽）</span>
          </div>
        </template>
        <el-table :data="tableData" style="width: 100%">
          <el-table-column
            prop="name"
            label="姓名"
            sortable
            :filters="nameFilters"
            :filter-method="filterName"
            :filtered-value="filteredName"
            width="200"
          >
            <template #header>
              <div class="filter-header">
                <span>姓名</span>
                <el-popover
                  placement="bottom"
                  :width="200"
                  trigger="click"
                  @show="handleFilterShow"
                >
                  <template #reference>
                    <el-icon class="custom-filter-icon" @click.stop>
                      <Filter />
                    </el-icon>
                  </template>
                  <div class="custom-filter-panel">
                    <el-checkbox-group v-model="filteredName" @change="handleFilterChange">
                      <el-checkbox
                        v-for="item in nameFilters"
                        :key="item.value"
                        :label="item.value"
                      >
                        {{ item.text }}
                      </el-checkbox>
                    </el-checkbox-group>
                    <div class="filter-actions">
                      <el-button size="small" @click="handleFilterReset('name')">重置</el-button>
                      <el-button size="small" type="primary" @click="handleFilterConfirm">
                        确定
                      </el-button>
                    </div>
                  </div>
                </el-popover>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="department"
            label="部门"
            sortable
            :filters="deptFilters"
            :filter-method="filterDept"
            :filtered-value="filteredDept"
            width="200"
          >
            <template #header>
              <div class="filter-header">
                <span>部门</span>
                <el-popover placement="bottom" :width="200" trigger="click">
                  <template #reference>
                    <el-icon class="custom-filter-icon" @click.stop>
                      <Filter />
                    </el-icon>
                  </template>
                  <div class="custom-filter-panel">
                    <el-checkbox-group v-model="filteredDept">
                      <el-checkbox
                        v-for="item in deptFilters"
                        :key="item.value"
                        :label="item.value"
                      >
                        {{ item.text }}
                      </el-checkbox>
                    </el-checkbox-group>
                    <div class="filter-actions">
                      <el-button size="small" @click="handleFilterReset('dept')">重置</el-button>
                      <el-button size="small" type="primary">确定</el-button>
                    </div>
                  </div>
                </el-popover>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="age" label="年龄" sortable width="120" />
          <el-table-column prop="email" label="邮箱" />
        </el-table>
      </el-card>
    </div>

    <div class="demo-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>✅ 方案5：手动排序控制（灵活性高）</span>
          </div>
        </template>
        <el-table :data="sortedData3" style="width: 100%">
          <el-table-column
            prop="name"
            label="姓名"
            :filters="nameFilters"
            :filter-method="filterName"
            width="200"
          >
            <template #header>
              <div class="manual-sort-header">
                <span class="header-text">姓名</span>
                <div class="sort-controls" @click.stop="toggleSort3('name')">
                  <i class="el-icon-caret-top" :class="{ active: sortState3.name === 'asc' }"></i>
                  <i
                    class="el-icon-caret-bottom"
                    :class="{ active: sortState3.name === 'desc' }"
                  ></i>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="department"
            label="部门"
            :filters="deptFilters"
            :filter-method="filterDept"
            width="200"
          >
            <template #header>
              <div class="manual-sort-header">
                <span class="header-text">部门</span>
                <div class="sort-controls" @click.stop="toggleSort3('department')">
                  <i
                    class="el-icon-caret-top"
                    :class="{ active: sortState3.department === 'asc' }"
                  ></i>
                  <i
                    class="el-icon-caret-bottom"
                    :class="{ active: sortState3.department === 'desc' }"
                  ></i>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="age" label="年龄" width="120">
            <template #header>
              <div class="manual-sort-header">
                <span class="header-text">年龄</span>
                <div class="sort-controls" @click.stop="toggleSort3('age')">
                  <i class="el-icon-caret-top" :class="{ active: sortState3.age === 'asc' }"></i>
                  <i
                    class="el-icon-caret-bottom"
                    :class="{ active: sortState3.age === 'desc' }"
                  ></i>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { CaretTop, CaretBottom, Sort, Filter } from '@element-plus/icons-vue'

interface TableRow {
  id: number
  name: string
  department: string
  age: number
  email: string
}

// 原始数据
const tableData = ref<TableRow[]>([
  { id: 1, name: '张三', department: '技术部', age: 28, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', department: '市场部', age: 32, email: 'lisi@example.com' },
  { id: 3, name: '王五', department: '技术部', age: 25, email: 'wangwu@example.com' },
  { id: 4, name: '赵六', department: '人事部', age: 30, email: 'zhaoliu@example.com' },
  { id: 5, name: '孙七', department: '市场部', age: 27, email: 'sunqi@example.com' },
  { id: 6, name: '周八', department: '技术部', age: 35, email: 'zhouba@example.com' },
  { id: 7, name: '吴九', department: '人事部', age: 29, email: 'wujiu@example.com' },
  { id: 8, name: '郑十', department: '市场部', age: 31, email: 'zhengshi@example.com' }
])

// 筛选器配置
const nameFilters = [
  { text: '张三', value: '张三' },
  { text: '李四', value: '李四' },
  { text: '王五', value: '王五' }
]

const deptFilters = [
  { text: '技术部', value: '技术部' },
  { text: '市场部', value: '市场部' },
  { text: '人事部', value: '人事部' }
]

// 筛选方法
const filterName = (value: string, row: TableRow) => {
  return row.name === value
}

const filterDept = (value: string, row: TableRow) => {
  return row.department === value
}

// 方案1：自定义表头排序
const sortConfig1 = reactive({
  column: '',
  order: 'ascending' as 'ascending' | 'descending'
})

const sortedData1 = computed(() => {
  if (!sortConfig1.column) return [...tableData.value]

  return [...tableData.value].sort((a, b) => {
    const aVal = a[sortConfig1.column as keyof TableRow]
    const bVal = b[sortConfig1.column as keyof TableRow]
    const order = sortConfig1.order === 'ascending' ? 1 : -1

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * order
    }
    return String(aVal).localeCompare(String(bVal)) * order
  })
})

const handleSort1 = (column: string) => {
  if (sortConfig1.column === column) {
    sortConfig1.order = sortConfig1.order === 'ascending' ? 'descending' : 'ascending'
  } else {
    sortConfig1.column = column
    sortConfig1.order = 'ascending'
  }
}

// 方案3：手动排序控制
const sortState3 = reactive<Record<string, 'asc' | 'desc' | null>>({
  name: null,
  department: null,
  age: null
})

const sortedData3 = computed(() => {
  const activeSort = Object.entries(sortState3).find(([, value]) => value !== null)
  if (!activeSort) return [...tableData.value]

  const [column, order] = activeSort
  return [...tableData.value].sort((a, b) => {
    const aVal = a[column as keyof TableRow]
    const bVal = b[column as keyof TableRow]
    const multiplier = order === 'asc' ? 1 : -1

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * multiplier
    }
    return String(aVal).localeCompare(String(bVal)) * multiplier
  })
})

const toggleSort3 = (prop: string) => {
  // 清除其他列的排序
  Object.keys(sortState3).forEach(key => {
    if (key !== prop) sortState3[key] = null
  })

  // 切换当前列的排序
  if (sortState3[prop] === 'asc') {
    sortState3[prop] = 'desc'
  } else if (sortState3[prop] === 'desc') {
    sortState3[prop] = null
  } else {
    sortState3[prop] = 'asc'
  }
}

// 方案4：自定义 Filter 图标和内容
const filteredName = ref<string[]>([])
const filteredDept = ref<string[]>([])

const handleFilterShow = () => {
  console.log('Filter panel opened')
}

const handleFilterChange = () => {
  console.log('Filter changed:', filteredName.value)
}

const handleFilterConfirm = () => {
  console.log('Filter confirmed')
}

const handleFilterReset = (type: string) => {
  if (type === 'name') {
    filteredName.value = []
  } else if (type === 'dept') {
    filteredDept.value = []
  }
}
</script>

<style scoped lang="scss">
.table-filter-sort-demo {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
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

.demo-section {
  margin-bottom: 20px;

  .card-header {
    font-weight: 600;
    font-size: 16px;
  }
}

// 方案1：自定义表头样式
.custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .sort-icon {
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    margin-left: 8px;
    transition: all 0.3s;

    &:hover {
      color: var(--el-color-primary);
      transform: scale(1.1);
    }

    .sort-icon-default {
      color: #c0c4cc;
    }
  }
}

// 方案2：CSS 控制点击区域
.css-controlled-table {
  :deep(.custom-sortable-column) {
    .cell {
      pointer-events: none;
    }

    .caret-wrapper {
      pointer-events: auto;
    }

    .el-table__column-filter-trigger {
      pointer-events: auto;
    }
  }
}

// 方案3：手动排序控制样式
.manual-sort-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .header-text {
    flex: 1;
  }

  .sort-controls {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    margin-left: 8px;
    gap: 2px;

    i {
      font-size: 12px;
      color: #c0c4cc;
      line-height: 1;
      transition: all 0.3s;

      &.active {
        color: var(--el-color-primary);
      }

      &:hover {
        transform: scale(1.2);
      }
    }

    &:hover i {
      color: #909399;

      &.active {
        color: var(--el-color-primary);
      }
    }
  }
}

// 方案4：自定义 Filter 样式
.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .custom-filter-icon {
    cursor: pointer;
    margin-left: 8px;
    color: #909399;
    transition: all 0.3s;

    &:hover {
      color: var(--el-color-primary);
      transform: scale(1.1);
    }
  }
}

.custom-filter-panel {
  padding: 12px;

  :deep(.el-checkbox-group) {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
  }
}
</style>
