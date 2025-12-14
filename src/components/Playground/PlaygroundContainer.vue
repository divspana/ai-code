<template>
  <div class="playground-container">
    <div class="playground-header">
      <div class="header-left">
        <h2 class="playground-title">{{ title }}</h2>
        <p v-if="description" class="playground-description">
          {{ description }}
        </p>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button
            :type="layout === 'horizontal' ? 'primary' : ''"
            :icon="Grid"
            size="small"
            @click="layout = 'horizontal'"
          >
            横向
          </el-button>
          <el-button
            :type="layout === 'vertical' ? 'primary' : ''"
            :icon="Menu"
            size="small"
            @click="layout = 'vertical'"
          >
            纵向
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="playground-content" :class="`layout-${layout}`">
      <div class="playground-editor">
        <CodeEditor v-model="code" :files="files" />
      </div>
      <div class="playground-divider" />
      <div class="playground-preview">
        <CodePreview :code="code" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Grid, Menu } from '@element-plus/icons-vue'
import CodeEditor from './CodeEditor.vue'
import CodePreview from './IframePreview.vue'

interface CodeFile {
  name: string
  content: string
  language: string
}

interface Props {
  title?: string
  description?: string
  initialCode?: string
  files?: CodeFile[]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Playground',
  description: '',
  initialCode: '<template>\n  <div>\n    <h1>Hello Playground!</h1>\n  </div>\n</template>',
  files: () => []
})

const code = ref(props.initialCode)
const layout = ref<'horizontal' | 'vertical'>('horizontal')

// 监听初始代码变化
watch(
  () => props.initialCode,
  newCode => {
    code.value = newCode
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.playground-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.playground-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.header-left {
  flex: 1;
}

.playground-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.playground-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.header-right {
  margin-left: 20px;
}

.playground-content {
  flex: 1;
  display: flex;
  overflow: hidden;

  &.layout-horizontal {
    flex-direction: row;

    .playground-editor,
    .playground-preview {
      flex: 1;
      height: 100%;
    }

    .playground-divider {
      width: 1px;
      height: 100%;
      background: #e4e7ed;
    }
  }

  &.layout-vertical {
    flex-direction: column;

    .playground-editor,
    .playground-preview {
      width: 100%;
      flex: 1;
    }

    .playground-divider {
      width: 100%;
      height: 1px;
      background: #e4e7ed;
    }
  }
}

.playground-editor,
.playground-preview {
  overflow: hidden;
}
</style>
