<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import FormEngine from '../form-engine/components/FormEngine.vue'
import type { FieldSchema, FormSchema } from '../form-engine/components/types'

// 字段类型模板
const fieldTemplates = [
  { type: 'input', label: '文本输入', icon: 'Edit' },
  { type: 'textarea', label: '多行文本', icon: 'Document' },
  { type: 'number', label: '数字输入', icon: 'Histogram' },
  { type: 'select', label: '下拉选择', icon: 'ArrowDown' },
  { type: 'radio', label: '单选框', icon: 'CircleCheck' },
  { type: 'checkbox', label: '多选框', icon: 'Select' },
  { type: 'date', label: '日期选择', icon: 'Calendar' }
]

// 当前表单配置
const formSchema = ref<FormSchema>({
  fields: []
})

// 表单数据
const formData = ref<Record<string, any>>({})

// 当前选中的字段
const selectedFieldIndex = ref<number | null>(null)
const selectedField = computed(() => {
  if (selectedFieldIndex.value !== null) {
    return formSchema.value.fields[selectedFieldIndex.value]
  }
  return null
})

// 拖拽相关
const draggedTemplate = ref<any>(null)
const draggedFieldIndex = ref<number | null>(null)

// 开始拖拽字段模板
const handleTemplateDragStart = (template: any) => {
  draggedTemplate.value = template
}

// 开始拖拽已有字段
const handleFieldDragStart = (index: number) => {
  draggedFieldIndex.value = index
}

// 拖拽到画布
const handleCanvasDrop = (e: DragEvent) => {
  e.preventDefault()
  
  if (draggedTemplate.value) {
    // 从模板添加新字段
    const newField: FieldSchema = {
      name: `field_${Date.now()}`,
      label: draggedTemplate.value.label,
      type: draggedTemplate.value.type,
      required: false,
      placeholder: `请输入${draggedTemplate.value.label}`
    }
    
    // 为 select/radio/checkbox 添加默认选项
    if (['select', 'radio', 'checkbox'].includes(newField.type)) {
      newField.options = [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' }
      ]
    }
    
    formSchema.value.fields.push(newField)
    selectedFieldIndex.value = formSchema.value.fields.length - 1
    ElMessage.success('字段添加成功')
  } else if (draggedFieldIndex.value !== null) {
    // 字段排序（暂不实现）
  }
  
  draggedTemplate.value = null
  draggedFieldIndex.value = null
}

const handleCanvasDragOver = (e: DragEvent) => {
  e.preventDefault()
}

// 选中字段
const selectField = (index: number) => {
  selectedFieldIndex.value = index
}

// 删除字段
const deleteField = (index: number) => {
  formSchema.value.fields.splice(index, 1)
  if (selectedFieldIndex.value === index) {
    selectedFieldIndex.value = null
  }
  ElMessage.success('字段已删除')
}

// 复制字段
const duplicateField = (index: number) => {
  const field = JSON.parse(JSON.stringify(formSchema.value.fields[index]))
  field.name = `${field.name}_copy_${Date.now()}`
  formSchema.value.fields.splice(index + 1, 0, field)
  ElMessage.success('字段已复制')
}

// 添加选项（用于 select/radio/checkbox）
const addOption = () => {
  if (selectedField.value && selectedField.value.options) {
    selectedField.value.options.push({
      label: `选项${selectedField.value.options.length + 1}`,
      value: `${selectedField.value.options.length + 1}`
    })
  }
}

// 删除选项
const deleteOption = (optionIndex: number) => {
  if (selectedField.value && selectedField.value.options) {
    selectedField.value.options.splice(optionIndex, 1)
  }
}

// 导出 Schema
const exportSchema = () => {
  const schemaJson = JSON.stringify(formSchema.value, null, 2)
  const blob = new Blob([schemaJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'form-schema.json'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('Schema 已导出')
}

// 导入 Schema
const importSchema = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const schema = JSON.parse(event.target?.result as string)
        formSchema.value = schema
        selectedFieldIndex.value = null
        ElMessage.success('Schema 已导入')
      } catch (error) {
        ElMessage.error('导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
  }
}

// 复制 Schema 代码
const copySchemaCode = () => {
  const schemaJson = JSON.stringify(formSchema.value, null, 2)
  navigator.clipboard.writeText(schemaJson)
  ElMessage.success('Schema 代码已复制到剪贴板')
}

// 清空表单
const clearForm = () => {
  formSchema.value.fields = []
  selectedFieldIndex.value = null
  ElMessage.success('表单已清空')
}

// 预览模式
const previewMode = ref(false)
</script>

<template>
  <div class="form-builder">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>📐 表单设计器</h2>
        <el-tag>{{ formSchema.fields.length }} 个字段</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button @click="previewMode = !previewMode">
          <el-icon><View /></el-icon>
          {{ previewMode ? '编辑模式' : '预览模式' }}
        </el-button>
        <el-button @click="copySchemaCode">
          <el-icon><DocumentCopy /></el-icon>
          复制代码
        </el-button>
        <el-button @click="exportSchema">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-upload
          :show-file-list="false"
          :auto-upload="false"
          accept=".json"
          @change="importSchema"
        >
          <el-button>
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
        </el-upload>
        <el-button type="danger" plain @click="clearForm">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>

    <div class="builder-container">
      <!-- 左侧：字段面板 -->
      <div v-if="!previewMode" class="field-palette">
        <h3>字段组件</h3>
        <div class="field-list">
          <div
            v-for="template in fieldTemplates"
            :key="template.type"
            class="field-template"
            draggable="true"
            @dragstart="handleTemplateDragStart(template)"
          >
            <el-icon><component :is="template.icon" /></el-icon>
            <span>{{ template.label }}</span>
          </div>
        </div>
        
        <div class="palette-tips">
          <el-alert
            title="使用提示"
            type="info"
            :closable="false"
          >
            <p>拖拽左侧字段到中间画布</p>
            <p>点击字段可在右侧配置属性</p>
          </el-alert>
        </div>
      </div>

      <!-- 中间：画布区域 -->
      <div class="canvas-area">
        <div
          v-if="!previewMode"
          class="canvas"
          @drop="handleCanvasDrop"
          @dragover="handleCanvasDragOver"
        >
          <div v-if="formSchema.fields.length === 0" class="canvas-empty">
            <el-icon :size="60"><Plus /></el-icon>
            <p>拖拽左侧字段到这里开始设计表单</p>
          </div>

          <div
            v-for="(field, index) in formSchema.fields"
            :key="field.name"
            class="canvas-field"
            :class="{ active: selectedFieldIndex === index }"
            draggable="true"
            @click="selectField(index)"
            @dragstart="handleFieldDragStart(index)"
          >
            <div class="field-header">
              <span class="field-label">
                <el-icon><component :is="fieldTemplates.find(t => t.type === field.type)?.icon" /></el-icon>
                {{ field.label }}
                <el-tag v-if="field.required" type="danger" size="small">必填</el-tag>
              </span>
              <div class="field-actions">
                <el-button link @click.stop="duplicateField(index)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
                <el-button link type="danger" @click.stop="deleteField(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="field-preview">
              <el-input v-if="field.type === 'input'" :placeholder="field.placeholder" disabled />
              <el-input v-else-if="field.type === 'textarea'" type="textarea" :placeholder="field.placeholder" disabled />
              <el-input-number v-else-if="field.type === 'number'" disabled />
              <el-select v-else-if="field.type === 'select'" :placeholder="field.placeholder" disabled>
                <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
              <el-radio-group v-else-if="field.type === 'radio'" disabled>
                <el-radio v-for="opt in field.options" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
              </el-radio-group>
              <el-checkbox-group v-else-if="field.type === 'checkbox'" disabled>
                <el-checkbox v-for="opt in field.options" :key="opt.value" :label="opt.value">{{ opt.label }}</el-checkbox>
              </el-checkbox-group>
              <el-date-picker v-else-if="field.type === 'date'" :placeholder="field.placeholder" disabled />
            </div>
          </div>
        </div>

        <!-- 预览模式 -->
        <div v-else class="preview-area">
          <el-card>
            <template #header>
              <h3>表单预览</h3>
            </template>
            <FormEngine
              v-if="formSchema.fields.length > 0"
              :schema="formSchema"
              v-model="formData"
            />
            <el-empty v-else description="暂无字段" />
          </el-card>
        </div>
      </div>

      <!-- 右侧：属性配置面板 -->
      <div v-if="!previewMode" class="config-panel">
        <div v-if="selectedField" class="config-content">
          <h3>字段属性</h3>
          
          <el-form label-width="80px" label-position="top">
            <el-form-item label="字段名称">
              <el-input v-model="selectedField.name" placeholder="唯一标识" />
            </el-form-item>

            <el-form-item label="字段标签">
              <el-input v-model="selectedField.label" placeholder="显示名称" />
            </el-form-item>

            <el-form-item label="占位提示">
              <el-input v-model="selectedField.placeholder" placeholder="输入提示文字" />
            </el-form-item>

            <el-form-item label="默认值">
              <el-input v-model="selectedField.defaultValue" placeholder="默认值" />
            </el-form-item>

            <el-form-item label="字段配置">
              <el-checkbox v-model="selectedField.required">必填</el-checkbox>
              <el-checkbox v-model="selectedField.disabled">禁用</el-checkbox>
              <el-checkbox v-model="selectedField.readonly">只读</el-checkbox>
            </el-form-item>

            <!-- 选项配置（select/radio/checkbox） -->
            <el-form-item v-if="['select', 'radio', 'checkbox'].includes(selectedField.type)" label="选项配置">
              <div class="options-config">
                <div
                  v-for="(option, optIndex) in selectedField.options"
                  :key="optIndex"
                  class="option-item"
                >
                  <el-input v-model="option.label" placeholder="标签" size="small" />
                  <el-input v-model="option.value" placeholder="值" size="small" />
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="deleteOption(optIndex)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button size="small" @click="addOption">
                  <el-icon><Plus /></el-icon>
                  添加选项
                </el-button>
              </div>
            </el-form-item>

            <!-- 数字输入特殊配置 -->
            <template v-if="selectedField.type === 'number'">
              <el-form-item label="最小值">
                <el-input-number v-model="selectedField.min" :controls="false" />
              </el-form-item>
              <el-form-item label="最大值">
                <el-input-number v-model="selectedField.max" :controls="false" />
              </el-form-item>
              <el-form-item label="步长">
                <el-input-number v-model="selectedField.step" :controls="false" />
              </el-form-item>
            </template>
          </el-form>
        </div>

        <div v-else class="config-empty">
          <el-icon :size="60"><Setting /></el-icon>
          <p>请选择一个字段进行配置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-builder {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.toolbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.builder-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧字段面板 */
.field-palette {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  overflow-y: auto;
  flex-shrink: 0;
}

.field-palette h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.field-template {
  padding: 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: move;
  transition: all 0.3s;
}

.field-template:hover {
  background: #e6f7ff;
  border-color: var(--el-color-primary);
  transform: translateX(4px);
}

.field-template .el-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.palette-tips {
  margin-top: 20px;
}

.palette-tips p {
  margin: 4px 0;
  font-size: 12px;
}

/* 中间画布区域 */
.canvas-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.canvas {
  min-height: 100%;
  background: #fff;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 20px;
}

.canvas-empty {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.canvas-empty .el-icon {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.canvas-field {
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.canvas-field:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.canvas-field.active {
  border-color: var(--el-color-primary);
  background: #e6f7ff;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.field-actions {
  display: flex;
  gap: 4px;
}

.field-preview {
  pointer-events: none;
}

/* 预览区域 */
.preview-area {
  max-width: 800px;
  margin: 0 auto;
}

/* 右侧配置面板 */
.config-panel {
  width: 320px;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  padding: 20px;
  overflow-y: auto;
  flex-shrink: 0;
}

.config-content h3 {
  margin: 0 0 20px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.config-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.config-empty .el-icon {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.options-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-item .el-input {
  flex: 1;
}
</style>
