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
  },
  {
    path: '/folder-upload',
    name: 'FolderUpload',
    component: () => import('../views/FolderUploadDemo.vue'),
    meta: {
      title: '文件夹上传',
      icon: 'FolderOpened'
    }
  },
  {
    path: '/playground',
    name: 'Playground',
    component: () => import('../views/PlaygroundView.vue'),
    meta: {
      title: '组件 Playground',
      icon: 'Monitor'
    }
  },
  {
    path: '/data-comparison',
    name: 'DataComparison',
    component: () => import('../views/DataComparisonView.vue'),
    meta: {
      title: '数据对比',
      icon: 'Operation'
    }
  },
  {
    path: '/wafer-map-config',
    name: 'WaferMapConfig',
    component: () => import('../views/WaferMapConfigView.vue'),
    meta: {
      title: 'Wafer Map 配置',
      icon: 'Setting'
    }
  },
  {
    path: '/wafer-map-demo',
    name: 'WaferMapDemo',
    component: () => import('../views/WaferMapDemo.vue'),
    meta: {
      title: 'Wafer Map 组件',
      icon: 'Grid'
    }
  },
  {
    path: '/scatter-chart',
    name: 'ScatterChart',
    component: () => import('../views/ScatterChartDemo.vue'),
    meta: {
      title: '散点图组件',
      icon: 'ScaleToOriginal'
    }
  },
  {
    path: '/scatter-chart-debug',
    name: 'ScatterChartDebug',
    component: () => import('../views/ScatterChartDebug.vue'),
    meta: {
      title: '散点图性能调试',
      icon: 'Monitor'
    }
  },
  {
    path: '/box-plot-debug',
    name: 'BoxPlotDebug',
    component: () => import('../views/BoxPlotDebug.vue'),
    meta: {
      title: '箱线图调试',
      icon: 'DataAnalysis'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
