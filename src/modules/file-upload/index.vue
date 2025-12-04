<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Upload, 
  Folder, 
  Document, 
  Delete, 
  Download, 
  View,
  Picture,
  VideoCamera,
  Headset,
  Files
} from '@element-plus/icons-vue'
import type { UploadProps, UploadUserFile, UploadFile } from 'element-plus'

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  path: string
  uploadTime: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  url?: string
  file?: File
}

// 文件列表
const fileList = ref<FileItem[]>([])
const uploadRef = ref()

// 上传配置
const uploadConfig = ref({
  maxSize: 100, // MB
  maxFiles: 50,
  autoUpload: true,
  multiple: true,
  acceptTypes: '*'
})

// 当前视图模式
const viewMode = ref<'list' | 'grid'>('list')

// 筛选条件
const filterType = ref<'all' | 'image' | 'video' | 'audio' | 'document' | 'other'>('all')

// 统计信息
const statistics = computed(() => {
  const total = fileList.value.length
  const totalSize = fileList.value.reduce((sum, file) => sum + file.size, 0)
  const success = fileList.value.filter(f => f.status === 'success').length
  const uploading = fileList.value.filter(f => f.status === 'uploading').length
  const error = fileList.value.filter(f => f.status === 'error').length
  
  return {
    total,
    totalSize: formatFileSize(totalSize),
    success,
    uploading,
    error,
    types: {
      image: fileList.value.filter(f => f.type.startsWith('image/')).length,
      video: fileList.value.filter(f => f.type.startsWith('video/')).length,
      audio: fileList.value.filter(f => f.type.startsWith('audio/')).length,
      document: fileList.value.filter(f => isDocument(f.type)).length,
      other: fileList.value.filter(f => !f.type.startsWith('image/') && 
                                         !f.type.startsWith('video/') && 
                                         !f.type.startsWith('audio/') && 
                                         !isDocument(f.type)).length
    }
  }
})

// 过滤后的文件列表
const filteredFiles = computed(() => {
  if (filterType.value === 'all') return fileList.value
  
  return fileList.value.filter(file => {
    switch (filterType.value) {
      case 'image':
        return file.type.startsWith('image/')
      case 'video':
        return file.type.startsWith('video/')
      case 'audio':
        return file.type.startsWith('audio/')
      case 'document':
        return isDocument(file.type)
      case 'other':
        return !file.type.startsWith('image/') && 
               !file.type.startsWith('video/') && 
               !file.type.startsWith('audio/') && 
               !isDocument(file.type)
      default:
        return true
    }
  })
})

// 判断是否为文档类型
const isDocument = (type: string) => {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
  return docTypes.includes(type)
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 获取文件图标
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Picture
  if (type.startsWith('video/')) return VideoCamera
  if (type.startsWith('audio/')) return Headset
  if (isDocument(type)) return Document
  return Files
}

// 获取文件类型颜色
const getFileTypeColor = (type: string) => {
  if (type.startsWith('image/')) return '#67C23A'
  if (type.startsWith('video/')) return '#E6A23C'
  if (type.startsWith('audio/')) return '#409EFF'
  if (isDocument(type)) return '#F56C6C'
  return '#909399'
}

// 上传前检查
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const maxSize = uploadConfig.value.maxSize * 1024 * 1024
  
  if (rawFile.size > maxSize) {
    ElMessage.error(`文件大小不能超过 ${uploadConfig.value.maxSize}MB`)
    return false
  }
  
  if (fileList.value.length >= uploadConfig.value.maxFiles) {
    ElMessage.error(`最多只能上传 ${uploadConfig.value.maxFiles} 个文件`)
    return false
  }
  
  return true
}

// 文件改变时
const handleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  if (uploadFile.raw) {
    const fileItem: FileItem = {
      id: uploadFile.uid.toString(),
      name: uploadFile.name,
      size: uploadFile.size || 0,
      type: uploadFile.raw.type,
      path: uploadFile.name,
      uploadTime: new Date().toISOString(),
      status: 'uploading',
      progress: 0,
      file: uploadFile.raw
    }
    
    // 模拟上传进度
    simulateUpload(fileItem)
  }
}

// 模拟文件上传
const simulateUpload = (fileItem: FileItem) => {
  fileList.value.push(fileItem)
  
  const interval = setInterval(() => {
    const file = fileList.value.find(f => f.id === fileItem.id)
    if (!file) {
      clearInterval(interval)
      return
    }
    
    file.progress += Math.random() * 30
    
    if (file.progress >= 100) {
      file.progress = 100
      file.status = 'success'
      
      // 创建预览 URL
      if (file.file) {
        file.url = URL.createObjectURL(file.file)
      }
      
      clearInterval(interval)
      ElMessage.success(`${file.name} 上传成功`)
    }
  }, 500)
}

// 选择文件夹
const selectFolder = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.webkitdirectory = true
  input.multiple = true
  
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = target.files
    
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (beforeUpload(file as any)) {
          const fileItem: FileItem = {
            id: Date.now().toString() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            path: (file as any).webkitRelativePath || file.name,
            uploadTime: new Date().toISOString(),
            status: 'uploading',
            progress: 0,
            file: file
          }
          
          simulateUpload(fileItem)
        }
      })
      
      ElMessage.success(`已选择 ${files.length} 个文件`)
    }
  }
  
  input.click()
}

// 删除文件
const deleteFile = (id: string) => {
  ElMessageBox.confirm('确定要删除这个文件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = fileList.value.findIndex(f => f.id === id)
    if (index > -1) {
      // 释放 URL
      if (fileList.value[index].url) {
        URL.revokeObjectURL(fileList.value[index].url!)
      }
      fileList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 用户取消
  })
}

// 下载文件
const downloadFile = (file: FileItem) => {
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

// 预览文件
const previewFile = (file: FileItem) => {
  if (file.url && file.type.startsWith('image/')) {
    // 图片预览
    window.open(file.url, '_blank')
  } else if (file.url && file.type === 'application/pdf') {
    // PDF 预览
    window.open(file.url, '_blank')
  } else {
    ElMessage.info('该文件类型不支持预览')
  }
}

// 清空所有文件
const clearAll = () => {
  ElMessageBox.confirm('确定要清空所有文件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 释放所有 URL
    fileList.value.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    })
    fileList.value = []
    ElMessage.success('已清空所有文件')
  }).catch(() => {
    // 用户取消
  })
}

// 批量下载
const batchDownload = () => {
  const successFiles = fileList.value.filter(f => f.status === 'success' && f.url)
  
  if (successFiles.length === 0) {
    ElMessage.warning('没有可下载的文件')
    return
  }
  
  successFiles.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file)
    }, index * 200)
  })
  
  ElMessage.success(`开始下载 ${successFiles.length} 个文件`)
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
        
        <el-button @click="batchDownload" :disabled="statistics.success === 0">
          <el-icon><Download /></el-icon>
          批量下载
        </el-button>
        
        <el-button type="danger" plain @click="clearAll" :disabled="fileList.length === 0">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>

    <div class="content-area">
      <!-- 左侧：上传区域 -->
      <div class="upload-section">
        <el-card>
          <template #header>
            <h3>📤 上传文件</h3>
          </template>
          
          <!-- 拖拽上传区域 -->
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            :multiple="uploadConfig.multiple"
            :auto-upload="false"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-change="handleChange"
          >
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">
              <p>拖拽文件到此处，或点击上传</p>
              <p class="upload-hint">支持多文件上传</p>
            </div>
          </el-upload>
          
          <!-- 文件夹上传按钮 -->
          <el-button 
            type="primary" 
            class="folder-btn"
            @click="selectFolder"
          >
            <el-icon><Folder /></el-icon>
            选择文件夹
          </el-button>
          
          <!-- 上传配置 -->
          <el-divider />
          
          <div class="upload-config">
            <h4>上传设置</h4>
            
            <el-form label-width="100px" size="small">
              <el-form-item label="最大大小">
                <el-input-number 
                  v-model="uploadConfig.maxSize" 
                  :min="1" 
                  :max="1000"
                  style="width: 100%"
                />
                <span style="margin-left: 8px">MB</span>
              </el-form-item>
              
              <el-form-item label="最大数量">
                <el-input-number 
                  v-model="uploadConfig.maxFiles" 
                  :min="1" 
                  :max="1000"
                  style="width: 100%"
                />
              </el-form-item>
              
              <el-form-item label="多文件">
                <el-switch v-model="uploadConfig.multiple" />
              </el-form-item>
            </el-form>
          </div>
        </el-card>

        <!-- 统计信息 -->
        <el-card style="margin-top: 16px">
          <template #header>
            <h3>📊 统计信息</h3>
          </template>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">总文件数</div>
              <div class="stat-value">{{ statistics.total }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">上传成功</div>
              <div class="stat-value success">{{ statistics.success }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">上传中</div>
              <div class="stat-value uploading">{{ statistics.uploading }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">上传失败</div>
              <div class="stat-value error">{{ statistics.error }}</div>
            </div>
          </div>
          
          <el-divider />
          
          <div class="type-stats">
            <h4>文件类型分布</h4>
            <div class="type-item">
              <el-icon :color="getFileTypeColor('image/')"><Picture /></el-icon>
              <span>图片: {{ statistics.types.image }}</span>
            </div>
            <div class="type-item">
              <el-icon :color="getFileTypeColor('video/')"><VideoCamera /></el-icon>
              <span>视频: {{ statistics.types.video }}</span>
            </div>
            <div class="type-item">
              <el-icon :color="getFileTypeColor('audio/')"><Headset /></el-icon>
              <span>音频: {{ statistics.types.audio }}</span>
            </div>
            <div class="type-item">
              <el-icon :color="getFileTypeColor('application/pdf')"><Document /></el-icon>
              <span>文档: {{ statistics.types.document }}</span>
            </div>
            <div class="type-item">
              <el-icon :color="getFileTypeColor('other')"><Files /></el-icon>
              <span>其他: {{ statistics.types.other }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：文件列表 -->
      <div class="file-list-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>📋 文件列表</h3>
              
              <!-- 筛选器 -->
              <el-radio-group v-model="filterType" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="image">图片</el-radio-button>
                <el-radio-button label="video">视频</el-radio-button>
                <el-radio-button label="audio">音频</el-radio-button>
                <el-radio-button label="document">文档</el-radio-button>
                <el-radio-button label="other">其他</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <!-- 空状态 -->
          <el-empty v-if="filteredFiles.length === 0" description="暂无文件" />
          
          <!-- 列表视图 -->
          <div v-else-if="viewMode === 'list'" class="file-list">
            <div
              v-for="file in filteredFiles"
              :key="file.id"
              class="file-item"
            >
              <div class="file-info">
                <el-icon 
                  :size="32" 
                  :color="getFileTypeColor(file.type)"
                  class="file-icon"
                >
                  <component :is="getFileIcon(file.type)" />
                </el-icon>
                
                <div class="file-details">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-meta">
                    <span>{{ formatFileSize(file.size) }}</span>
                    <span>{{ file.path }}</span>
                    <span>{{ new Date(file.uploadTime).toLocaleString('zh-CN') }}</span>
                  </div>
                  
                  <!-- 上传进度 -->
                  <el-progress 
                    v-if="file.status === 'uploading'"
                    :percentage="file.progress"
                    :status="file.status === 'error' ? 'exception' : undefined"
                  />
                </div>
              </div>
              
              <div class="file-actions">
                <el-tag 
                  :type="file.status === 'success' ? 'success' : file.status === 'error' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ file.status === 'success' ? '成功' : file.status === 'error' ? '失败' : '上传中' }}
                </el-tag>
                
                <el-button-group v-if="file.status === 'success'">
                  <el-button size="small" @click="previewFile(file)">
                    <el-icon><View /></el-icon>
                  </el-button>
                  <el-button size="small" @click="downloadFile(file)">
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteFile(file.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>
          
          <!-- 网格视图 -->
          <div v-else class="file-grid">
            <div
              v-for="file in filteredFiles"
              :key="file.id"
              class="file-card"
            >
              <!-- 文件预览 -->
              <div class="file-preview">
                <img 
                  v-if="file.type.startsWith('image/') && file.url" 
                  :src="file.url" 
                  :alt="file.name"
                />
                <el-icon 
                  v-else
                  :size="48" 
                  :color="getFileTypeColor(file.type)"
                >
                  <component :is="getFileIcon(file.type)" />
                </el-icon>
                
                <!-- 状态标签 -->
                <el-tag 
                  class="status-tag"
                  :type="file.status === 'success' ? 'success' : file.status === 'error' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ file.status === 'success' ? '成功' : file.status === 'error' ? '失败' : '上传中' }}
                </el-tag>
              </div>
              
              <!-- 文件信息 -->
              <div class="file-card-info">
                <div class="file-card-name" :title="file.name">{{ file.name }}</div>
                <div class="file-card-size">{{ formatFileSize(file.size) }}</div>
                
                <!-- 上传进度 -->
                <el-progress 
                  v-if="file.status === 'uploading'"
                  :percentage="file.progress"
                  :show-text="false"
                />
              </div>
              
              <!-- 操作按钮 -->
              <div class="file-card-actions" v-if="file.status === 'success'">
                <el-button size="small" text @click="previewFile(file)">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button size="small" text @click="downloadFile(file)">
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button size="small" text type="danger" @click="deleteFile(file.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
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

.upload-section {
  width: 350px;
  overflow-y: auto;
  flex-shrink: 0;
}

.upload-section h3,
.upload-section h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.upload-area {
  margin-bottom: 16px;
}

:deep(.el-upload-dragger) {
  padding: 40px 20px;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
  color: #606266;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.folder-btn {
  width: 100%;
  margin-bottom: 16px;
}

.upload-config h4 {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.uploading {
  color: #e6a23c;
}

.stat-value.error {
  color: #f56c6c;
}

.type-stats h4 {
  margin-bottom: 12px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
}

.file-list-section {
  flex: 1;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.file-item:hover {
  background: #e6f7ff;
  transform: translateX(4px);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.file-meta span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.file-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.file-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.file-preview {
  position: relative;
  width: 100%;
  height: 150px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.file-card-info {
  padding: 12px;
}

.file-card-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-card-size {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.file-card-actions {
  display: flex;
  justify-content: space-around;
  padding: 8px 12px;
  border-top: 1px solid #e4e7ed;
}
</style>
