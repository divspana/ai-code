<template>
  <div class="iframe-preview">
    <div class="preview-header">
      <span class="preview-title">预览</span>
      <div class="preview-actions">
        <el-button :icon="Refresh" size="small" text @click="refreshPreview"> 刷新 </el-button>
      </div>
    </div>
    <div class="preview-content">
      <iframe ref="iframeRef" class="preview-iframe" sandbox="allow-scripts" @load="onIframeLoad" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'

interface Props {
  code: string
}

const props = defineProps<Props>()

const iframeRef = ref<HTMLIFrameElement>()

const generatePreviewHTML = (code: string): string => {
  // 提取各部分
  const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/)
  const template = templateMatch ? templateMatch[1].trim() : ''

  const scriptMatch = code.match(/<script setup.*?>([\s\S]*?)<\/script>/)
  const script = scriptMatch ? scriptMatch[1].trim() : ''

  const styleMatch = code.match(/<style.*?>([\s\S]*?)<\/style>/)
  const style = styleMatch ? styleMatch[1].trim() : ''

  // 生成完整的 HTML
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"><" + "/script>
  <script src="https://unpkg.com/element-plus"><" + "/script>
  <script src="https://unpkg.com/@element-plus/icons-vue"><" + "/script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    ${style}
  </style>
</head>
<body>
  <div id="app">${template}</div>
  
  <script>
    const { createApp, ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } = Vue
    const { ElMessage, ElMessageBox, ElNotification } = ElementPlus
    
    const App = {
      template: \`${template.replace(/`/g, '\\`')}\`,
      setup() {
        try {
          ${script}
          
          // 自动收集所有变量
          const exports = {}
          ${extractExports(script)}
          return exports
        } catch (err) {
          console.error('Setup error:', err)
          ElMessage.error('代码执行错误: ' + err.message)
          return {}
        }
      }
    }
    
    const app = createApp(App)
    app.use(ElementPlus)
    
    // 注册所有图标
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }
    
    app.mount('#app')
  <" + "/script>
</body>
</html>
  `
}

const extractExports = (script: string): string => {
  const exports: string[] = []

  // 匹配 const/let 声明
  const matches = script.matchAll(/(?:const|let)\s+(\w+)\s*=/g)
  for (const match of matches) {
    const varName = match[1]
    exports.push(`exports.${varName} = ${varName}`)
  }

  return exports.join('\n          ')
}

const renderPreview = () => {
  if (!iframeRef.value) {
    return
  }

  const html = generatePreviewHTML(props.code)
  const iframe = iframeRef.value
  const doc = iframe.contentDocument || iframe.contentWindow?.document

  if (doc) {
    doc.open()
    doc.write(html)
    doc.close()
  }
}

const refreshPreview = () => {
  renderPreview()
}

const onIframeLoad = () => {
  // iframe 加载完成
}

watch(
  () => props.code,
  () => {
    renderPreview()
  },
  { immediate: false }
)

onMounted(() => {
  setTimeout(() => {
    renderPreview()
  }, 100)
})
</script>

<style scoped lang="scss">
.iframe-preview {
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
  flex-shrink: 0;
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
  overflow: hidden;
  position: relative;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
</style>
