<template>
  <div class="folder-upload-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件夹上传</span>
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

      <!-- 隐藏的多文件选择器 -->
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
import { FolderOpened, Folder, Document, Upload, VideoPause, Delete } from '@element-plus/icons-vue'
// 不再需要导入 uploadService，已在组件内实现切片上传逻辑

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

interface ChunkTask {
  fileNodeId: string
  chunkIndex: number
  totalChunks: number
  chunk: Blob
  hash: string
  fileName: string
  fileSize: number
  retryCount: number
}

interface FileUploadState {
  fileNode: FileNode
  totalChunks: number
  uploadedChunks: Set<number>
  failedChunks: Set<number>
  hash: string
}

// 配置
const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk
const MAX_CONCURRENT = 6 // 最大并发数

// 响应式数据
const folderInputRef = ref<HTMLInputElement>()
const filesInputRef = ref<HTMLInputElement>()
const fileList = ref<FileNode[]>([])
const isUploading = ref(false)
const chunkQueue = ref<ChunkTask[]>([])
const activeChunks = ref<Set<string>>(new Set())
const fileUploadStates = ref<Map<string, FileUploadState>>(new Map())
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

const uploadingFiles = computed(() => {
  let count = 0
  fileUploadStates.value.forEach(state => {
    if (state.fileNode.uploadStatus === 'uploading') {
      count++
    }
  })
  return count
})

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

// 选择多个文件
const selectFiles = () => {
  filesInputRef.value?.click()
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

// 处理多文件选择
const handleFilesSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])

  if (files.length === 0) {
    return
  }

  // 为普通文件选择构建扁平的文件树（不保留文件夹结构）
  const tree = buildFlatFileTree(files)
  fileList.value = tree

  ElMessage.success(`已选择 ${files.length} 个文件`)

  // 重置input
  input.value = ''
}

// 构建扁平文件树（用于多文件选择）
const buildFlatFileTree = (files: File[]): FileNode[] => {
  return files.map(file => ({
    id: generateId(),
    name: file.name,
    path: file.name,
    size: file.size,
    isDirectory: false,
    file: file,
    uploadProgress: 0,
    uploadStatus: 'pending'
  }))
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

// 计算文件哈希值（简化版）
const calculateFileHash = async (file: File): Promise<string> => {
  const str = `${file.name}-${file.size}-${file.lastModified}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// 创建文件分片
const createFileChunks = (file: File, chunkSize: number): Blob[] => {
  const chunks: Blob[] = []
  let start = 0

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size)
    chunks.push(file.slice(start, end))
    start = end
  }

  return chunks
}

// 准备文件的切片任务
const prepareFileTasks = async (fileNode: FileNode): Promise<ChunkTask[]> => {
  if (!fileNode.file) return []

  const hash = await calculateFileHash(fileNode.file)
  const chunks = createFileChunks(fileNode.file, CHUNK_SIZE)
  const totalChunks = chunks.length

  // 初始化文件上传状态
  fileUploadStates.value.set(fileNode.id, {
    fileNode,
    totalChunks,
    uploadedChunks: new Set(),
    failedChunks: new Set(),
    hash
  })

  // 创建切片任务
  return chunks.map((chunk, index) => ({
    fileNodeId: fileNode.id,
    chunkIndex: index,
    totalChunks,
    chunk,
    hash,
    fileName: fileNode.file!.name,
    fileSize: fileNode.file!.size,
    retryCount: 0
  }))
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
  fileUploadStates.value.clear()
  chunkQueue.value = []

  // 准备所有文件的切片任务
  for (const fileNode of pendingFiles) {
    const tasks = await prepareFileTasks(fileNode)
    chunkQueue.value.push(...tasks)
    fileNode.uploadStatus = 'uploading'
    fileNode.uploadProgress = 0
  }

  // 启动并发上传（以切片为单位）
  const uploadPromises: Promise<void>[] = []
  for (let i = 0; i < Math.min(MAX_CONCURRENT, chunkQueue.value.length); i++) {
    uploadPromises.push(processChunkQueue())
  }

  await Promise.all(uploadPromises)

  isUploading.value = false

  if (failedFiles.value === 0) {
    ElMessage.success('所有文件上传完成！')
  } else {
    ElMessage.warning(`上传完成，${failedFiles.value} 个文件失败`)
  }
}

// 处理切片队列
const processChunkQueue = async (): Promise<void> => {
  while (chunkQueue.value.length > 0 && isUploading.value) {
    const chunkTask = chunkQueue.value.shift()
    if (!chunkTask) continue

    const chunkKey = `${chunkTask.fileNodeId}-${chunkTask.chunkIndex}`
    activeChunks.value.add(chunkKey)

    try {
      await uploadChunk(chunkTask)
    } catch (error) {
      console.error('Chunk upload error:', error)
      // 失败处理在 uploadChunk 中完成
    } finally {
      activeChunks.value.delete(chunkKey)
    }
  }
}

// 上传单个切片
const uploadChunk = async (chunkTask: ChunkTask): Promise<void> => {
  const state = fileUploadStates.value.get(chunkTask.fileNodeId)
  if (!state) return

  const formData = new FormData()
  formData.append('chunk', chunkTask.chunk)
  formData.append('index', chunkTask.chunkIndex.toString())
  formData.append('total', chunkTask.totalChunks.toString())
  formData.append('hash', chunkTask.hash)
  formData.append('fileName', chunkTask.fileName)
  formData.append('fileSize', chunkTask.fileSize.toString())
  formData.append('relativePath', state.fileNode.path)

  const controller = new AbortController()
  const controllerKey = `${chunkTask.fileNodeId}-${chunkTask.chunkIndex}`
  uploadControllers.value.set(controllerKey, controller)

  try {
    // 模拟上传 - 实际项目中替换为真实的 API 调用
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          // 模拟 10% 的失败率用于测试重试
          if (Math.random() < 0.1) {
            reject(new Error('Network error'))
          } else {
            resolve(true)
          }
        },
        100 + Math.random() * 200
      )

      controller.signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        reject(new Error('Upload paused'))
      })
    })

    // 切片上传成功
    state.uploadedChunks.add(chunkTask.chunkIndex)
    state.failedChunks.delete(chunkTask.chunkIndex)
    updateFileProgress(state)

    // 检查文件是否全部上传完成
    if (state.uploadedChunks.size === state.totalChunks) {
      await mergeFileChunks(state)
    }
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Upload paused') {
      state.fileNode.uploadStatus = 'paused'
      throw error
    }

    // 切片上传失败，进行重试
    chunkTask.retryCount++
    if (chunkTask.retryCount < 3) {
      // 重新加入队列重试
      console.log(
        `Chunk ${chunkTask.chunkIndex} of ${chunkTask.fileName} failed, retry ${chunkTask.retryCount}/3`
      )
      chunkQueue.value.push(chunkTask)
    } else {
      // 重试3次后仍失败，标记文件失败
      console.error(`Chunk ${chunkTask.chunkIndex} of ${chunkTask.fileName} failed after 3 retries`)
      state.failedChunks.add(chunkTask.chunkIndex)
      state.fileNode.uploadStatus = 'exception'
      throw error
    }
  } finally {
    uploadControllers.value.delete(controllerKey)
  }
}

// 更新文件上传进度
const updateFileProgress = (state: FileUploadState) => {
  const progress = (state.uploadedChunks.size / state.totalChunks) * 100
  state.fileNode.uploadProgress = Math.round(progress)
}

// 合并文件切片
const mergeFileChunks = async (state: FileUploadState): Promise<void> => {
  try {
    // 模拟合并请求 - 实际项目中替换为真实的 API 调用
    await new Promise(resolve => setTimeout(resolve, 100))

    state.fileNode.uploadStatus = 'success'
    state.fileNode.uploadProgress = 100
    console.log(`File ${state.fileNode.name} uploaded successfully`)
  } catch (error) {
    state.fileNode.uploadStatus = 'exception'
    console.error(`Failed to merge chunks for ${state.fileNode.name}:`, error)
    throw error
  }
}

// 暂停上传
const pauseUpload = () => {
  isUploading.value = false

  // 取消所有正在上传的切片
  uploadControllers.value.forEach(controller => {
    controller.abort()
  })

  uploadControllers.value.clear()
  activeChunks.value.clear()
  chunkQueue.value = []

  // 更新文件状态为暂停
  fileUploadStates.value.forEach(state => {
    if (state.fileNode.uploadStatus === 'uploading') {
      state.fileNode.uploadStatus = 'paused'
    }
  })

  ElMessage.info('上传已暂停')
}

// 清空文件列表
const clearFiles = () => {
  fileList.value = []
  chunkQueue.value = []
  activeChunks.value.clear()
  uploadControllers.value.clear()
  fileUploadStates.value.clear()
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
