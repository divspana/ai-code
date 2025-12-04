<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FieldSchema } from '../types'

interface Props {
  schema: FieldSchema
  modelValue: any
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isDisabled = computed(() => props.disabled || props.schema.disabled)
const options = ref<Array<{ label: string; value: any }>>([])
const loading = ref(false)

// 加载数据源
const loadDataSource = async () => {
  const dataSource = props.schema.dataSource
  if (!dataSource) {
    options.value = []
    return
  }

  // 静态数据
  if (dataSource.data) {
    options.value = dataSource.data
    return
  }

  // API 数据
  if (dataSource.api) {
    loading.value = true
    try {
      const { url, method = 'GET', params, headers, transform } = dataSource.api
      
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      let fetchUrl = url
      if (method === 'GET' && params) {
        const queryString = new URLSearchParams(params).toString()
        fetchUrl = `${url}?${queryString}`
      } else if (method === 'POST' && params) {
        fetchOptions.body = JSON.stringify(params)
      }

      const response = await fetch(fetchUrl, fetchOptions)
      const data = await response.json()

      // 使用 transform 函数转换数据
      if (transform) {
        options.value = transform(data)
      } else {
        // 默认假设返回的就是 { label, value } 格式的数组
        options.value = Array.isArray(data) ? data : []
      }
    } catch (error) {
      console.error('Failed to load data source:', error)
      ElMessage.error('加载选项数据失败')
      options.value = []
    } finally {
      loading.value = false
    }
  }
}

// 监听 dataSource 变化，重新加载
watch(() => props.schema.dataSource, loadDataSource, { deep: true })

onMounted(() => {
  loadDataSource()
})
</script>

<template>
  <el-select
    v-model="value"
    :placeholder="schema.placeholder"
    :disabled="isDisabled"
    :loading="loading"
    :multiple="schema.props?.multiple"
    :filterable="schema.props?.filterable ?? true"
    :clearable="schema.props?.clearable ?? true"
    style="width: 100%"
    v-bind="schema.props"
  >
    <el-option
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
</template>
