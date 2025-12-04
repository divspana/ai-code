# Uppy.js 文件上传使用指南

## 🎯 关于 Uppy.js

Uppy 是一个现代化、模块化的 JavaScript 文件上传库，由 Transloadit 开发和维护。

### 为什么选择 Uppy？

1. **功能强大** 💪
   - 支持多种上传方式
   - 断点续传
   - 文件预览和编辑
   - 多语言支持

2. **模块化设计** 🧩
   - 按需加载插件
   - 灵活配置
   - 易于扩展

3. **用户体验好** ✨
   - 美观的 UI
   - 实时进度反馈
   - 友好的错误提示

4. **生产级别** 🏭
   - 经过大量项目验证
   - 持续维护更新
   - 完善的文档

## ✨ 核心特性

### 1. Dashboard 界面

- **拖拽上传** - 拖拽文件到上传区域
- **点击上传** - 点击浏览文件
- **粘贴上传** - 支持 Ctrl+V 粘贴图片
- **文件夹上传** - 选择整个文件夹

### 2. 上传控制

- **暂停/恢复** - 随时暂停和恢复上传
- **取消上传** - 取消正在上传的文件
- **重试失败** - 自动或手动重试失败的上传
- **批量操作** - 批量上传多个文件

### 3. 文件管理

- **文件预览** - 上传前预览文件
- **元数据编辑** - 编辑文件名和描述
- **文件移除** - 移除不需要的文件
- **文件信息** - 显示文件大小、类型等

### 4. 进度反馈

- **整体进度** - 显示所有文件的上传进度
- **单文件进度** - 每个文件的独立进度
- **上传速度** - 实时显示上传速度
- **剩余时间** - 预估剩余时间

### 5. 限制和验证

- **文件大小限制** - 限制单文件最大大小
- **文件数量限制** - 限制最多上传文件数
- **文件类型限制** - 限制允许的文件类型
- **自定义验证** - 添加自定义验证规则

## 🚀 快速开始

### 访问页面

点击左侧菜单的 "**文件上传 (Uppy)**" 或访问 `/file-upload-uppy`

### 上传文件

#### 方式1: 拖拽上传

1. 将文件拖到上传区域
2. 松开鼠标
3. 文件自动添加到列表
4. 点击"上传"按钮开始上传

#### 方式2: 点击上传

1. 点击"浏览文件"按钮
2. 选择要上传的文件
3. 点击"打开"
4. 点击"上传"按钮开始上传

#### 方式3: 粘贴上传

1. 复制图片到剪贴板
2. 在上传区域按 Ctrl+V（或 Cmd+V）
3. 图片自动添加
4. 点击"上传"按钮开始上传

#### 方式4: 文件夹上传

1. 点击"浏览文件"按钮
2. 选择"选择文件夹"选项
3. 选择要上传的文件夹
4. 点击"上传"按钮开始上传

## 📋 界面说明

### 左侧面板

#### Uppy.js 特性

展示 Uppy 的核心功能特性

#### 统计信息

- 总文件数
- 总大小
- 已上传文件数
- 已上传大小

#### 使用提示

常用操作和注意事项

### 右侧面板

#### Uppy Dashboard

- **上传区域** - 拖拽或点击上传
- **文件列表** - 显示所有添加的文件
- **进度条** - 显示上传进度
- **操作按钮** - 上传、暂停、取消等

## 🎨 功能详解

### 1. 文件添加

**支持方式**:

- 拖拽文件
- 点击浏览
- 粘贴图片
- 选择文件夹

**添加后**:

- 显示文件预览（图片）
- 显示文件信息
- 可以编辑元数据
- 可以移除文件

### 2. 上传控制

**开始上传**:

- 点击"上传"按钮
- 所有文件开始上传

**暂停上传**:

- 点击"暂停"按钮
- 上传暂停，可以恢复

**取消上传**:

- 点击"取消"按钮
- 取消当前上传

**重试失败**:

- 点击"重试"按钮
- 重新上传失败的文件

### 3. 进度显示

**整体进度**:

- 顶部显示总进度条
- 显示已上传/总文件数
- 显示上传速度
- 显示剩余时间

**单文件进度**:

- 每个文件独立进度条
- 显示文件大小
- 显示上传状态

### 4. 元数据编辑

**可编辑字段**:

- 文件名
- 文件描述

**编辑方式**:

1. 点击文件卡片
2. 在弹出的表单中编辑
3. 保存更改

### 5. 文件预览

**支持类型**:

- 图片（JPG, PNG, GIF 等）
- 视频（部分格式）

**预览方式**:

- 自动显示缩略图
- 点击查看大图

## ⚙️ 配置选项

### 当前配置

```typescript
{
  maxFileSize: 100 * 1024 * 1024,  // 100 MB
  maxNumberOfFiles: 50,             // 最多 50 个文件
  minNumberOfFiles: 1,              // 至少 1 个文件
  allowedFileTypes: null            // 允许所有类型
}
```

### 自定义配置

可以在代码中修改配置：

```typescript
const uppy = new Uppy({
  restrictions: {
    maxFileSize: 50 * 1024 * 1024, // 改为 50 MB
    maxNumberOfFiles: 20, // 改为 20 个
    allowedFileTypes: ['image/*', 'video/*'] // 只允许图片和视频
  }
})
```

## 🔌 插件系统

### 已集成插件

1. **Dashboard** - 主界面
2. **XHR Upload** - XHR 上传
3. **Drag Drop** - 拖拽支持

### 可选插件

Uppy 提供了丰富的插件：

#### 上传插件

- **Tus** - 断点续传
- **AWS S3** - 上传到 S3
- **Google Drive** - 从 Google Drive 选择
- **Dropbox** - 从 Dropbox 选择
- **Instagram** - 从 Instagram 导入
- **URL** - 从 URL 导入

#### 功能插件

- **Webcam** - 拍照/录像
- **Screen Capture** - 屏幕录制
- **Image Editor** - 图片编辑
- **Audio** - 录音
- **Compressor** - 图片压缩
- **Golden Retriever** - 恢复上传状态

#### UI 插件

- **Status Bar** - 状态栏
- **Progress Bar** - 进度条
- **Informer** - 通知提示

### 添加插件示例

```typescript
import Webcam from '@uppy/webcam'
import ImageEditor from '@uppy/image-editor'

uppy.use(Webcam)
uppy.use(ImageEditor, {
  cropperOptions: {
    aspectRatio: 1
  }
})
```

## 🌐 多语言支持

Uppy 支持多种语言，当前已配置中文：

```typescript
locale: {
  strings: {
    dashboardTitle: '文件上传',
    dropHereOr: '拖放文件到这里，或 %{browse}',
    browse: '浏览',
    // ... 更多中文翻译
  }
}
```

## 🔧 事件监听

### 已监听的事件

```typescript
// 文件添加
uppy.on('file-added', file => {
  console.log('文件已添加:', file)
})

// 文件删除
uppy.on('file-removed', file => {
  console.log('文件已删除:', file)
})

// 开始上传
uppy.on('upload', data => {
  console.log('开始上传:', data)
})

// 上传成功
uppy.on('upload-success', (file, response) => {
  console.log('上传成功:', file, response)
})

// 上传失败
uppy.on('upload-error', (file, error) => {
  console.error('上传失败:', file, error)
})

// 上传完成
uppy.on('complete', result => {
  console.log('上传完成:', result)
})

// 限制失败
uppy.on('restriction-failed', (file, error) => {
  console.error('限制失败:', file, error)
})
```

### 更多事件

Uppy 提供了丰富的事件：

- `upload-progress` - 上传进度
- `upload-retry` - 重试上传
- `cancel-all` - 取消所有
- `reset-progress` - 重置进度
- 等等...

## 💡 最佳实践

### 1. 服务器端配置

当前使用模拟端点，实际项目需要配置真实的上传 API：

```typescript
uppy.use(XHRUpload, {
  endpoint: 'https://your-api.com/upload',
  method: 'POST',
  formData: true,
  fieldName: 'file',
  headers: {
    Authorization: 'Bearer your-token'
  }
})
```

### 2. 使用 Tus 实现断点续传

```typescript
import Tus from '@uppy/tus'

uppy.use(Tus, {
  endpoint: 'https://your-api.com/files/',
  resume: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000]
})
```

### 3. 图片压缩

```typescript
import Compressor from '@uppy/compressor'

uppy.use(Compressor, {
  quality: 0.6,
  maxWidth: 1920,
  maxHeight: 1080
})
```

### 4. 云存储集成

```typescript
import AwsS3 from '@uppy/aws-s3'

uppy.use(AwsS3, {
  companionUrl: 'https://your-companion.com'
})
```

## ⚠️ 注意事项

### 1. 浏览器兼容性

- 现代浏览器支持良好
- IE 11 需要 polyfill
- 建议使用最新版浏览器

### 2. 文件大小限制

- 默认 100 MB
- 可根据服务器配置调整
- 大文件建议使用 Tus 插件

### 3. 并发上传

- 默认并发上传
- 可配置并发数量
- 避免同时上传过多文件

### 4. 内存使用

- 大量文件会占用内存
- 及时清理已上传文件
- 考虑分批上传

## 🔒 安全建议

### 1. 服务器验证

- 不要仅依赖前端验证
- 服务器必须验证文件
- 检查文件类型和大小

### 2. 文件扫描

- 扫描病毒和恶意代码
- 验证文件内容
- 隔离可疑文件

### 3. 访问控制

- 实现用户认证
- 文件权限管理
- 防止未授权访问

### 4. HTTPS

- 使用 HTTPS 传输
- 保护用户隐私
- 防止中间人攻击

## 📚 参考资源

- [Uppy 官方文档](https://uppy.io/docs/)
- [Uppy GitHub](https://github.com/transloadit/uppy)
- [插件列表](https://uppy.io/docs/plugins/)
- [示例代码](https://uppy.io/examples/)

## 🎉 总结

Uppy.js 文件上传模块提供了：

1. ✅ **专业的 UI** - 美观、易用
2. ✅ **强大的功能** - 暂停、恢复、重试
3. ✅ **灵活的配置** - 高度可定制
4. ✅ **丰富的插件** - 扩展性强
5. ✅ **完善的文档** - 易于学习
6. ✅ **生产级别** - 可靠稳定

相比基础版本，Uppy.js 提供了更专业、更完整的文件上传解决方案，特别适合需要高级功能的项目！
