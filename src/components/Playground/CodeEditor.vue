<template>
  <div class="code-editor">
    <div class="editor-header">
      <div class="editor-tabs">
        <div
          v-for="file in files"
          :key="file.name"
          class="editor-tab"
          :class="{ active: currentFile === file.name }"
          @click="currentFile = file.name"
        >
          {{ file.name }}
        </div>
      </div>
      <div class="editor-actions">
        <el-button :icon="CopyDocument" size="small" text @click="copyCode"> 复制代码 </el-button>
      </div>
    </div>
    <div class="editor-content">
      <textarea
        ref="editorRef"
        v-model="currentFileContent"
        class="code-textarea"
        spellcheck="false"
        @input="handleInput"
      />
      <pre class="code-highlight"><code v-html="highlightedCode" /></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface CodeFile {
  name: string
  content: string
  language: string
}

interface Props {
  files?: CodeFile[]
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  files: () => [
    {
      name: 'App.vue',
      content: '',
      language: 'vue'
    }
  ],
  modelValue: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const editorRef = ref<HTMLTextAreaElement>()
const currentFile = ref(props.files[0]?.name || 'App.vue')

const currentFileContent = computed({
  get: () => {
    const file = props.files.find(f => f.name === currentFile.value)
    return file?.content || props.modelValue
  },
  set: (value: string) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

// 简单的语法高亮
const highlightedCode = computed(() => {
  const code = currentFileContent.value
  return highlightCode(code)
})

const highlightCode = (code: string): string => {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(".*?")/g, '<span class="string">$1</span>')
    .replace(
      /\b(const|let|var|function|return|import|export|default|from|interface|type)\b/g,
      '<span class="keyword">$1</span>'
    )
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="boolean">$1</span>')
    .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
    .replace(/(@[\w-]+)/g, '<span class="decorator">$1</span>')
}

const handleInput = () => {
  // 同步滚动
  if (editorRef.value) {
    const scrollTop = editorRef.value.scrollTop
    const scrollLeft = editorRef.value.scrollLeft
    const highlight = editorRef.value.parentElement?.querySelector('.code-highlight')
    if (highlight) {
      highlight.scrollTop = scrollTop
      highlight.scrollLeft = scrollLeft
    }
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(currentFileContent.value)
    ElMessage.success('代码已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 监听文件变化
watch(
  () => props.files,
  () => {
    if (!props.files.find(f => f.name === currentFile.value)) {
      currentFile.value = props.files[0]?.name || 'App.vue'
    }
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.code-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
}

.editor-tabs {
  display: flex;
  gap: 4px;
}

.editor-tab {
  padding: 8px 16px;
  cursor: pointer;
  color: #969696;
  font-size: 13px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: #fff;
  }

  &.active {
    color: #fff;
    border-bottom-color: #409eff;
  }
}

.editor-actions {
  :deep(.el-button) {
    color: #969696;

    &:hover {
      color: #fff;
    }
  }
}

.editor-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.code-textarea,
.code-highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre;
  overflow: auto;
  border: none;
  outline: none;
}

.code-textarea {
  color: transparent;
  caret-color: #fff;
  background: transparent;
  resize: none;
  z-index: 2;
}

.code-highlight {
  color: #d4d4d4;
  background: #1e1e1e;
  pointer-events: none;
  z-index: 1;

  code {
    display: block;
  }

  :deep(.keyword) {
    color: #569cd6;
  }

  :deep(.string) {
    color: #ce9178;
  }

  :deep(.boolean) {
    color: #569cd6;
  }

  :deep(.comment) {
    color: #6a9955;
    font-style: italic;
  }

  :deep(.decorator) {
    color: #4ec9b0;
  }
}
</style>
