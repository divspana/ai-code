<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { FormInstance } from 'element-plus'
import type { FormSchema, FieldSchema, FormData } from './types'
import { calculateLinkageState } from './utils/linkage'
import InputField from './fields/InputField.vue'
import TextareaField from './fields/TextareaField.vue'
import NumberField from './fields/NumberField.vue'
import SelectField from './fields/SelectField.vue'
import RadioField from './fields/RadioField.vue'
import CheckboxField from './fields/CheckboxField.vue'
import DateField from './fields/DateField.vue'

interface Props {
  schema: FormSchema
  modelValue?: FormData
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: FormData]
  submit: [value: FormData]
  change: [value: FormData]
}>()

const formRef = ref<FormInstance>()
const formData = ref<FormData>({})

// 字段组件映射
const fieldComponents = {
  input: InputField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  date: DateField
}

// 初始化表单数据
const initFormData = () => {
  const data: FormData = {}
  
  // 使用 schema 的初始值
  if (props.schema.initialValues) {
    Object.assign(data, props.schema.initialValues)
  }
  
  // 使用字段的默认值
  props.schema.fields.forEach(field => {
    if (field.defaultValue !== undefined && data[field.name] === undefined) {
      data[field.name] = field.defaultValue
    }
  })
  
  // 使用外部传入的值
  if (props.modelValue) {
    Object.assign(data, props.modelValue)
  }
  
  formData.value = data
}

// 计算每个字段的联动状态
const getFieldLinkageState = (field: FieldSchema) => {
  return calculateLinkageState(field.linkage, formData.value)
}

// 判断字段是否可见
const isFieldVisible = (field: FieldSchema) => {
  if (field.hidden) return false
  const linkageState = getFieldLinkageState(field)
  if (linkageState.visible !== undefined) {
    return linkageState.visible
  }
  return true
}

// 判断字段是否禁用
const isFieldDisabled = (field: FieldSchema) => {
  const linkageState = getFieldLinkageState(field)
  if (linkageState.disabled !== undefined) {
    return linkageState.disabled
  }
  return field.disabled || false
}

// 判断字段是否必填
const isFieldRequired = (field: FieldSchema) => {
  const linkageState = getFieldLinkageState(field)
  if (linkageState.required !== undefined) {
    return linkageState.required
  }
  return field.required || false
}

// 获取字段的验证规则
const getFieldRules = (field: FieldSchema) => {
  const rules: any[] = []
  
  // 必填规则
  if (isFieldRequired(field)) {
    rules.push({
      required: true,
      message: `请输入${field.label}`,
      trigger: ['blur', 'change']
    })
  }
  
  // 自定义规则
  if (field.rules) {
    field.rules.forEach(rule => {
      if (rule.required !== undefined) {
        rules.push({
          required: rule.required,
          message: rule.message || `请输入${field.label}`,
          trigger: ['blur', 'change']
        })
      }
      if (rule.pattern) {
        rules.push({
          pattern: rule.pattern,
          message: rule.message || `${field.label}格式不正确`,
          trigger: ['blur', 'change']
        })
      }
      if (rule.validator) {
        rules.push({
          validator: (_rule: any, value: any, callback: any) => {
            const result = rule.validator!(value, formData.value)
            if (result === true) {
              callback()
            } else if (typeof result === 'string') {
              callback(new Error(result))
            } else {
              callback(new Error(rule.message || '验证失败'))
            }
          },
          trigger: ['blur', 'change']
        })
      }
    })
  }
  
  return rules
}

// 更新表单数据
const updateFormData = (field: string, value: any) => {
  formData.value[field] = value
  emit('update:modelValue', formData.value)
  emit('change', formData.value)
}

// 表单验证
const validate = async (): Promise<boolean> => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

// 重置表单
const reset = () => {
  formRef.value?.resetFields()
  initFormData()
}

// 清空验证
const clearValidate = () => {
  formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  const valid = await validate()
  if (valid) {
    emit('submit', formData.value)
  }
}

// 获取表单数据
const getFormData = () => {
  return formData.value
}

// 设置表单数据
const setFormData = (data: FormData) => {
  formData.value = { ...formData.value, ...data }
  emit('update:modelValue', formData.value)
}

// 暴露方法给父组件
defineExpose({
  validate,
  reset,
  clearValidate,
  getFormData,
  setFormData
})

// 监听外部数据变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    formData.value = { ...formData.value, ...newVal }
  }
}, { deep: true })

onMounted(() => {
  initFormData()
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :label-width="schema.layout?.labelWidth ?? '100px'"
    :label-position="schema.layout?.labelPosition ?? 'right'"
  >
    <el-row :gutter="schema.layout?.gutter ?? 20">
      <el-col
        v-for="field in schema.fields"
        :key="field.name"
        :span="field.span ?? 24"
        v-show="isFieldVisible(field)"
      >
        <el-form-item
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
          :style="field.style"
          :class="field.className"
        >
          <component
            :is="fieldComponents[field.type]"
            :schema="field"
            :model-value="formData[field.name]"
            :disabled="isFieldDisabled(field)"
            @update:model-value="updateFormData(field.name, $event)"
          />
        </el-form-item>
      </el-col>
    </el-row>
    
    <slot name="footer" :submit="handleSubmit" :reset="reset">
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </slot>
  </el-form>
</template>

<style scoped>
.el-form {
  width: 100%;
}
</style>
