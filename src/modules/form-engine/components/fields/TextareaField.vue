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
  <el-input
    v-model="value"
    type="textarea"
    :placeholder="schema.placeholder"
    :disabled="isDisabled"
    :rows="schema.props?.rows ?? 3"
    :autosize="schema.props?.autosize"
    :maxlength="schema.props?.maxlength"
    :show-word-limit="schema.props?.showWordLimit"
    v-bind="schema.props"
  />
</template>
