import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/todo'
  },
  {
    path: '/todo',
    name: 'TodoList',
    component: () => import('../modules/todo/index.vue'),
    meta: {
      title: 'Todo List',
      icon: 'Document'
    }
  },
  {
    path: '/form-engine',
    name: 'FormEngine',
    component: () => import('../modules/form-engine/index.vue'),
    meta: {
      title: '表单引擎',
      icon: 'Edit'
    }
  },
  {
    path: '/form-builder',
    name: 'FormBuilder',
    component: () => import('../modules/form-builder/index.vue'),
    meta: {
      title: '表单设计器',
      icon: 'Tools'
    }
  },
  {
    path: '/wafer-map',
    name: 'WaferMap',
    component: () => import('../modules/wafer-map/index.vue'),
    meta: {
      title: 'Wafer Map',
      icon: 'Grid'
    }
  },
  {
    path: '/wafer-map-pro',
    name: 'WaferMapPro',
    component: () => import('../modules/wafer-map-pro/index.vue'),
    meta: {
      title: 'Wafer Map Pro',
      icon: 'DataAnalysis'
    }
  },
  {
    path: '/charts',
    name: 'Charts',
    component: () => import('../modules/charts/index.vue'),
    meta: {
      title: 'ECharts 图表',
      icon: 'TrendCharts'
    }
  },
  {
    path: '/file-upload',
    name: 'FileUpload',
    component: () => import('../modules/file-upload/index.vue'),
    meta: {
      title: '文件上传',
      icon: 'Upload'
    }
  },
  {
    path: '/file-upload-uppy',
    name: 'FileUploadUppy',
    component: () => import('../modules/file-upload/UppyUpload.vue'),
    meta: {
      title: '文件上传 (Uppy)',
      icon: 'Upload'
    }
  },
  {
    path: '/chart-designer',
    name: 'ChartDesigner',
    component: () => import('../modules/chart-designer/index.vue'),
    meta: {
      title: '图表设计器',
      icon: 'DataAnalysis'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
