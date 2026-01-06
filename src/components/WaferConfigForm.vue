<template>
  <el-card class="config-card">
    <template #header>
      <div class="card-header">
        <span>Wafer 信息</span>
      </div>
    </template>

    <el-form :model="modelValue" label-width="140px" size="default">
      <el-form-item label="Diameter">
        <el-input-number
          :model-value="modelValue.diameter"
          @update:model-value="val => updateField('diameter', val)"
          :min="100"
          :max="450"
          :step="50"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-form-item label="Die Width">
        <el-input-number
          :model-value="modelValue.dieWidth"
          @update:model-value="val => updateField('dieWidth', val)"
          :min="1"
          :max="100"
          :step="0.1"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-form-item label="Die Height">
        <el-input-number
          :model-value="modelValue.dieHeight"
          @update:model-value="val => updateField('dieHeight', val)"
          :min="1"
          :max="100"
          :step="0.1"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-form-item label="Reticle X">
        <el-input-number
          :model-value="modelValue.reticleX"
          @update:model-value="val => updateField('reticleX', val)"
          :min="1"
          :max="20"
        />
      </el-form-item>

      <el-form-item label="Reticle Y">
        <el-input-number
          :model-value="modelValue.reticleY"
          @update:model-value="val => updateField('reticleY', val)"
          :min="1"
          :max="20"
        />
      </el-form-item>

      <el-form-item label="Show Reticle Border">
        <el-switch
          :model-value="modelValue.showReticleBorder"
          @update:model-value="val => updateField('showReticleBorder', val)"
        />
      </el-form-item>

      <el-form-item label="Scribe Line X">
        <el-input-number
          :model-value="modelValue.scribeLineX"
          @update:model-value="val => updateField('scribeLineX', val)"
          :min="0"
          :max="5"
          :step="0.01"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-form-item label="Scribe Line Y">
        <el-input-number
          :model-value="modelValue.scribeLineY"
          @update:model-value="val => updateField('scribeLineY', val)"
          :min="0"
          :max="5"
          :step="0.01"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-divider />

      <el-form-item label="Offset By">
        <el-radio-group
          :model-value="modelValue.offsetBy"
          @update:model-value="val => updateField('offsetBy', val)"
        >
          <el-radio label="By Die">By Die</el-radio>
          <el-radio label="By Reticle">By Reticle</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="Die Offset X">
        <el-input-number
          :model-value="modelValue.dieOffsetX"
          @update:model-value="val => updateField('dieOffsetX', val)"
          :min="-50"
          :max="50"
          :step="0.1"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-form-item label="Die Offset Y">
        <el-input-number
          :model-value="modelValue.dieOffsetY"
          @update:model-value="val => updateField('dieOffsetY', val)"
          :min="-50"
          :max="50"
          :step="0.1"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-form-item label="Reticle Offset X">
        <el-input-number
          :model-value="modelValue.reticleOffsetX"
          @update:model-value="val => updateField('reticleOffsetX', val)"
          :min="-50"
          :max="50"
          :step="0.01"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-form-item label="Reticle Offset Y">
        <el-input-number
          :model-value="modelValue.reticleOffsetY"
          @update:model-value="val => updateField('reticleOffsetY', val)"
          :min="-50"
          :max="50"
          :step="0.01"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-divider />

      <el-form-item label="Notch">
        <el-select
          :model-value="modelValue.notch"
          @update:model-value="val => updateField('notch', val)"
        >
          <el-option label="UP" value="UP" />
          <el-option label="DOWN" value="DOWN" />
          <el-option label="LEFT" value="LEFT" />
          <el-option label="RIGHT" value="RIGHT" />
        </el-select>
      </el-form-item>

      <el-form-item label="X Positive">
        <el-select
          :model-value="modelValue.xPositive"
          @update:model-value="val => updateField('xPositive', val)"
        >
          <el-option label="RIGHT" value="RIGHT" />
          <el-option label="LEFT" value="LEFT" />
        </el-select>
      </el-form-item>

      <el-form-item label="Y Positive">
        <el-select
          :model-value="modelValue.yPositive"
          @update:model-value="val => updateField('yPositive', val)"
        >
          <el-option label="UP" value="UP" />
          <el-option label="DOWN" value="DOWN" />
        </el-select>
      </el-form-item>

      <el-form-item label="Center X">
        <el-input-number
          :model-value="modelValue.centerX"
          @update:model-value="val => updateField('centerX', val)"
          :min="-100"
          :max="100"
        />
      </el-form-item>

      <el-form-item label="Center Y">
        <el-input-number
          :model-value="modelValue.centerY"
          @update:model-value="val => updateField('centerY', val)"
          :min="-100"
          :max="100"
        />
      </el-form-item>

      <el-form-item label="Bevel">
        <el-input-number
          :model-value="modelValue.bevel"
          @update:model-value="val => updateField('bevel', val)"
          :min="0"
          :max="10"
          :step="0.1"
        />
        <span class="unit">mm</span>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
export interface WaferConfig {
  diameter: number
  dieWidth: number
  dieHeight: number
  reticleX: number
  reticleY: number
  scribeLineX: number
  scribeLineY: number
  offsetBy: string
  dieOffsetX: number
  dieOffsetY: number
  reticleOffsetX: number
  reticleOffsetY: number
  notch: string
  xPositive: string
  yPositive: string
  centerX: number
  centerY: number
  bevel: number
  showReticleBorder: boolean
}

interface Props {
  modelValue: WaferConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: WaferConfig]
}>()

const updateField = <K extends keyof WaferConfig>(
  field: K,
  value: WaferConfig[K] | null | undefined
) => {
  // el-input-number 可能返回 null，需要过滤
  if (value === null || value === undefined) return

  const newConfig = { ...props.modelValue, [field]: value }
  emit('update:modelValue', newConfig)
}

const handleReset = () => {
  emit('update:modelValue', {
    diameter: 300,
    dieWidth: 20,
    dieHeight: 20,
    reticleX: 3,
    reticleY: 3,
    scribeLineX: 0.08,
    scribeLineY: 0.08,
    offsetBy: 'By Die',
    dieOffsetX: 0,
    dieOffsetY: 0,
    reticleOffsetX: 15.03,
    reticleOffsetY: 10.05,
    notch: 'DOWN',
    xPositive: 'RIGHT',
    yPositive: 'UP',
    centerX: 0,
    centerY: 0,
    bevel: 3,
    showReticleBorder: false
  })
}
</script>

<style scoped lang="scss">
.config-card {
  height: 100%;

  .card-header {
    font-weight: 600;
    font-size: 16px;
  }
}

.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

:deep(.el-input-number) {
  width: 180px;
}

:deep(.el-divider) {
  margin: 20px 0;
}
</style>
