<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import FormEngine from './components/FormEngine.vue'
import type { FormSchema, FormData } from './components/types'

const formEngineRef = ref()
const formData = ref<FormData>({})

// 定义表单 Schema
const formSchema: FormSchema = {
  layout: {
    labelWidth: '120px',
    labelPosition: 'right',
    gutter: 20
  },
  fields: [
    {
      name: 'username',
      type: 'input',
      label: '用户名',
      placeholder: '请输入用户名',
      required: true,
      span: 12,
      props: {
        maxlength: 20,
        showWordLimit: true,
        clearable: true
      }
    },
    {
      name: 'email',
      type: 'input',
      label: '邮箱',
      placeholder: '请输入邮箱',
      required: true,
      span: 12,
      rules: [
        {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '请输入正确的邮箱格式'
        }
      ]
    },
    {
      name: 'age',
      type: 'number',
      label: '年龄',
      placeholder: '请输入年龄',
      span: 12,
      props: {
        min: 1,
        max: 150,
        step: 1
      }
    },
    {
      name: 'gender',
      type: 'radio',
      label: '性别',
      span: 12,
      dataSource: {
        data: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
          { label: '其他', value: 'other' }
        ]
      }
    },
    {
      name: 'country',
      type: 'select',
      label: '国家',
      placeholder: '请选择国家',
      span: 12,
      dataSource: {
        data: [
          { label: '中国', value: 'china' },
          { label: '美国', value: 'usa' },
          { label: '日本', value: 'japan' },
          { label: '英国', value: 'uk' }
        ]
      },
      props: {
        filterable: true,
        clearable: true
      }
    },
    {
      name: 'city',
      type: 'select',
      label: '城市',
      placeholder: '请选择城市',
      span: 12,
      dataSource: {
        data: [
          { label: '北京', value: 'beijing' },
          { label: '上海', value: 'shanghai' },
          { label: '广州', value: 'guangzhou' },
          { label: '深圳', value: 'shenzhen' }
        ]
      },
      // 联动规则：只有选择了中国才显示城市选择
      linkage: [
        {
          conditions: [
            { field: 'country', operator: 'eq', value: 'china' }
          ],
          action: {
            visible: true
          }
        },
        {
          conditions: [
            { field: 'country', operator: 'neq', value: 'china' }
          ],
          action: {
            visible: false
          }
        }
      ]
    },
    {
      name: 'hobbies',
      type: 'checkbox',
      label: '爱好',
      span: 24,
      dataSource: {
        data: [
          { label: '阅读', value: 'reading' },
          { label: '运动', value: 'sports' },
          { label: '音乐', value: 'music' },
          { label: '旅游', value: 'travel' },
          { label: '编程', value: 'coding' }
        ]
      }
    },
    {
      name: 'birthDate',
      type: 'date',
      label: '出生日期',
      placeholder: '请选择出生日期',
      span: 12,
      props: {
        type: 'date',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    },
    {
      name: 'memberType',
      type: 'select',
      label: '会员类型',
      placeholder: '请选择会员类型',
      span: 12,
      dataSource: {
        data: [
          { label: '普通会员', value: 'normal' },
          { label: 'VIP会员', value: 'vip' },
          { label: '企业会员', value: 'enterprise' }
        ]
      }
    },
    {
      name: 'vipLevel',
      type: 'select',
      label: 'VIP等级',
      placeholder: '请选择VIP等级',
      span: 12,
      dataSource: {
        data: [
          { label: 'VIP1', value: 1 },
          { label: 'VIP2', value: 2 },
          { label: 'VIP3', value: 3 },
          { label: 'VIP4', value: 4 },
          { label: 'VIP5', value: 5 }
        ]
      },
      // 联动规则：只有选择了VIP会员才显示VIP等级，且为必填
      linkage: [
        {
          conditions: [
            { field: 'memberType', operator: 'eq', value: 'vip' }
          ],
          action: {
            visible: true,
            required: true
          }
        },
        {
          conditions: [
            { field: 'memberType', operator: 'neq', value: 'vip' }
          ],
          action: {
            visible: false,
            required: false
          }
        }
      ]
    },
    {
      name: 'companyName',
      type: 'input',
      label: '公司名称',
      placeholder: '请输入公司名称',
      span: 12,
      // 联动规则：只有选择了企业会员才显示公司名称，且为必填
      linkage: [
        {
          conditions: [
            { field: 'memberType', operator: 'eq', value: 'enterprise' }
          ],
          action: {
            visible: true,
            required: true
          }
        },
        {
          conditions: [
            { field: 'memberType', operator: 'neq', value: 'enterprise' }
          ],
          action: {
            visible: false,
            required: false
          }
        }
      ]
    },
    {
      name: 'isStudent',
      type: 'radio',
      label: '是否学生',
      span: 12,
      dataSource: {
        data: [
          { label: '是', value: true },
          { label: '否', value: false }
        ]
      }
    },
    {
      name: 'school',
      type: 'input',
      label: '学校名称',
      placeholder: '请输入学校名称',
      span: 12,
      // 联动规则：是学生时显示且必填，年龄小于18时禁用
      linkage: [
        {
          conditions: [
            { field: 'isStudent', operator: 'eq', value: true }
          ],
          action: {
            visible: true,
            required: true
          }
        },
        {
          conditions: [
            { field: 'isStudent', operator: 'neq', value: true }
          ],
          action: {
            visible: false
          }
        },
        {
          relation: 'all',
          conditions: [
            { field: 'isStudent', operator: 'eq', value: true },
            { field: 'age', operator: 'lt', value: 18 }
          ],
          action: {
            disabled: true
          }
        }
      ]
    },
    {
      name: 'introduction',
      type: 'textarea',
      label: '个人简介',
      placeholder: '请输入个人简介',
      span: 24,
      props: {
        rows: 4,
        maxlength: 500,
        showWordLimit: true
      }
    }
  ]
}

// 模拟 API 数据源的 Schema（可选）
const apiFormSchema: FormSchema = {
  layout: {
    labelWidth: '120px',
    gutter: 20
  },
  fields: [
    {
      name: 'province',
      type: 'select',
      label: '省份',
      placeholder: '请选择省份',
      span: 12,
      dataSource: {
        // 这里可以配置真实的 API 接口
        // api: {
        //   url: 'https://api.example.com/provinces',
        //   method: 'GET',
        //   transform: (data) => {
        //     return data.map(item => ({
        //       label: item.name,
        //       value: item.id
        //     }))
        //   }
        // }
        // 演示用静态数据
        data: [
          { label: '北京市', value: 'beijing' },
          { label: '上海市', value: 'shanghai' },
          { label: '广东省', value: 'guangdong' }
        ]
      }
    }
  ]
}

// 处理表单提交
const handleSubmit = (data: FormData) => {
  console.log('表单数据:', data)
  ElMessage.success('表单提交成功！')
  ElMessage.info(`提交的数据: ${JSON.stringify(data, null, 2)}`)
}

// 处理表单变化
const handleChange = (data: FormData) => {
  formData.value = data
  console.log('表单数据变化:', data)
}

// 手动验证
const handleValidate = async () => {
  const valid = await formEngineRef.value?.validate()
  if (valid) {
    ElMessage.success('验证通过')
  } else {
    ElMessage.error('验证失败')
  }
}

// 手动重置
const handleReset = () => {
  formEngineRef.value?.reset()
  ElMessage.info('表单已重置')
}

// 获取表单数据
const handleGetData = () => {
  const data = formEngineRef.value?.getFormData()
  console.log('当前表单数据:', data)
  ElMessage.info(`当前数据: ${JSON.stringify(data, null, 2)}`)
}

// 设置表单数据
const handleSetData = () => {
  formEngineRef.value?.setFormData({
    username: '张三',
    email: 'zhangsan@example.com',
    age: 25,
    gender: 'male',
    country: 'china',
    city: 'beijing',
    memberType: 'vip',
    vipLevel: 3
  })
  ElMessage.success('表单数据已设置')
}
</script>

<template>
  <div class="demo-container">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <h2>🚀 表单引擎演示</h2>
          <div class="header-actions">
            <el-button size="small" @click="handleValidate">验证表单</el-button>
            <el-button size="small" @click="handleGetData">获取数据</el-button>
            <el-button size="small" @click="handleSetData">设置数据</el-button>
            <el-button size="small" @click="handleReset">重置表单</el-button>
          </div>
        </div>
      </template>

      <el-alert
        title="功能说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <ul style="margin: 8px 0; padding-left: 20px">
          <li>支持多种字段类型：input, textarea, number, select, radio, checkbox, date</li>
          <li>支持字段联动：选择不同的国家、会员类型、学生状态会显示/隐藏不同的字段</li>
          <li>支持禁用联动：年龄小于18且是学生时，学校字段会被禁用</li>
          <li>支持必填联动：VIP会员需要填写VIP等级，企业会员需要填写公司名称</li>
          <li>Select 支持配置 API 数据源（见代码注释）</li>
        </ul>
      </el-alert>

      <FormEngine
        ref="formEngineRef"
        :schema="formSchema"
        v-model="formData"
        @submit="handleSubmit"
        @change="handleChange"
      />

      <el-divider />

      <div class="data-preview">
        <h3>实时表单数据预览</h3>
        <el-input
          type="textarea"
          :model-value="JSON.stringify(formData, null, 2)"
          :rows="10"
          readonly
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.demo-container {
  padding: 20px;
  min-height: 100%;
  height: 100%;
  background: #f0f2f5;
  overflow-y: auto;
}

.demo-card {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.data-preview {
  margin-top: 20px;
}

.data-preview h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

:deep(.el-alert__description) {
  margin: 0;
}

:deep(.el-alert__description ul) {
  line-height: 1.8;
}
</style>
