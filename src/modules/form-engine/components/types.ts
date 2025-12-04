// 表单字段类型
export type FieldType = 'input' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'number'

// 数据源配置
export interface DataSourceConfig {
  // 静态数据
  data?: Array<{ label: string; value: any }>
  // API 配置
  api?: {
    url: string
    method?: 'GET' | 'POST'
    params?: Record<string, any>
    headers?: Record<string, string>
    // 数据转换函数，将 API 返回的数据转换为 { label, value } 格式
    transform?: (data: any) => Array<{ label: string; value: any }>
  }
}

// 联动条件
export interface LinkageCondition {
  // 依赖的字段名
  field: string
  // 条件操作符
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'includes' | 'notIncludes'
  // 比较值
  value: any
}

// 联动规则
export interface LinkageRule {
  // 条件关系：all-所有条件都满足，any-任一条件满足
  relation?: 'all' | 'any'
  // 条件列表
  conditions: LinkageCondition[]
  // 满足条件时的动作
  action: {
    disabled?: boolean
    visible?: boolean
    required?: boolean
  }
}

// 表单字段 Schema
export interface FieldSchema {
  // 字段名称（对应表单数据的 key）
  name: string
  // 字段类型
  type: FieldType
  // 字段标签
  label: string
  // 占位符
  placeholder?: string
  // 默认值
  defaultValue?: any
  // 是否必填
  required?: boolean
  // 是否禁用
  disabled?: boolean
  // 是否隐藏
  hidden?: boolean
  // 验证规则
  rules?: Array<{
    required?: boolean
    message?: string
    pattern?: RegExp
    validator?: (value: any, formData: Record<string, any>) => boolean | string
  }>
  // 数据源配置（用于 select、radio、checkbox）
  dataSource?: DataSourceConfig
  // 字段属性配置
  props?: {
    // input 特有
    maxlength?: number
    minlength?: number
    showWordLimit?: boolean
    clearable?: boolean
    // textarea 特有
    rows?: number
    autosize?: boolean | { minRows: number; maxRows: number }
    // number 特有
    min?: number
    max?: number
    step?: number
    precision?: number
    // select 特有
    multiple?: boolean
    filterable?: boolean
    // 其他通用属性
    [key: string]: any
  }
  // 联动规则
  linkage?: LinkageRule[]
  // 栅格布局（基于 24 栅格）
  span?: number
  // 自定义样式
  style?: Record<string, any>
  // 自定义类名
  className?: string
}

// 表单 Schema
export interface FormSchema {
  // 表单字段列表
  fields: FieldSchema[]
  // 表单布局配置
  layout?: {
    // 标签宽度
    labelWidth?: string
    // 标签位置
    labelPosition?: 'left' | 'right' | 'top'
    // 栅格间距
    gutter?: number
  }
  // 表单初始数据
  initialValues?: Record<string, any>
}

// 表单数据
export type FormData = Record<string, any>
