<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit } from '@element-plus/icons-vue'

interface Todo {
  id: number
  title: string
  description: string
  completed: boolean
  createdAt: string
}

const todos = ref<Todo[]>([])
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const filterStatus = ref<'all' | 'active' | 'completed'>('all')

const todoForm = ref({
  title: '',
  description: ''
})

// localStorage key
const STORAGE_KEY = 'vue3-todo-list'

// 从 localStorage 加载数据
const loadTodos = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      todos.value = JSON.parse(stored)
    } catch (error) {
      console.error('Failed to parse todos from localStorage:', error)
      todos.value = []
    }
  }
}

// 保存到 localStorage
const saveTodos = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value))
}

// 添加或更新 Todo
const handleSubmit = () => {
  if (!todoForm.value.title.trim()) {
    ElMessage.warning('请输入待办事项标题')
    return
  }

  if (editingId.value !== null) {
    // 更新现有 Todo
    const todo = todos.value.find(t => t.id === editingId.value)
    if (todo) {
      todo.title = todoForm.value.title
      todo.description = todoForm.value.description
      ElMessage.success('更新成功')
    }
  } else {
    // 添加新 Todo
    const newTodo: Todo = {
      id: Date.now(),
      title: todoForm.value.title,
      description: todoForm.value.description,
      completed: false,
      createdAt: new Date().toISOString()
    }
    todos.value.unshift(newTodo)
    ElMessage.success('添加成功')
  }

  saveTodos()
  closeDialog()
}

// 打开添加对话框
const openAddDialog = () => {
  editingId.value = null
  todoForm.value = { title: '', description: '' }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (todo: Todo) => {
  editingId.value = todo.id
  todoForm.value = {
    title: todo.title,
    description: todo.description
  }
  dialogVisible.value = true
}

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false
  editingId.value = null
  todoForm.value = { title: '', description: '' }
}

// 切换完成状态
const toggleComplete = (todo: Todo) => {
  todo.completed = !todo.completed
  saveTodos()
  ElMessage.success(todo.completed ? '已完成' : '标记为未完成')
}

// 删除 Todo
const deleteTodo = (id: number) => {
  ElMessageBox.confirm('确定要删除这个待办事项吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    todos.value = todos.value.filter(t => t.id !== id)
    saveTodos()
    ElMessage.success('删除成功')
  }).catch(() => {
    // 用户取消删除
  })
}

// 清空已完成
const clearCompleted = () => {
  const completedCount = todos.value.filter(t => t.completed).length
  if (completedCount === 0) {
    ElMessage.info('没有已完成的待办事项')
    return
  }

  ElMessageBox.confirm(`确定要清空 ${completedCount} 个已完成的待办事项吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    todos.value = todos.value.filter(t => !t.completed)
    saveTodos()
    ElMessage.success('清空成功')
  }).catch(() => {
    // 用户取消
  })
}

// 过滤后的 Todos
const filteredTodos = computed(() => {
  switch (filterStatus.value) {
    case 'active':
      return todos.value.filter(t => !t.completed)
    case 'completed':
      return todos.value.filter(t => t.completed)
    default:
      return todos.value
  }
})

// 统计数据
const stats = computed(() => ({
  total: todos.value.length,
  active: todos.value.filter(t => !t.completed).length,
  completed: todos.value.filter(t => t.completed).length
}))

// 组件挂载时加载数据
onMounted(() => {
  loadTodos()
})
</script>

<template>
  <div class="todo-container">
    <el-card class="todo-card">
      <template #header>
        <div class="card-header">
          <h2>📝 待办事项列表</h2>
          <el-button type="primary" @click="openAddDialog">
            + 新建待办
          </el-button>
        </div>
      </template>

      <!-- 统计信息 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic title="总计" :value="stats.total" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="进行中" :value="stats.active" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="已完成" :value="stats.completed" />
          </el-col>
        </el-row>
      </div>

      <!-- 过滤器 -->
      <div class="filter-section">
        <el-radio-group v-model="filterStatus" size="default">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="active">进行中</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
        </el-radio-group>
        <el-button 
          v-if="stats.completed > 0" 
          type="danger" 
          plain 
          size="default"
          @click="clearCompleted"
        >
          清空已完成
        </el-button>
      </div>

      <!-- Todo 列表 -->
      <div class="todo-list">
        <el-empty v-if="filteredTodos.length === 0" description="暂无待办事项" />
        
        <transition-group name="list" tag="div">
          <div
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="todo-item"
            :class="{ completed: todo.completed }"
          >
            <div class="todo-content">
              <el-checkbox
                :model-value="todo.completed"
                @change="toggleComplete(todo)"
                size="large"
              />
              <div class="todo-text">
                <h3>{{ todo.title }}</h3>
                <p v-if="todo.description">{{ todo.description }}</p>
                <span class="todo-date">
                  {{ new Date(todo.createdAt).toLocaleString('zh-CN') }}
                </span>
              </div>
            </div>
            <div class="todo-actions">
              <el-button
                circle
                size="small"
                @click="openEditDialog(todo)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button
                circle
                size="small"
                type="danger"
                @click="deleteTodo(todo.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </transition-group>
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑待办事项' : '新建待办事项'"
      width="500px"
    >
      <el-form :model="todoForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input
            v-model="todoForm.title"
            placeholder="请输入待办事项标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="todoForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入详细描述（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ editingId ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.todo-container {
  padding: 0;
  min-height: 100%;
  height: 100%;
  background: #fff;
}

.todo-card {
  width: 100%;
  height: 100%;
  margin: 0;
  border-radius: 0;
  border: none;
}

:deep(.el-card__body) {
  padding: 20px;
  height: calc(100% - 80px);
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.stats-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 8px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.todo-list {
  min-height: 300px;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.todo-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.todo-item.completed {
  background: #f5f7fa;
  opacity: 0.7;
}

.todo-item.completed .todo-text h3 {
  text-decoration: line-through;
  color: #909399;
}

.todo-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.todo-text {
  flex: 1;
}

.todo-text h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.todo-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.todo-date {
  font-size: 12px;
  color: #909399;
}

.todo-actions {
  display: flex;
  gap: 8px;
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
