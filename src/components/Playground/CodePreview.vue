<template>
  <div class="code-preview">
    <div class="preview-header">
      <span class="preview-title">预览</span>
      <div class="preview-actions">
        <el-button :icon="Refresh" size="small" text @click="refreshPreview"> 刷新 </el-button>
      </div>
    </div>
    <div class="preview-content">
      <div v-if="error" class="preview-error">
        <el-alert type="error" :title="error" :closable="false" />
      </div>
      <div v-else ref="previewRef" class="preview-container" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import * as Vue from 'vue'
import * as ElementPlus from 'element-plus'
import * as ElementPlusIcons from '@element-plus/icons-vue'

interface Props {
  code: string
}

const props = defineProps<Props>()

const previewRef = ref<HTMLElement>()
const error = ref('')
let app: Vue.App | null = null

const renderPreview = async () => {
  error.value = ''

  if (!previewRef.value) {
    return
  }

  // 清理旧的实例
  if (app) {
    try {
      app.unmount()
    } catch (e) {
      console.warn('Unmount error:', e)
    }
    app = null
  }

  // 清空容器
  previewRef.value.innerHTML = ''

  try {
    // 解析 Vue 组件代码
    const component = parseVueComponent(props.code)

    // 创建新的 Vue 应用
    app = Vue.createApp(component)
    app.use(ElementPlus)

    // 注册所有图标组件
    Object.keys(ElementPlusIcons).forEach(key => {
      app!.component(key, ElementPlusIcons[key as keyof typeof ElementPlusIcons])
    })

    await nextTick()
    app.mount(previewRef.value)
  } catch (err) {
    error.value = (err as Error).message
    console.error('Preview render error:', err)
  }
}

const parseVueComponent = (code: string) => {
  try {
    // 提取 template
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/)
    const template = templateMatch ? templateMatch[1].trim() : ''

    // 提取 script setup
    const scriptMatch = code.match(/<script setup.*?>([\s\S]*?)<\/script>/)
    const scriptContent = scriptMatch ? scriptMatch[1].trim() : ''

    // 提取 style
    const styleMatch = code.match(/<style.*?>([\s\S]*?)<\/style>/)
    const style = styleMatch ? styleMatch[1].trim() : ''

    // 添加样式
    if (style) {
      addStyle(style)
    }

    // 如果没有 script，直接返回 template
    if (!scriptContent) {
      return {
        template: template || '<div>Empty template</div>'
      }
    }

    // 处理 script setup 代码
    // 移除 import 语句（因为我们已经全局导入了）
    let processedScript = scriptContent
      .replace(/import\s+{[^}]+}\s+from\s+['"]vue['"]/g, '')
      .replace(/import\s+{[^}]+}\s+from\s+['"]element-plus['"]/g, '')
      .replace(/import\s+{[^}]+}\s+from\s+['"]@element-plus\/icons-vue['"]/g, '')
      .replace(/import\s+.*?from\s+['"]@\/.*?['"]/g, '')
      .trim()

    // 创建 setup 函数
    const setupFunction = new Function(
      'Vue',
      'ElementPlus',
      'Icons',
      'ElMessage',
      'ElMessageBox',
      'ElNotification',
      `
        const { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } = Vue
        const { 
          ElButton, ElInput, ElForm, ElFormItem, ElTable, ElTableColumn, 
          ElRadio, ElRadioGroup, ElUpload, ElAlert, ElMessage, ElMessageBox,
          ElNotification, ElSelect, ElOption, ElCheckbox, ElCheckboxGroup,
          ElSwitch, ElDatePicker, ElTimePicker, ElInputNumber, ElSlider,
          ElRate, ElColorPicker, ElTransfer, ElCascader, ElTree, ElPagination,
          ElDialog, ElDrawer, ElPopover, ElTooltip, ElDropdown, ElDropdownMenu,
          ElDropdownItem, ElMenu, ElMenuItem, ElMenuItemGroup, ElSubMenu,
          ElTabs, ElTabPane, ElBreadcrumb, ElBreadcrumbItem, ElSteps, ElStep,
          ElCard, ElCollapse, ElCollapseItem, ElTimeline, ElTimelineItem,
          ElDivider, ElCalendar, ElImage, ElBacktop, ElInfiniteScroll,
          ElAvatar, ElEmpty, ElDescriptions, ElDescriptionsItem, ElResult,
          ElStatistic, ElTag, ElProgress, ElSkeleton, ElSkeletonItem,
          ElRow, ElCol, ElContainer, ElHeader, ElAside, ElMain, ElFooter
        } = ElementPlus
        const { Search, Edit, Check, Delete, Plus, Minus, Close, Upload: UploadIcon } = Icons
        
        ${processedScript}
        
        // 返回所有响应式数据和方法
        return {
          ${extractExports(processedScript)}
        }
      `
    )

    return {
      template: template || '<div>Empty template</div>',
      setup() {
        try {
          return setupFunction(
            Vue,
            ElementPlus,
            ElementPlusIcons,
            ElementPlus.ElMessage,
            ElementPlus.ElMessageBox,
            ElementPlus.ElNotification
          )
        } catch (err) {
          console.error('Setup function error:', err)
          return {}
        }
      }
    }
  } catch (err) {
    throw new Error(`组件解析失败: ${(err as Error).message}`)
  }
}

// 提取需要导出的变量和函数
const extractExports = (code: string): string => {
  const exports: string[] = []

  // 匹配 const/let 声明
  const constMatches = code.matchAll(/(?:const|let)\s+(\w+)\s*=/g)
  for (const match of constMatches) {
    exports.push(match[1])
  }

  // 匹配函数声明
  const funcMatches = code.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g)
  for (const match of funcMatches) {
    if (!exports.includes(match[1])) {
      exports.push(match[1])
    }
  }

  return exports.join(', ')
}

const addStyle = (css: string) => {
  const styleId = 'playground-preview-style'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = css
}

const refreshPreview = () => {
  renderPreview()
}

watch(
  () => props.code,
  () => {
    renderPreview()
  },
  { immediate: false }
)

onMounted(() => {
  renderPreview()
})
</script>

<style scoped lang="scss">
.code-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 40px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.preview-actions {
  :deep(.el-button) {
    color: #606266;
  }
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.preview-error {
  padding: 16px;
}

.preview-container {
  min-height: 100%;
}
</style>
