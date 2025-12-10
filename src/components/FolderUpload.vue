<template>
  <div class="folder-upload-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件夹上传</span>
          <el-button type="primary" @click="selectFolder" :icon="FolderOpened">
            选择文件夹
          </el-button>
        </div>
      </template>

      <!-- 文件树形表格 -->
      <el-table
        v-if="fileList.length > 0"
        :data="fileList"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        style="width: 100%; margin-bottom: 20px"
      >
        <el-table-column prop="name" label="文件名" width="300">
          <template #default="{ row }">
            <el-icon v-if="row.isDirectory" style="margin-right: 5px">
              <Folder />
            </el-icon>
            <el-icon v-else style="margin-right: 5px">
              <Document />
            </el-icon>
            {{ row.name }}
          </template>
        </el-table-column>

        <el-table-column prop="size" label="大小" width="120">
          <template #default="{ row }">
            {{ row.isDirectory ? '-' : formatFileSize(row.size) }}
          </template>
        </el-table-column>

        <el-table-column prop="path" label="路径" min-width="200" />

        <el-table-column label="上传进度" width="200">
          <template #default="{ row }">
            <el-progress
              v-if="!row.isDirectory && row.uploadProgress !== undefined"
              :percentage="row.uploadProgress"
              :status="row.uploadStatus"
            />
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="!row.isDirectory" :type="getStatusType(row.uploadStatus)">
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
            总文件数: {{ totalFiles }} | 已上传: {{ uploadedFiles }} | 上传中:
            {{ uploadingFiles }} | 失败: {{ failedFiles }}
          </el-text>
        </div>
      </div>

      <!-- 隐藏的文件夹选择器 -->
      <input
        ref="folderInputRef"
        type="file"
        webkitdirectory
        directory
        multiple
        style="display: none"
        @change="handleFolderSelect"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderOpened, Folder, Document, Upload, VideoPause, Delete } from '@element-plus/icons-vue'
import { uploadFileWithChunks, type UploadOptions } from '@/utils/uploadService'

interface FileNode {
  id: string
  name: string
  path: string
  size: number
  isDirectory: boolean
  file?: File
  children?: FileNode[]
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'exception' | 'paused'
  hasChildren?: boolean
}

// 配置
const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk
const MAX_CONCURRENT = 6 // 最大并发数

// 响应式数据
const folderInputRef = ref<HTMLInputElement>()
const fileList = ref<FileNode[]>([])
const isUploading = ref(false)
const uploadQueue = ref<FileNode[]>([])
const activeUploads = ref<Set<string>>(new Set())
const uploadControllers = ref<Map<string, AbortController>>(new Map())

// 计算属性
const totalFiles = computed(() => {
  const countFiles = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.isDirectory) {
        return count + (node.children ? countFiles(node.children) : 0)
      }
      return count + 1
    }, 0)
  }
  return countFiles(fileList.value)
})

const uploadedFiles = computed(() => {
  const countUploaded = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.isDirectory) {
        return count + (node.children ? countUploaded(node.children) : 0)
      }
      return count + (node.uploadStatus === 'success' ? 1 : 0)
    }, 0)
  }
  return countUploaded(fileList.value)
})

const uploadingFiles = computed(() => activeUploads.value.size)

const failedFiles = computed(() => {
  const countFailed = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.isDirectory) {
        return count + (node.children ? countFailed(node.children) : 0)
      }
      return count + (node.uploadStatus === 'exception' ? 1 : 0)
    }, 0)
  }
  return countFailed(fileList.value)
})

const allFilesUploaded = computed(() => {
  return totalFiles.value > 0 && uploadedFiles.value === totalFiles.value
})

// 选择文件夹
const selectFolder = () => {
  folderInputRef.value?.click()
}

// 处理文件夹选择
const handleFolderSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])

  if (files.length === 0) {
    return
  }

  // 构建文件树
  const tree = buildFileTree(files)
  fileList.value = tree

  ElMessage.success(`已选择 ${totalFiles.value} 个文件`)

  // 重置input
  input.value = ''
}

// 构建文件树结构
const buildFileTree = (files: File[]): FileNode[] => {
  const tree: FileNode[] = []
  const pathMap = new Map<string, FileNode>()

  files.forEach(file => {
    const pathParts = file.webkitRelativePath.split('/')
    let currentPath = ''

    pathParts.forEach((part, index) => {
      const parentPath = currentPath
      currentPath = currentPath ? `${currentPath}/${part}` : part

      if (!pathMap.has(currentPath)) {
        const isDirectory = index < pathParts.length - 1
        const node: FileNode = {
          id: generateId(),
          name: part,
          path: currentPath,
          size: isDirectory ? 0 : file.size,
          isDirectory,
          file: isDirectory ? undefined : file,
          children: isDirectory ? [] : undefined,
          uploadProgress: isDirectory ? undefined : 0,
          uploadStatus: isDirectory ? undefined : 'pending',
          hasChildren: isDirectory
        }

        pathMap.set(currentPath, node)

        if (parentPath) {
          const parent = pathMap.get(parentPath)
          parent?.children?.push(node)
        } else {
          tree.push(node)
        }
      }
    })
  })

  return tree
}

// 生成唯一ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
const getStatusType = (status?: string) => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    uploading: 'warning',
    success: 'success',
    exception: 'danger',
    paused: 'info'
  }
  return typeMap[status || 'pending']
}

// 获取状态文本
const getStatusText = (status?: string) => {
  const textMap: Record<string, string> = {
    pending: '待上传',
    uploading: '上传中',
    success: '已完成',
    exception: '失败',
    paused: '已暂停'
  }
  return textMap[status || 'pending']
}

// 收集所有文件节点
const collectFileNodes = (nodes: FileNode[]): FileNode[] => {
  const files: FileNode[] = []

  const traverse = (nodeList: FileNode[]) => {
    nodeList.forEach(node => {
      if (!node.isDirectory) {
        files.push(node)
      } else if (node.children) {
        traverse(node.children)
      }
    })
  }

  traverse(nodes)
  return files
}

// 开始上传
const startUpload = async () => {
  const allFiles = collectFileNodes(fileList.value)
  const pendingFiles = allFiles.filter(
    f =>
      f.uploadStatus === 'pending' || f.uploadStatus === 'exception' || f.uploadStatus === 'paused'
  )

  if (pendingFiles.length === 0) {
    ElMessage.warning('没有需要上传的文件')
    return
  }

  isUploading.value = true
  uploadQueue.value = [...pendingFiles]

  // 启动并发上传
  const uploadPromises: Promise<void>[] = []
  for (let i = 0; i < Math.min(MAX_CONCURRENT, uploadQueue.value.length); i++) {
    uploadPromises.push(processUploadQueue())
  }

  await Promise.all(uploadPromises)

  isUploading.value = false

  if (failedFiles.value === 0) {
    ElMessage.success('所有文件上传完成！')
  } else {
    ElMessage.warning(`上传完成，${failedFiles.value} 个文件失败`)
  }
}

// 处理上传队列
const processUploadQueue = async (): Promise<void> => {
  while (uploadQueue.value.length > 0 && isUploading.value) {
    const fileNode = uploadQueue.value.shift()
    if (!fileNode || !fileNode.file) continue

    activeUploads.value.add(fileNode.id)

    try {
      await uploadFile(fileNode)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      activeUploads.value.delete(fileNode.id)
      uploadControllers.value.delete(fileNode.id)
    }
  }
}

// 上传单个文件
const uploadFile = async (fileNode: FileNode): Promise<void> => {
  if (!fileNode.file) return

  const controller = new AbortController()
  uploadControllers.value.set(fileNode.id, controller)

  fileNode.uploadStatus = 'uploading'

  const options: UploadOptions = {
    file: fileNode.file,
    chunkSize: CHUNK_SIZE,
    onProgress: progress => {
      fileNode.uploadProgress = Math.round(progress * 100)
    },
    signal: controller.signal,
    metadata: {
      relativePath: fileNode.path
    }
  }

  try {
    await uploadFileWithChunks(options)
    fileNode.uploadStatus = 'success'
    fileNode.uploadProgress = 100
  } catch (error: unknown) {
    const err = error as Error
    if (err.name === 'AbortError' || err.message === 'Upload paused') {
      fileNode.uploadStatus = 'paused'
    } else {
      fileNode.uploadStatus = 'exception'
      console.error(`Upload failed for ${fileNode.name}:`, error)
    }
  }
}

// 暂停上传
const pauseUpload = () => {
  isUploading.value = false

  // 取消所有正在上传的文件
  uploadControllers.value.forEach(controller => {
    controller.abort()
  })

  uploadControllers.value.clear()
  activeUploads.value.clear()
  uploadQueue.value = []

  ElMessage.info('上传已暂停')
}

// 清空文件列表
const clearFiles = () => {
  fileList.value = []
  uploadQueue.value = []
  activeUploads.value.clear()
  uploadControllers.value.clear()
  ElMessage.success('已清空文件列表')
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
