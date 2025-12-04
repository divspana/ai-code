# 表单引擎使用指南

## 项目结构

```
src/
├── components/
│   └── FormEngine/              # 表单引擎核心
│       ├── fields/              # 字段组件目录
│       │   ├── InputField.vue
│       │   ├── TextareaField.vue
│       │   ├── NumberField.vue
│       │   ├── SelectField.vue
│       │   ├── RadioField.vue
│       │   ├── CheckboxField.vue
│       │   └── DateField.vue
│       ├── utils/
│       │   └── linkage.ts       # 联动逻辑工具
│       ├── FormEngine.vue       # 主组件
│       ├── types.ts             # TypeScript 类型定义
│       ├── index.ts             # 导出文件
│       └── README.md            # 详细文档
└── view/
    └── FormEngineDemo.vue       # 完整演示页面
```

## 快速开始

### 1. 导入组件

```typescript
import { FormEngine } from '@/components/FormEngine'
import type { FormSchema } from '@/components/FormEngine/types'
```

### 2. 定义 Schema

```typescript
const schema: FormSchema = {
  fields: [
    {
      name: 'username',
      type: 'input',
      label: '用户名',
      required: true
    }
  ]
}
```

### 3. 使用组件

```vue
<FormEngine :schema="schema" v-model="formData" @submit="handleSubmit" />
```

## 核心功能

### 1. 支持的字段类型

- **input** - 文本输入框
- **textarea** - 多行文本
- **number** - 数字输入
- **select** - 下拉选择（支持 API 数据源）
- **radio** - 单选框（支持 API 数据源）
- **checkbox** - 多选框（支持 API 数据源）
- **date** - 日期选择

### 2. 字段联动

支持三种联动类型：

#### 显隐联动

选择不同选项时，动态显示/隐藏其他字段

```typescript
linkage: [
  {
    conditions: [{ field: 'country', operator: 'eq', value: 'china' }],
    action: { visible: true }
  }
]
```

#### 禁用联动

根据条件动态禁用字段

```typescript
linkage: [
  {
    conditions: [{ field: 'age', operator: 'lt', value: 18 }],
    action: { disabled: true }
  }
]
```

#### 必填联动

根据条件动态设置必填状态

```typescript
linkage: [
  {
    conditions: [{ field: 'memberType', operator: 'eq', value: 'vip' }],
    action: { required: true }
  }
]
```

### 3. API 数据源

Select/Radio/Checkbox 支持从 API 获取选项数据：

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
      transform: (data) => {
        return data.map(item => ({
          label: item.name,
          value: item.id
        }))
      }
    }
  }
}
```

### 4. 表单验证

支持多种验证方式：

```typescript
{
  name: 'email',
  type: 'input',
  label: '邮箱',
  required: true,  // 必填验证
  rules: [
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,  // 正则验证
      message: '邮箱格式不正确'
    },
    {
      validator: (value, formData) => {  // 自定义验证
        if (value.includes('test')) {
          return '邮箱不能包含test'
        }
        return true
      }
    }
  ]
}
```

## 演示页面

运行项目后访问演示页面，可以看到：

1. **基础字段**：用户名、邮箱、年龄、性别等
2. **联动示例**：
   - 选择"中国"显示城市选择
   - 选择"VIP会员"显示VIP等级（必填）
   - 选择"企业会员"显示公司名称（必填）
   - 选择"是学生"显示学校名称
   - 年龄<18且是学生时，学校字段被禁用
3. **实时数据预览**：查看表单数据的实时变化

## 常用操作

### 获取表单数据

```typescript
const formRef = ref()
const data = formRef.value?.getFormData()
```

### 设置表单数据

```typescript
formRef.value?.setFormData({
  username: '张三',
  email: 'zhangsan@example.com'
})
```

### 验证表单

```typescript
const valid = await formRef.value?.validate()
if (valid) {
  // 验证通过
}
```

### 重置表单

```typescript
formRef.value?.reset()
```

## 联动操作符说明

| 操作符      | 说明       | 使用场景             |
| ----------- | ---------- | -------------------- |
| eq          | 等于       | 字段值等于某个值     |
| neq         | 不等于     | 字段值不等于某个值   |
| gt          | 大于       | 数字比较             |
| gte         | 大于等于   | 数字比较             |
| lt          | 小于       | 数字比较             |
| lte         | 小于等于   | 数字比较             |
| in          | 在数组中   | 字段值在指定数组中   |
| notIn       | 不在数组中 | 字段值不在指定数组中 |
| includes    | 数组包含   | 数组字段包含某个值   |
| notIncludes | 数组不包含 | 数组字段不包含某个值 |

## 实际应用场景

### 1. 用户注册表单

- 根据用户类型显示不同字段
- 企业用户需要填写公司信息
- 个人用户需要填写身份信息

### 2. 订单表单

- 根据配送方式显示不同的地址字段
- 根据支付方式显示不同的支付信息

### 3. 问卷调查

- 根据答案显示后续问题
- 动态加载选项数据

### 4. 配置表单

- 根据功能开关显示/隐藏配置项
- 联动验证相关配置

## 注意事项

1. **字段名称唯一**：每个字段的 `name` 必须唯一
2. **联动依赖**：确保联动依赖的字段在 schema 中存在
3. **API 数据源**：需要正确配置 CORS 或使用代理
4. **验证规则**：自定义验证器返回 `true` 表示通过，返回字符串表示错误信息
5. **性能优化**：大量字段时建议使用分页或分步骤表单

## 扩展开发

如需添加新的字段类型，参考现有字段组件的实现方式：

1. 在 `fields/` 目录创建新组件
2. 在 `types.ts` 添加类型定义
3. 在 `FormEngine.vue` 注册组件

详细文档请查看：`src/components/FormEngine/README.md`
