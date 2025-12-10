<template>
  <div class="folder-upload-demo">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">文件夹上传示例</span>
      </template>
    </el-page-header>

    <div class="demo-content">
      <el-alert title="功能说明" type="info" :closable="false" style="margin-bottom: 20px">
        <ul>
          <li>支持选择整个文件夹进行上传</li>
          <li>文件以树形结构展示在表格中</li>
          <li>支持文件分片上传（默认2MB每片）</li>
          <li>最大并发上传任务数：6个</li>
          <li>实时显示上传进度和状态</li>
          <li>支持暂停和继续上传</li>
        </ul>
      </el-alert>

      <FolderUpload />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import FolderUpload from '@/components/FolderUpload.vue'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.folder-upload-demo {
  padding: 20px;

  .page-title {
    font-size: 18px;
    font-weight: 600;
  }

  .demo-content {
    margin-top: 20px;

    ul {
      margin: 10px 0;
      padding-left: 20px;

      li {
        margin: 5px 0;
        color: var(--el-text-color-regular);
      }
    }
  }
}
</style>
