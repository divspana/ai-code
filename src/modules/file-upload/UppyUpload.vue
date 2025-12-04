<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Dashboard } from '@uppy/vue'
import Uppy from '@uppy/core'
import XHRUpload from '@uppy/xhr-upload'
import DragDrop from '@uppy/drag-drop'

// 导入 Uppy 样式
// 注意：在 Vite 中可能需要在 index.html 中引入，或使用以下方式
// import '@uppy/core/dist/style.min.css'
// import '@uppy/dashboard/dist/style.min.css'

// 创建 Uppy 实例
const uppy = ref<Uppy | null>(null)

// 统计信息
const stats = ref({
  totalFiles: 0,
  uploadedFiles: 0,
  totalSize: 0,
  uploadedSize: 0
})

// 初始化 Uppy
onMounted(() => {
  uppy.value = new Uppy({
    id: 'uppy-upload',
    autoProceed: false,
    debug: true,
    restrictions: {
      maxFileSize: 100 * 1024 * 1024, // 100 MB
      maxNumberOfFiles: 50,
      minNumberOfFiles: 1,
      allowedFileTypes: null // 允许所有类型
    },
    locale: {
      strings: {
        // 中文翻译
        addMoreFiles: '添加更多文件',
        addingMoreFiles: '添加更多文件',
        allowAccessDescription: '为了拍照或录制视频，请允许访问您的相机',
        allowAccessTitle: '请允许访问您的相机',
        authenticateWith: '连接到 %{pluginName}',
        authenticateWithTitle: '请通过 %{pluginName} 进行身份验证以选择文件',
        back: '返回',
        browse: '浏览',
        browseFiles: '浏览文件',
        cancel: '取消',
        cancelUpload: '取消上传',
        chooseFiles: '选择文件',
        closeModal: '关闭窗口',
        companionError: '连接到 Companion 失败',
        complete: '完成',
        connectedToInternet: '已连接到互联网',
        copyLink: '复制链接',
        copyLinkToClipboardFallback: '复制下面的 URL',
        copyLinkToClipboardSuccess: '链接已复制到剪贴板',
        creatingAssembly: '准备上传...',
        creatingAssemblyFailed: '无法创建 Assembly',
        dashboardTitle: '文件上传',
        dashboardWindowTitle: '文件上传窗口（按 Escape 关闭）',
        dataUploadedOfTotal: '%{complete} / %{total}',
        done: '完成',
        dropHereOr: '拖放文件到这里，或 %{browse}',
        dropHint: '拖放文件到这里',
        dropPasteBoth: '拖放文件到这里，粘贴或 %{browse}',
        dropPasteFiles: '拖放文件到这里，粘贴或 %{browse}',
        dropPasteFolders: '拖放文件到这里，粘贴或 %{browse}',
        dropPasteImportBoth: '拖放文件到这里，粘贴，%{browse} 或导入',
        dropPasteImportFiles: '拖放文件到这里，粘贴，%{browse} 或导入',
        dropPasteImportFolders: '拖放文件到这里，粘贴，%{browse} 或导入',
        editFile: '编辑文件',
        editing: '正在编辑 %{file}',
        emptyFolderAdded: '无法添加空文件夹',
        encoding: '编码中...',
        enterCorrectUrl: '错误的 URL：请确保您输入的是文件的直接链接',
        enterUrlToImport: '输入 URL 以导入文件',
        exceedsSize: '此文件超过了最大允许大小',
        failedToFetch: '无法获取此 URL，请确保它是正确的',
        failedToUpload: '上传 %{file} 失败',
        fileSource: '文件来源：%{name}',
        filesUploadedOfTotal: {
          '0': '%{complete} / %{smart_count} 个文件已上传',
          '1': '%{complete} / %{smart_count} 个文件已上传',
          '2': '%{complete} / %{smart_count} 个文件已上传'
        },
        filter: '筛选',
        finishEditingFile: '完成编辑文件',
        folderAdded: {
          '0': '已从 %{folder} 添加 %{smart_count} 个文件',
          '1': '已从 %{folder} 添加 %{smart_count} 个文件',
          '2': '已从 %{folder} 添加 %{smart_count} 个文件'
        },
        import: '导入',
        importFrom: '从 %{name} 导入',
        loading: '加载中...',
        logOut: '退出',
        myDevice: '我的设备',
        noFilesFound: '您没有任何文件或文件夹',
        noInternetConnection: '无互联网连接',
        pause: '暂停',
        pauseUpload: '暂停上传',
        paused: '已暂停',
        poweredBy: '技术支持',
        processingXFiles: {
          '0': '正在处理 %{smart_count} 个文件',
          '1': '正在处理 %{smart_count} 个文件',
          '2': '正在处理 %{smart_count} 个文件'
        },
        removeFile: '删除文件',
        resetFilter: '重置筛选',
        resume: '恢复',
        resumeUpload: '恢复上传',
        retry: '重试',
        retryUpload: '重试上传',
        saveChanges: '保存更改',
        selectX: {
          '0': '选择 %{smart_count}',
          '1': '选择 %{smart_count}',
          '2': '选择 %{smart_count}'
        },
        smile: '微笑！',
        startRecording: '开始录制视频',
        stopRecording: '停止录制视频',
        takePicture: '拍照',
        timedOut: '上传停滞了 %{seconds} 秒，正在中止',
        upload: '上传',
        uploadComplete: '上传完成',
        uploadFailed: '上传失败',
        uploadPaused: '上传已暂停',
        uploadXFiles: {
          '0': '上传 %{smart_count} 个文件',
          '1': '上传 %{smart_count} 个文件',
          '2': '上传 %{smart_count} 个文件'
        },
        uploadXNewFiles: {
          '0': '上传 +%{smart_count} 个文件',
          '1': '上传 +%{smart_count} 个文件',
          '2': '上传 +%{smart_count} 个文件'
        },
        uploading: '上传中',
        uploadingXFiles: {
          '0': '正在上传 %{smart_count} 个文件',
          '1': '正在上传 %{smart_count} 个文件',
          '2': '正在上传 %{smart_count} 个文件'
        },
        xFilesSelected: {
          '0': '已选择 %{smart_count} 个文件',
          '1': '已选择 %{smart_count} 个文件',
          '2': '已选择 %{smart_count} 个文件'
        },
        xMoreFilesAdded: {
          '0': '已添加 %{smart_count} 个文件',
          '1': '已添加 %{smart_count} 个文件',
          '2': '已添加 %{smart_count} 个文件'
        },
        xTimeLeft: '剩余 %{time}',
        youCanOnlyUploadFileTypes: '您只能上传：%{types}',
        youCanOnlyUploadX: {
          '0': '您只能上传 %{smart_count} 个文件',
          '1': '您只能上传 %{smart_count} 个文件',
          '2': '您只能上传 %{smart_count} 个文件'
        },
        youHaveToAtLeastSelectX: {
          '0': '您至少需要选择 %{smart_count} 个文件',
          '1': '您至少需要选择 %{smart_count} 个文件',
          '2': '您至少需要选择 %{smart_count} 个文件'
        }
      }
    }
  })

  // 配置 XHR 上传（这里使用模拟端点）
  uppy.value.use(XHRUpload, {
    endpoint: '/api/upload', // 替换为实际的上传端点
    formData: true,
    fieldName: 'file',
    // 模拟上传
    getResponseError: (responseText: string) => {
      // 在实际项目中处理错误响应
      return new Error('上传失败')
    }
  })

  // 监听事件
  uppy.value.on('file-added', (file) => {
    console.log('文件已添加:', file)
    stats.value.totalFiles++
    stats.value.totalSize += file.size || 0
    ElMessage.success(`已添加文件: ${file.name}`)
  })

  uppy.value.on('file-removed', (file) => {
    console.log('文件已删除:', file)
    stats.value.totalFiles--
    stats.value.totalSize -= file.size || 0
  })

  uppy.value.on('upload', (data) => {
    console.log('开始上传:', data)
    ElMessage.info('开始上传文件...')
  })

  uppy.value.on('upload-success', (file, response) => {
    console.log('上传成功:', file, response)
    stats.value.uploadedFiles++
    stats.value.uploadedSize += file?.size || 0
    ElMessage.success(`${file?.name} 上传成功`)
  })

  uppy.value.on('upload-error', (file, error) => {
    console.error('上传失败:', file, error)
    ElMessage.error(`${file?.name} 上传失败: ${error.message}`)
  })

  uppy.value.on('complete', (result) => {
    console.log('上传完成:', result)
    ElMessage.success(`上传完成！成功: ${result.successful.length}, 失败: ${result.failed.length}`)
  })

  uppy.value.on('restriction-failed', (file, error) => {
    console.error('限制失败:', file, error)
    ElMessage.warning(error.message)
  })
})

// 清理
onBeforeUnmount(() => {
  if (uppy.value) {
    uppy.value.close()
  }
})

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<template>
  <div class="uppy-upload-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>📁 文件上传（Uppy.js）</h2>
        <el-tag type="info">{{ stats.totalFiles }} 个文件</el-tag>
        <el-tag type="success">{{ formatSize(stats.totalSize) }}</el-tag>
      </div>
      <div class="toolbar-right">
        <el-tag type="success">已上传: {{ stats.uploadedFiles }}</el-tag>
        <el-tag>{{ formatSize(stats.uploadedSize) }}</el-tag>
      </div>
    </div>

    <div class="content-area">
      <!-- 左侧：功能说明 -->
      <div class="info-panel">
        <el-card>
          <template #header>
            <h3>✨ Uppy.js 特性</h3>
          </template>
          
          <div class="features">
            <div class="feature-item">
              <h4>📤 多种上传方式</h4>
              <p>拖拽、点击、粘贴</p>
            </div>
            
            <div class="feature-item">
              <h4>📁 文件夹上传</h4>
              <p>支持选择整个文件夹</p>
            </div>
            
            <div class="feature-item">
              <h4>⏸️ 暂停/恢复</h4>
              <p>可暂停和恢复上传</p>
            </div>
            
            <div class="feature-item">
              <h4>🔄 断点续传</h4>
              <p>支持大文件续传</p>
            </div>
            
            <div class="feature-item">
              <h4>📊 实时进度</h4>
              <p>详细的上传进度显示</p>
            </div>
            
            <div class="feature-item">
              <h4>🖼️ 图片预览</h4>
              <p>上传前预览图片</p>
            </div>
            
            <div class="feature-item">
              <h4>✂️ 图片编辑</h4>
              <p>裁剪、旋转图片</p>
            </div>
            
            <div class="feature-item">
              <h4>🌐 多语言</h4>
              <p>支持中文界面</p>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>
            <h3>📊 统计信息</h3>
          </template>
          
          <div class="stats">
            <div class="stat-row">
              <span class="stat-label">总文件数:</span>
              <span class="stat-value">{{ stats.totalFiles }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">总大小:</span>
              <span class="stat-value">{{ formatSize(stats.totalSize) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">已上传:</span>
              <span class="stat-value success">{{ stats.uploadedFiles }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">已上传大小:</span>
              <span class="stat-value success">{{ formatSize(stats.uploadedSize) }}</span>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>
            <h3>💡 使用提示</h3>
          </template>
          
          <div class="tips">
            <p>• 拖拽文件到上传区域</p>
            <p>• 点击"浏览文件"选择文件</p>
            <p>• 支持粘贴图片（Ctrl+V）</p>
            <p>• 可以选择文件夹上传</p>
            <p>• 上传前可以预览和编辑</p>
            <p>• 支持暂停和恢复上传</p>
            <p>• 最大文件大小: 100MB</p>
            <p>• 最多上传: 50 个文件</p>
          </div>
        </el-card>
      </div>

      <!-- 右侧：Uppy Dashboard -->
      <div class="uppy-panel">
        <el-card>
          <Dashboard
            v-if="uppy"
            :uppy="uppy"
            :props="{
              proudlyDisplayPoweredByUppy: false,
              width: '100%',
              height: 600,
              theme: 'light',
              showProgressDetails: true,
              hideUploadButton: false,
              hideRetryButton: false,
              hidePauseResumeButton: false,
              hideCancelButton: false,
              showRemoveButtonAfterComplete: true,
              note: '支持拖拽、点击、粘贴上传文件',
              metaFields: [
                { id: 'name', name: '文件名', placeholder: '输入文件名' },
                { id: 'description', name: '描述', placeholder: '输入文件描述（可选）' }
              ]
            }"
          />
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.uppy-upload-container {
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

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.content-area {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.info-panel {
  width: 320px;
  overflow-y: auto;
  flex-shrink: 0;
}

.info-panel h3,
.info-panel h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.feature-item h4 {
  margin-bottom: 4px;
  color: #303133;
}

.feature-item p {
  margin: 0;
  font-size: 12px;
  color: #606266;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.stat-value.success {
  color: #67c23a;
}

.tips {
  font-size: 13px;
  line-height: 2;
  color: #606266;
}

.tips p {
  margin: 4px 0;
}

.uppy-panel {
  flex: 1;
  overflow: hidden;
}

/* Uppy Dashboard 样式覆盖 */
:deep(.uppy-Dashboard) {
  border-radius: 8px;
}

:deep(.uppy-Dashboard-inner) {
  background: #fff;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
}

:deep(.uppy-Dashboard-AddFiles) {
  border-radius: 8px;
}

:deep(.uppy-Dashboard-AddFiles-title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

:deep(.uppy-Dashboard-note) {
  font-size: 14px;
  color: #909399;
}
</style>
