# Uppy.js 集成说明

## ⚠️ 当前状态

Uppy.js 已经安装并配置，但由于 `@uppy/vue` 包与 Vue 3 的兼容性问题，暂时注释了 Dashboard 组件的使用。

## 📦 已安装的包

```json
{
  "@uppy/core": "^5.2.0",
  "@uppy/dashboard": "^5.1.0",
  "@uppy/drag-drop": "^5.1.0",
  "@uppy/progress-bar": "^4.3.2",
  "@uppy/status-bar": "^5.1.0",
  "@uppy/vue": "^3.1.0",
  "@uppy/xhr-upload": "^5.1.0"
}
```

## ✅ 样式已配置

样式文件已在 `src/main.ts` 中全局导入：

```typescript
import '@uppy/core/dist/style.min.css'
import '@uppy/dashboard/dist/style.min.css'
```

## 🔧 推荐的使用方式

由于 `@uppy/vue` 包的兼容性问题，推荐使用以下两种方式：

### 方式 1: 直接使用 Uppy Core（推荐）

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import XHRUpload from '@uppy/xhr-upload'

const uppyContainer = ref<HTMLElement>()

onMounted(() => {
  const uppy = new Uppy({
    restrictions: {
      maxFileSize: 100 * 1024 * 1024,
      maxNumberOfFiles: 50
    }
  })

  uppy.use(Dashboard, {
    target: uppyContainer.value,
    inline: true,
    height: 600
  })

  uppy.use(XHRUpload, {
    endpoint: '/api/upload'
  })

  // 事件监听
  uppy.on('complete', result => {
    console.log('Upload complete:', result)
  })
})
</script>

<template>
  <div ref="uppyContainer"></div>
</template>
```

### 方式 2: 使用基础版文件上传

项目中已经实现了功能完整的基础版文件上传（`/file-upload`），包含：

- 拖拽上传
- 文件夹上传
- 文件预览
- 批量操作
- 统计信息

可以直接使用基础版，无需 Uppy.js。

## 📝 Uppy.js 的优势

虽然当前集成有些问题，但 Uppy.js 仍然是优秀的选择：

### 优势

1. **专业的 UI** - 美观的 Dashboard 界面
2. **断点续传** - 使用 Tus 插件
3. **云存储集成** - AWS S3, Google Drive 等
4. **图片编辑** - 裁剪、旋转
5. **多语言支持** - 完整的国际化
6. **插件生态** - 丰富的插件系统

### 劣势

1. **包体积大** - 完整功能约 200KB
2. **Vue 3 支持** - @uppy/vue 包兼容性问题
3. **学习成本** - API 较复杂
4. **配置复杂** - 需要配置多个插件

## 🎯 建议

### 简单场景

使用基础版文件上传（`/file-upload`）：

- 轻量级
- 易于定制
- 无依赖问题

### 复杂场景

如果需要以下功能，考虑使用 Uppy.js：

- 断点续传
- 云存储集成
- 图片编辑
- 多来源上传（Webcam, URL 等）

## 🔄 迁移到 Uppy.js

如果决定使用 Uppy.js，需要：

### 1. 使用原生 Dashboard

```typescript
import Dashboard from '@uppy/dashboard'

// 不使用 @uppy/vue 包
uppy.use(Dashboard, {
  target: '#uppy-dashboard',
  inline: true
})
```

### 2. 或等待 @uppy/vue 更新

关注 Uppy 的 GitHub 仓库，等待 Vue 3 支持改进。

### 3. 或使用 React 版本

如果项目允许，可以考虑在 React 中使用 Uppy，支持更好。

## 📚 参考资源

- [Uppy 官方文档](https://uppy.io/docs/)
- [Uppy GitHub](https://github.com/transloadit/uppy)
- [Uppy Vue 集成](https://uppy.io/docs/vue/)
- [Uppy Dashboard](https://uppy.io/docs/dashboard/)

## 🎓 总结

当前项目状态：

- ✅ Uppy.js 已安装
- ✅ 样式已配置
- ⚠️ Vue 组件有兼容性问题
- ✅ 基础版文件上传可用

建议：

- 简单场景使用基础版
- 复杂场景使用 Uppy Core API（不用 @uppy/vue）
- 或等待 @uppy/vue 包更新

两种方案都可以满足文件上传需求，根据项目实际情况选择！
