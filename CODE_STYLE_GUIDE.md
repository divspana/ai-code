# 代码规范指南

## 📋 命名规范

### 1. 文件和文件夹命名

#### 文件夹

- **小驼峰命名** (camelCase)
- 模块文件夹：`fileUpload`, `formEngine`, `waferMap`
- 组件文件夹：`components`, `composables`, `utils`

#### Vue 组件文件

- **大驼峰命名** (PascalCase)
- 单文件组件：`FileUpload.vue`, `FormEngine.vue`
- 组件子文件：`FileList.vue`, `UploadArea.vue`

#### TypeScript/JavaScript 文件

- **小驼峰命名** (camelCase)
- 工具函数：`formatFileSize.ts`, `validateFile.ts`
- 类型定义：`types.ts`, `interfaces.ts`
- 组合式函数：`useUpload.ts`, `useFileList.ts`

### 2. 代码命名

#### 变量和函数

- **小驼峰命名** (camelCase)

```typescript
// ✅ 正确
const fileList = ref([])
const uploadFile = () => {}
const isUploading = ref(false)

// ❌ 错误
const file_list = ref([])
const upload-file = () => {}
const is-uploading = ref(false)
```

#### 常量

- **大写下划线** (UPPER_SNAKE_CASE)

```typescript
// ✅ 正确
const MAX_FILE_SIZE = 100 * 1024 * 1024
const API_ENDPOINT = '/api/upload'

// ❌ 错误
const maxFileSize = 100 * 1024 * 1024
const apiEndpoint = '/api/upload'
```

#### 类和接口

- **大驼峰命名** (PascalCase)

```typescript
// ✅ 正确
interface FileItem {
  id: string
  name: string
}

class FileUploader {
  upload() {}
}

// ❌ 错误
interface file_item {
  id: string
}

class fileUploader {
  upload() {}
}
```

#### 组件名

- **大驼峰命名** (PascalCase)

```vue
// ✅ 正确
<FileUpload />
<UploadArea />
<FileList />

// ❌ 错误
<file-upload />
<upload-area />
<file-list />
```

### 3. Props 和 Events

#### Props

- **小驼峰命名** (camelCase)

```typescript
// ✅ 正确
defineProps<{
  fileList: FileItem[]
  maxSize: number
  isUploading: boolean
}>()

// ❌ 错误
defineProps<{
  file_list: FileItem[]
  max_size: number
  is_uploading: boolean
}>()
```

#### Events

- **小驼峰命名** (camelCase)

```typescript
// ✅ 正确
const emit = defineEmits<{
  fileAdded: [file: File]
  uploadComplete: [result: UploadResult]
  uploadError: [error: Error]
}>()

// ❌ 错误
const emit = defineEmits<{
  'file-added': [file: File]
  'upload-complete': [result: UploadResult]
}>()
```

## 🏗️ 组件设计原则

### 1. 单一职责原则

每个组件只负责一个功能

```
❌ 不好的设计
FileUpload.vue (1000+ 行)
  - 上传逻辑
  - 文件列表
  - 统计信息
  - 配置面板

✅ 好的设计
FileUpload.vue (主容器)
  ├── UploadArea.vue (上传区域)
  ├── FileList.vue (文件列表)
  ├── Statistics.vue (统计信息)
  └── ConfigPanel.vue (配置面板)
```

### 2. 组件拆分原则

#### 何时拆分组件？

1. **功能独立** - 可以独立使用
2. **代码量大** - 超过 200 行
3. **可复用** - 多处使用
4. **逻辑复杂** - 有独立的状态管理

#### 拆分示例

```
// 拆分前
FileUpload.vue (800 行)

// 拆分后
FileUpload.vue (100 行 - 组合子组件)
├── components/
│   ├── UploadArea.vue (150 行)
│   ├── FileList.vue (200 行)
│   ├── FileItem.vue (100 行)
│   ├── Statistics.vue (100 行)
│   └── ConfigPanel.vue (150 行)
├── composables/
│   ├── useFileUpload.ts (文件上传逻辑)
│   ├── useFileList.ts (文件列表管理)
│   └── useStatistics.ts (统计计算)
└── utils/
    ├── formatFileSize.ts (格式化文件大小)
    ├── validateFile.ts (文件验证)
    └── getFileIcon.ts (获取文件图标)
```

### 3. Composables 提取原则

#### 何时提取 Composable？

1. **逻辑复用** - 多个组件使用相同逻辑
2. **状态管理** - 复杂的状态管理
3. **副作用处理** - 网络请求、定时器等
4. **业务逻辑** - 独立的业务逻辑

#### Composable 示例

```typescript
// useFileUpload.ts
export function useFileUpload() {
  const fileList = ref<FileItem[]>([])
  const isUploading = ref(false)

  const addFile = (file: File) => {
    // 添加文件逻辑
  }

  const uploadFile = async (file: FileItem) => {
    // 上传逻辑
  }

  return {
    fileList,
    isUploading,
    addFile,
    uploadFile
  }
}
```

### 4. Utils 函数原则

#### 何时提取 Utils？

1. **纯函数** - 无副作用
2. **通用工具** - 多处使用
3. **格式化** - 数据格式化
4. **验证** - 数据验证

#### Utils 示例

```typescript
// formatFileSize.ts
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// validateFile.ts
export function validateFile(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}
```

## 📁 文件结构规范

### 模块结构

```
moduleNameInCamelCase/
├── index.vue                    # 主入口（组合子组件）
├── components/                  # 模块专用组件
│   ├── ComponentName.vue       # 大驼峰命名
│   └── AnotherComponent.vue
├── composables/                 # 组合式函数
│   ├── useFeature.ts           # use 前缀 + 小驼峰
│   └── useAnotherFeature.ts
├── utils/                       # 工具函数
│   ├── helperFunction.ts       # 小驼峰命名
│   └── anotherHelper.ts
├── types.ts                     # 类型定义
├── constants.ts                 # 常量定义
└── README.md                    # 模块说明
```

### 组件内部结构

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed } from 'vue'
import ComponentName from './components/ComponentName.vue'
import { useFeature } from './composables/useFeature'
import { helperFunction } from './utils/helperFunction'
import type { TypeName } from './types'

// 2. Props 和 Emits
interface Props {
  propName: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  eventName: [payload: string]
}>()

// 3. 组合式函数
const { state, action } = useFeature()

// 4. 响应式状态
const localState = ref('')

// 5. 计算属性
const computedValue = computed(() => {
  return localState.value.toUpperCase()
})

// 6. 方法
const handleAction = () => {
  // 处理逻辑
}

// 7. 生命周期
onMounted(() => {
  // 初始化
})
</script>

<template>
  <!-- 模板 -->
</template>

<style scoped>
/* 样式 */
</style>
```

## 🎯 最佳实践

### 1. 组件职责清晰

```typescript
// ✅ 好的设计
// FileList.vue - 只负责展示文件列表
// FileItem.vue - 只负责展示单个文件
// UploadArea.vue - 只负责上传区域

// ❌ 不好的设计
// FileUpload.vue - 包含所有功能
```

### 2. Props 向下，Events 向上

```vue
<!-- ✅ 正确 -->
<FileList :files="fileList" @fileRemove="handleRemove" />

<!-- ❌ 错误 - 直接修改父组件状态 -->
<FileList :files="fileList" />
<!-- 在 FileList 内部直接修改 fileList -->
```

### 3. 使用 Composables 复用逻辑

```typescript
// ✅ 正确 - 提取可复用逻辑
const { fileList, addFile, removeFile } = useFileList()

// ❌ 错误 - 在组件中重复实现
const fileList = ref([])
const addFile = file => {
  /* 重复代码 */
}
```

### 4. 工具函数纯函数化

```typescript
// ✅ 正确 - 纯函数
export function formatFileSize(bytes: number): string {
  // 无副作用
  return formatted
}

// ❌ 错误 - 有副作用
export function formatFileSize(bytes: number): string {
  console.log(bytes) // 副作用
  globalVar = bytes // 修改全局变量
  return formatted
}
```

### 5. 类型定义集中管理

```typescript
// types.ts
export interface FileItem {
  id: string
  name: string
  size: number
}

export interface UploadConfig {
  maxSize: number
  maxFiles: number
}

// ✅ 在多个文件中导入使用
import type { FileItem, UploadConfig } from './types'
```

## 📊 代码质量指标

### 组件大小

- **小组件**: < 100 行 ✅
- **中组件**: 100-200 行 ⚠️
- **大组件**: > 200 行 ❌ (需要拆分)

### 函数复杂度

- **简单函数**: < 10 行 ✅
- **中等函数**: 10-30 行 ⚠️
- **复杂函数**: > 30 行 ❌ (需要拆分)

### 文件数量

- **单文件**: 1 个 ❌
- **适当拆分**: 3-8 个 ✅
- **过度拆分**: > 15 个 ⚠️

## 🔍 代码审查清单

### 命名

- [ ] 文件夹使用小驼峰命名
- [ ] 组件文件使用大驼峰命名
- [ ] 变量和函数使用小驼峰命名
- [ ] 常量使用大写下划线命名
- [ ] 无中划线命名

### 结构

- [ ] 组件职责单一
- [ ] 大组件已拆分
- [ ] 可复用逻辑已提取
- [ ] 工具函数已独立
- [ ] 类型定义已集中

### 质量

- [ ] 无重复代码
- [ ] 函数保持简洁
- [ ] 注释清晰
- [ ] 类型完整
- [ ] 无 any 类型

## 🎓 总结

遵循这些规范可以：

1. ✅ **提高可维护性** - 代码结构清晰
2. ✅ **提高可复用性** - 组件和逻辑可复用
3. ✅ **提高可测试性** - 单元测试更容易
4. ✅ **提高协作效率** - 团队成员易于理解
5. ✅ **提高代码质量** - 减少 bug 和技术债务

记住：**好的代码不是一次写成的，而是不断重构出来的！**
