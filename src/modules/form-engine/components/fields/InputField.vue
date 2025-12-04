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
    :placeholder="schema.placeholder"
    :disabled="isDisabled"
    :maxlength="schema.props?.maxlength"
    :minlength="schema.props?.minlength"
    :show-word-limit="schema.props?.showWordLimit"
    :clearable="schema.props?.clearable ?? true"
    v-bind="schema.props"
  />
</template>
