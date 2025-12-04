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
  <el-input-number
    v-model="value"
    :placeholder="schema.placeholder"
    :disabled="isDisabled"
    :min="schema.props?.min"
    :max="schema.props?.max"
    :step="schema.props?.step ?? 1"
    :precision="schema.props?.precision"
    :controls-position="schema.props?.controlsPosition ?? 'right'"
    style="width: 100%"
    v-bind="schema.props"
  />
</template>
