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
  get: () => props.modelValue || [],
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

  if (dataSource.data) {
    options.value = dataSource.data
    return
  }

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

      if (transform) {
        options.value = transform(data)
      } else {
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

watch(() => props.schema.dataSource, loadDataSource, { deep: true })

onMounted(() => {
  loadDataSource()
})
</script>

<template>
  <el-checkbox-group
    v-model="value"
    :disabled="isDisabled"
    v-bind="schema.props"
  >
    <el-checkbox
      v-for="option in options"
      :key="option.value"
      :label="option.value"
    >
      {{ option.label }}
    </el-checkbox>
  </el-checkbox-group>
</template>
