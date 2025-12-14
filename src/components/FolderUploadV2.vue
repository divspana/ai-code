<template>
  <div class="folder-upload-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件夹上传 V2 (使用 ChunkUploadManager)</span>
          <el-space>
            <el-button type="primary" @click="selectFolder" :icon="FolderOpened">
              选择文件夹
            </el-button>
            <el-button type="success" @click="selectFiles" :icon="Document">
              选择多个文件
            </el-button>
          </el-space>
        </div>
      </template>

      <!-- 使用提示 -->
      <el-alert
        v-if="fileList.length === 0"
        title="使用说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div style="line-height: 1.8">
            <p><strong>方式一：选择文件夹</strong></p>
            <p style="margin-left: 20px; color: #909399">
              • Windows系统：对话框只显示文件夹名称（浏览器限制）<br />
              • Mac/Linux系统：可以看到文件夹内容<br />
              • 适合：上传整个文件夹结构
            </p>
            <p style="margin-top: 10px"><strong>方式二：选择多个文件</strong></p>
            <p style="margin-left: 20px; color: #909399">
              • 可以清楚看到所有文件列表<br />
              • 支持 Ctrl/Cmd + A 全选<br />
              • 适合：明确知道要上传哪些文件
            </p>
          </div>
        </template>
      </el-alert>

      <!-- 文件列表 -->
      <el-table
        v-if="fileList.length > 0"
        :data="fileList"
        row-key="id"
        border
        style="width: 100%; margin-bottom: 20px"
      >
        <el-table-column prop="name" label="文件名" min-width="200">
          <template #default="{ row }">
            <el-icon style="margin-right: 5px">
              <Document />
            </el-icon>
            {{ row.name }}
          </template>
        </el-table-column>

        <el-table-column prop="size" label="大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>

        <el-table-column prop="path" label="路径" min-width="200" />

        <el-table-column label="上传进度" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="row.uploadProgress"
              :status="
                row.uploadStatus === 'success'
                  ? 'success'
                  : row.uploadStatus === 'exception'
                    ? 'exception'
                    : undefined
              "
            />
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.uploadStatus)">
              {{ getStatusText(row.uploadStatus) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 工具栏 -->
      <div v-if="fileList.length > 0" class="toolbar">
        <el-space>
          <el-button
            type="primary"
            @click="startUpload"
            :loading="isUploading"
            :disabled="isUploading || allFilesUploaded"
            :icon="Upload"
          >
            {{ isUploading ? '上传中...' : '开始上传' }}
          </el-button>

          <el-button @click="pauseUpload" :disabled="!isUploading" :icon="VideoPause">
            暂停上传
          </el-button>

          <el-button @click="clearFiles" :disabled="isUploading" :icon="Delete">
            清空列表
          </el-button>
        </el-space>

        <div class="upload-stats">
          <el-text>
            总文件数: {{ stats.totalFiles }} | 已上传: {{ stats.successFiles }} | 上传中:
            {{ stats.uploadingFiles }} | 失败: {{ stats.failedFiles }} | 活跃切片:
            {{ activeChunksCount }} | 队列切片: {{ queuedChunksCount }}
          </el-text>
        </div>
      </div>

      <!-- 隐藏的文件选择器 -->
      <input
        ref="folderInputRef"
        type="file"
        webkitdirectory
        directory
        multiple
        style="display: none"
        @change="handleFolderSelect"
      />

      <input
        ref="filesInputRef"
        type="file"
        multiple
        style="display: none"
        @change="handleFilesSelect"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderOpened, Document, Upload, VideoPause, Delete } from '@element-plus/icons-vue'
import { useChunkUpload, type FileNode } from '@/composables/useChunkUpload'

// 响应式数据
const folderInputRef = ref<HTMLInputElement>()
const filesInputRef = ref<HTMLInputElement>()
const fileList = ref<FileNode[]>([])

// 使用上传管理器
const uploader = useChunkUpload({
  chunkSize: 2 * 1024 * 1024, // 2MB
  maxConcurrent: 6,
  maxRetries: 3,
  uploadUrl: '/api/upload/chunk',
  mergeUrl: '/api/upload/merge'
})

// 解构状态
const { isUploading, activeChunksCount, queuedChunksCount } = uploader

// 计算属性
const stats = computed(() => uploader.getStatistics())

const allFilesUploaded = computed(() => {
  return fileList.value.length > 0 && fileList.value.every(f => f.uploadStatus === 'success')
})

// 选择文件夹
const selectFolder = () => {
  folderInputRef.value?.click()
}

// 选择多个文件
const selectFiles = () => {
  filesInputRef.value?.click()
}

// 处理文件夹选择
const handleFolderSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])

  if (files.length === 0) return

  fileList.value = files.map((file, index) => ({
    id: `${Date.now()}_${index}`,
    name: file.name,
    path: file.webkitRelativePath || file.name,
    size: file.size,
    file: file,
    uploadProgress: 0,
    uploadStatus: 'pending'
  }))

  ElMessage.success(`已选择 ${files.length} 个文件`)
  input.value = ''
}

// 处理多文件选择
const handleFilesSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])

  if (files.length === 0) return

  fileList.value = files.map((file, index) => ({
    id: `${Date.now()}_${index}`,
    name: file.name,
    path: file.name,
    size: file.size,
    file: file,
    uploadProgress: 0,
    uploadStatus: 'pending'
  }))

  ElMessage.success(`已选择 ${files.length} 个文件`)
  input.value = ''
}

// 开始上传
const startUpload = async () => {
  const pendingFiles = fileList.value.filter(
    f =>
      f.uploadStatus === 'pending' || f.uploadStatus === 'exception' || f.uploadStatus === 'paused'
  )

  if (pendingFiles.length === 0) {
    ElMessage.warning('没有需要上传的文件')
    return
  }

  try {
    await uploader.upload(pendingFiles)

    const finalStats = uploader.getStatistics()
    if (finalStats.failedFiles === 0) {
      ElMessage.success('所有文件上传完成！')
    } else {
      ElMessage.warning(`上传完成，${finalStats.failedFiles} 个文件失败`)
    }
  } catch (error) {
    console.error('Upload error:', error)
    ElMessage.error('上传过程中出现错误')
  }
}

// 暂停上传
const pauseUpload = () => {
  uploader.pause()
  ElMessage.info('上传已暂停')
}

// 清空文件列表
const clearFiles = () => {
  uploader.clear()
  fileList.value = []
  ElMessage.success('已清空文件列表')
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    uploading: 'warning',
    success: 'success',
    exception: 'danger',
    paused: 'info'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待上传',
    uploading: '上传中',
    success: '已完成',
    exception: '失败',
    paused: '已暂停'
  }
  return textMap[status] || '未知'
}
</script>

<style scoped lang="scss">
.folder-upload-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid var(--el-border-color);
    margin-top: 10px;
    padding-top: 20px;

    .upload-stats {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }
}
</style>
