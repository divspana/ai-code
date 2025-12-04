# 表单引擎 (Form Engine)

一个基于 Vue 3 + TypeScript + Element Plus 的强大表单引擎，通过 JSON Schema 驱动，支持动态渲染、字段联动、API 数据源等功能。

## 特性

- ✅ **Schema 驱动**：通过 JSON 配置动态生成表单
- ✅ **多种字段类型**：支持 input、textarea、number、select、radio、checkbox、date 等
- ✅ **字段联动**：支持显隐、禁用、必填等状态的联动控制
- ✅ **API 数据源**：Select/Radio/Checkbox 支持配置 API 接口获取选项数据
- ✅ **表单验证**：内置验证规则，支持自定义验证器
- ✅ **响应式布局**：基于 Element Plus 栅格系统
- ✅ **TypeScript 支持**：完整的类型定义

## 快速开始

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormEngine } from '@/components/FormEngine'
import type { FormSchema } from '@/components/FormEngine/types'

const formData = ref({})

const schema: FormSchema = {
  fields: [
    {
      name: 'username',
      type: 'input',
      label: '用户名',
      placeholder: '请输入用户名',
      required: true
    },
    {
      name: 'email',
      type: 'input',
      label: '邮箱',
      placeholder: '请输入邮箱',
      rules: [
        {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '请输入正确的邮箱格式'
        }
      ]
    }
  ]
}

const handleSubmit = data => {
  console.log('提交数据:', data)
}
</script>

<template>
  <FormEngine :schema="schema" v-model="formData" @submit="handleSubmit" />
</template>
```

## Schema 配置

### FormSchema

| 属性          | 类型          | 说明         |
| ------------- | ------------- | ------------ |
| fields        | FieldSchema[] | 字段配置列表 |
| layout        | Object        | 表单布局配置 |
| initialValues | Object        | 表单初始值   |

### FieldSchema

| 属性         | 类型             | 必填 | 说明             |
| ------------ | ---------------- | ---- | ---------------- |
| name         | string           | ✅   | 字段名称         |
| type         | FieldType        | ✅   | 字段类型         |
| label        | string           | ✅   | 字段标签         |
| placeholder  | string           | ❌   | 占位符           |
| defaultValue | any              | ❌   | 默认值           |
| required     | boolean          | ❌   | 是否必填         |
| disabled     | boolean          | ❌   | 是否禁用         |
| hidden       | boolean          | ❌   | 是否隐藏         |
| rules        | Array            | ❌   | 验证规则         |
| dataSource   | DataSourceConfig | ❌   | 数据源配置       |
| props        | Object           | ❌   | 字段属性配置     |
| linkage      | LinkageRule[]    | ❌   | 联动规则         |
| span         | number           | ❌   | 栅格占位（1-24） |

### 字段类型 (FieldType)

- `input` - 文本输入框
- `textarea` - 多行文本框
- `number` - 数字输入框
- `select` - 下拉选择
- `radio` - 单选框
- `checkbox` - 多选框
- `date` - 日期选择器

## 数据源配置

### 静态数据源

```typescript
{
  name: 'gender',
  type: 'select',
  label: '性别',
  dataSource: {
    data: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' }
    ]
  }
}
```

### API 数据源

```typescript
{
  name: 'city',
  type: 'select',
  label: '城市',
  dataSource: {
    api: {
      url: 'https://api.example.com/cities',
      method: 'GET',
      params: { country: 'china' },
      headers: { 'Authorization': 'Bearer token' },
      transform: (data) => {
        // 将 API 返回的数据转换为 { label, value } 格式
        return data.map(item => ({
          label: item.name,
          value: item.id
        }))
      }
    }
  }
}
```

## 字段联动

### 显隐联动

```typescript
{
  name: 'city',
  type: 'select',
  label: '城市',
  linkage: [
    {
      conditions: [
        { field: 'country', operator: 'eq', value: 'china' }
      ],
      action: {
        visible: true  // 当国家为中国时显示
      }
    },
    {
      conditions: [
        { field: 'country', operator: 'neq', value: 'china' }
      ],
      action: {
        visible: false  // 当国家不为中国时隐藏
      }
    }
  ]
}
```

### 禁用联动

```typescript
{
  name: 'school',
  type: 'input',
  label: '学校',
  linkage: [
    {
      relation: 'all',  // 所有条件都满足
      conditions: [
        { field: 'isStudent', operator: 'eq', value: true },
        { field: 'age', operator: 'lt', value: 18 }
      ],
      action: {
        disabled: true  // 是学生且年龄小于18时禁用
      }
    }
  ]
}
```

### 必填联动

```typescript
{
  name: 'vipLevel',
  type: 'select',
  label: 'VIP等级',
  linkage: [
    {
      conditions: [
        { field: 'memberType', operator: 'eq', value: 'vip' }
      ],
      action: {
        visible: true,
        required: true  // VIP会员时显示且必填
      }
    }
  ]
}
```

### 联动操作符

| 操作符      | 说明       | 示例                                                              |
| ----------- | ---------- | ----------------------------------------------------------------- |
| eq          | 等于       | `{ field: 'type', operator: 'eq', value: 'vip' }`                 |
| neq         | 不等于     | `{ field: 'type', operator: 'neq', value: 'normal' }`             |
| gt          | 大于       | `{ field: 'age', operator: 'gt', value: 18 }`                     |
| gte         | 大于等于   | `{ field: 'age', operator: 'gte', value: 18 }`                    |
| lt          | 小于       | `{ field: 'age', operator: 'lt', value: 60 }`                     |
| lte         | 小于等于   | `{ field: 'age', operator: 'lte', value: 60 }`                    |
| in          | 在数组中   | `{ field: 'type', operator: 'in', value: ['vip', 'svip'] }`       |
| notIn       | 不在数组中 | `{ field: 'type', operator: 'notIn', value: ['banned'] }`         |
| includes    | 数组包含   | `{ field: 'hobbies', operator: 'includes', value: 'coding' }`     |
| notIncludes | 数组不包含 | `{ field: 'hobbies', operator: 'notIncludes', value: 'smoking' }` |

## 表单验证

### 内置验证

```typescript
{
  name: 'username',
  type: 'input',
  label: '用户名',
  required: true,  // 必填验证
  rules: [
    {
      pattern: /^[a-zA-Z0-9_]{3,20}$/,
      message: '用户名只能包含字母、数字和下划线，长度3-20位'
    }
  ]
}
```

### 自定义验证器

```typescript
{
  name: 'password',
  type: 'input',
  label: '密码',
  rules: [
    {
      validator: (value, formData) => {
        if (!value) return '请输入密码'
        if (value.length < 6) return '密码长度不能小于6位'
        if (!/[A-Z]/.test(value)) return '密码必须包含大写字母'
        return true  // 验证通过
      }
    }
  ]
}
```

## API 方法

通过 ref 可以调用表单引擎的方法：

```vue
<script setup>
const formRef = ref()

// 验证表单
const validate = async () => {
  const valid = await formRef.value?.validate()
  console.log('验证结果:', valid)
}

// 重置表单
const reset = () => {
  formRef.value?.reset()
}

// 清空验证
const clearValidate = () => {
  formRef.value?.clearValidate()
}

// 获取表单数据
const getData = () => {
  const data = formRef.value?.getFormData()
  console.log('表单数据:', data)
}

// 设置表单数据
const setData = () => {
  formRef.value?.setFormData({
    username: '张三',
    email: 'zhangsan@example.com'
  })
}
</script>

<template>
  <FormEngine ref="formRef" :schema="schema" />
</template>
```

## 事件

| 事件名            | 参数     | 说明               |
| ----------------- | -------- | ------------------ |
| submit            | formData | 表单提交时触发     |
| change            | formData | 表单数据变化时触发 |
| update:modelValue | formData | v-model 双向绑定   |

## 完整示例

查看 `/src/view/FormEngineDemo.vue` 获取完整的使用示例。

## 目录结构

```
FormEngine/
├── fields/                    # 字段组件
│   ├── InputField.vue        # 文本输入框
│   ├── TextareaField.vue     # 多行文本框
│   ├── NumberField.vue       # 数字输入框
│   ├── SelectField.vue       # 下拉选择
│   ├── RadioField.vue        # 单选框
│   ├── CheckboxField.vue     # 多选框
│   └── DateField.vue         # 日期选择器
├── utils/                     # 工具函数
│   └── linkage.ts            # 联动逻辑
├── FormEngine.vue            # 主组件
├── types.ts                  # 类型定义
├── index.ts                  # 导出文件
└── README.md                 # 文档
```

## 扩展字段类型

如需添加新的字段类型，按以下步骤操作：

1. 在 `fields/` 目录下创建新的字段组件
2. 在 `types.ts` 中添加字段类型定义
3. 在 `FormEngine.vue` 的 `fieldComponents` 中注册组件

```typescript
// 1. 创建 SwitchField.vue
// 2. 在 types.ts 中添加
export type FieldType = 'input' | 'textarea' | ... | 'switch'

// 3. 在 FormEngine.vue 中注册
const fieldComponents = {
  input: InputField,
  // ...
  switch: SwitchField
}
```
