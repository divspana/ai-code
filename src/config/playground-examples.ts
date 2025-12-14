export interface PlaygroundExample {
  id: string
  title: string
  description: string
  category: string
  code: string
  tags?: string[]
}

export const playgroundExamples: PlaygroundExample[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    description: '最简单的示例',
    category: 'basic',
    tags: ['basic', 'demo'],
    code: `<template>
  <div class="demo-container">
    <h1>{{ message }}</h1>
    <el-button type="primary" @click="handleClick">
      点击次数: {{ count }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
const message = ref('Hello Playground!')
const count = ref(0)

const handleClick = () => {
  count.value++
  ElMessage.success(\`你点击了 \${count.value} 次\`)
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
  text-align: center;
}

h1 {
  color: #409eff;
  margin-bottom: 20px;
}
</style>`
  },
  {
    id: 'upload-basic',
    title: '文件上传 - 基础用法',
    description: '展示文件上传组件的基本使用方式',
    category: 'upload',
    tags: ['upload', 'file'],
    code: `<template>
  <div class="demo-container">
    <h3>文件上传示例</h3>
    <el-upload
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
    >
      <el-button type="primary">点击上传</el-button>
      <template #tip>
        <div class="el-upload__tip">
          只能上传 jpg/png 文件，且不超过 500kb
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
const handleSuccess = () => {
  ElMessage.success('上传成功！')
}

const handleError = () => {
  ElMessage.error('上传失败！')
}

const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt500K = file.size / 1024 < 500

  if (!isJPG) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片!')
  }
  if (!isLt500K) {
    ElMessage.error('图片大小不能超过 500KB!')
  }
  return isJPG && isLt500K
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
}

h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>`
  },
  {
    id: 'button-basic',
    title: '按钮 - 基础用法',
    description: '展示各种类型的按钮',
    category: 'basic',
    tags: ['button', 'basic'],
    code: `<template>
  <div class="demo-container">
    <h3>按钮类型</h3>
    <div class="button-group">
      <el-button>默认按钮</el-button>
      <el-button type="primary">主要按钮</el-button>
      <el-button type="success">成功按钮</el-button>
      <el-button type="info">信息按钮</el-button>
      <el-button type="warning">警告按钮</el-button>
      <el-button type="danger">危险按钮</el-button>
    </div>

    <h3 style="margin-top: 20px">按钮尺寸</h3>
    <div class="button-group">
      <el-button size="large">大型按钮</el-button>
      <el-button>默认按钮</el-button>
      <el-button size="small">小型按钮</el-button>
    </div>

    <h3 style="margin-top: 20px">图标按钮</h3>
    <div class="button-group">
      <el-button :icon="Search">搜索</el-button>
      <el-button type="primary" :icon="Edit">编辑</el-button>
      <el-button type="success" :icon="Check">确认</el-button>
      <el-button type="danger" :icon="Delete">删除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Edit, Check, Delete } from '@element-plus/icons-vue'
</script>

<style scoped>
.demo-container {
  padding: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

h3 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
}
</style>`
  },
  {
    id: 'form-basic',
    title: '表单 - 基础用法',
    description: '展示表单的基本使用',
    category: 'form',
    tags: ['form', 'input', 'validation'],
    code: `<template>
  <div class="demo-container">
    <h3>基础表单</h3>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
        />
      </el-form-item>

      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="form.gender">
          <el-radio label="male">男</el-radio>
          <el-radio label="female">女</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  email: '',
  password: '',
  gender: 'male'
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ]
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('提交成功！')
      console.log('表单数据:', form)
    } else {
      ElMessage.error('表单验证失败！')
    }
  })
}

const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 600px;
}

h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>`
  },
  {
    id: 'table-basic',
    title: '表格 - 基础用法',
    description: '展示数据表格的基本使用',
    category: 'data',
    tags: ['table', 'data'],
    code: `<template>
  <div class="demo-container">
    <h3>基础表格</h3>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="date" label="日期" width="180" />
      <el-table-column prop="name" label="姓名" width="180" />
      <el-table-column prop="address" label="地址" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

interface TableRow {
  date: string
  name: string
  address: string
}

const tableData = ref<TableRow[]>([
  {
    date: '2024-12-01',
    name: '张三',
    address: '上海市普陀区金沙江路 1518 弄'
  },
  {
    date: '2024-12-02',
    name: '李四',
    address: '上海市普陀区金沙江路 1517 弄'
  },
  {
    date: '2024-12-03',
    name: '王五',
    address: '上海市普陀区金沙江路 1519 弄'
  },
  {
    date: '2024-12-04',
    name: '赵六',
    address: '上海市普陀区金沙江路 1516 弄'
  }
])

const handleEdit = (row: TableRow) => {
  ElMessage.info(\`编辑: \${row.name}\`)
}

const handleDelete = (row: TableRow) => {
  ElMessage.warning(\`删除: \${row.name}\`)
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
}

h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>`
  }
]

export const getExamplesByCategory = (category: string) => {
  return playgroundExamples.filter(example => example.category === category)
}

export const getExampleById = (id: string) => {
  return playgroundExamples.find(example => example.id === id)
}

export const getAllCategories = () => {
  const categories = new Set(playgroundExamples.map(e => e.category))
  return Array.from(categories)
}
