<script setup lang="ts">
/**
 * 文件上传主组件
 * 职责：组合子组件，协调整体布局
 */

import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Delete } from '@element-plus/icons-vue'
import UploadArea from './components/UploadArea.vue'
import FileListView from './components/FileListView.vue'
import Statistics from './components/Statistics.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import { useFileList } from './composables/useFileList'
import { useFileUpload } from './composables/useFileUpload'
import type { FileItem, ViewMode, UploadConfig } from './types'
import { DEFAULT_UPLOAD_CONFIG } from './constants'

// 使用 composables
const {
  fileList,
  filterType,
  filteredFiles,
  statistics,
  addFile,
  removeFile,
  updateFile,
  clearAll
} = useFileList()

const { simulateUpload, validateFile, createFileItem } = useFileUpload()

// 视图模式
const viewMode = ref<ViewMode>('list')

// 上传配置
const uploadConfig = ref<UploadConfig>({ ...DEFAULT_UPLOAD_CONFIG })

// 处理文件添加
const handleFileAdded = (file: File) => {
  // 验证文件
  const validation = validateFile(
    file,
    uploadConfig.value.maxSize,
    fileList.value.length,
    uploadConfig.value.maxFiles
  )

  if (!validation.valid) {
    ElMessage.error(validation.message!)
    return
  }

  // 创建文件项
  const fileItem = createFileItem(file)
  addFile(fileItem)

  // 开始上传
  simulateUpload(fileItem, (updatedFile) => {
    updateFile(updatedFile.id, updatedFile)
  })
}

// 处理文件删除
const handleFileRemove = (id: string) => {
  ElMessageBox.confirm('确定要删除这个文件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    removeFile(id)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 用户取消
  })
}

// 处理文件下载
const handleFileDownload = (file: FileItem) => {
  if (file.url) {
    const a = document.createElement('a')
    a.href = file.url
    a.download = file.name
    a.click()
    ElMessage.success('开始下载')
  } else {
    ElMessage.warning('文件不可下载')
  }
}

// 处理文件预览
const handleFilePreview = (file: FileItem) => {
  if (file.url && file.type.startsWith('image/')) {
    window.open(file.url, '_blank')
  } else if (file.url && file.type === 'application/pdf') {
    window.open(file.url, '_blank')
  } else {
    ElMessage.info('该文件类型不支持预览')
  }
}

// 批量下载
const handleBatchDownload = () => {
  const successFiles = fileList.value.filter(f => f.status === 'success' && f.url)

  if (successFiles.length === 0) {
    ElMessage.warning('没有可下载的文件')
    return
  }

  successFiles.forEach((file, index) => {
    setTimeout(() => {
      handleFileDownload(file)
    }, index * 200)
  })

  ElMessage.success(`开始下载 ${successFiles.length} 个文件`)
}

// 清空所有文件
const handleClearAll = () => {
  ElMessageBox.confirm('确定要清空所有文件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    clearAll()
    ElMessage.success('已清空所有文件')
  }).catch(() => {
    // 用户取消
  })
}
</script>

<template>
  <div class="file-upload-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>📁 文件上传管理</h2>
        <el-tag type="info">{{ statistics.total }} 个文件</el-tag>
        <el-tag type="success">{{ statistics.totalSize }}</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-button
            :type="viewMode === 'list' ? 'primary' : ''"
            @click="viewMode = 'list'"
          >
            列表视图
          </el-button>
          <el-button
            :type="viewMode === 'grid' ? 'primary' : ''"
            @click="viewMode = 'grid'"
          >
            网格视图
          </el-button>
        </el-button-group>

        <el-button @click="handleBatchDownload" :disabled="statistics.success === 0">
          <el-icon><Download /></el-icon>
          批量下载
        </el-button>

        <el-button type="danger" plain @click="handleClearAll" :disabled="fileList.length === 0">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>

    <div class="content-area">
      <!-- 左侧：上传区域和配置 -->
      <div class="left-panel">
        <!-- 上传区域 -->
        <UploadArea
          :config="uploadConfig"
          @fileAdded="handleFileAdded"
        />

        <!-- 配置面板 -->
        <ConfigPanel v-model="uploadConfig" />

        <!-- 统计信息 -->
        <Statistics :statistics="statistics" />
      </div>

      <!-- 右侧：文件列表 -->
      <div class="right-panel">
        <FileListView
          :files="filteredFiles"
          :viewMode="viewMode"
          v-model:filterType="filterType"
          @fileRemove="handleFileRemove"
          @fileDownload="handleFileDownload"
          @filePreview="handleFilePreview"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-upload-container {
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
  gap: 12px;
  align-items: center;
}

.content-area {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.left-panel {
  width: 350px;
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-panel {
  flex: 1;
  overflow: hidden;
}
</style>
