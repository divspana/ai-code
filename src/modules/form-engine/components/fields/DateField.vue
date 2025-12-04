<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <el-date-picker
    v-model="value"
    :placeholder="schema.placeholder"
    :disabled="isDisabled"
    :type="schema.props?.type ?? 'date'"
    :format="schema.props?.format"
    :value-format="schema.props?.valueFormat"
    style="width: 100%"
    v-bind="schema.props"
  />
</template>
