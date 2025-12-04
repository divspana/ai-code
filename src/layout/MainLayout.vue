<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Document, Edit, Tools, Grid, DataAnalysis, TrendCharts, Upload, Expand, Fold } from '@element-plus/icons-vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import { useTheme } from '../composables/useTheme'

const router = useRouter()
const route = useRoute()
const { loadTheme } = useTheme()

// 初始化主题
onMounted(() => {
  loadTheme()
})

const isCollapse = ref(false)

// 菜单项配置
const menuItems = [
  {
    path: '/todo',
    title: '待办事项',
    icon: Document
  },
  {
    path: '/form-engine',
    title: '表单引擎',
    icon: Edit
  },
  {
    path: '/form-builder',
    title: '表单设计器',
    icon: Tools
  },
  {
    path: '/wafer-map',
    title: 'Wafer Map',
    icon: Grid
  },
  {
    path: '/wafer-map-pro',
    title: 'Wafer Map Pro',
    icon: DataAnalysis
  },
  {
    path: '/charts',
    title: 'ECharts 图表',
    icon: TrendCharts
  },
  {
    path: '/file-upload',
    title: '文件上传',
    icon: Upload
  },
  {
    path: '/file-upload-uppy',
    title: '文件上传 (Uppy)',
    icon: Upload
  }
]

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 处理菜单选择
const handleMenuSelect = (path: string) => {
  router.push(path)
}
</script>

<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <div class="logo-container">
        <h2 v-if="!isCollapse" class="logo-title">Vue3 Admin</h2>
        <h2 v-else class="logo-title-collapsed">V3</h2>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>

      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon v-if="isCollapse"><Expand /></el-icon>
        <el-icon v-else><Fold /></el-icon>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="layout-header">
        <div class="header-content">
          <h3 class="page-title">{{ route.meta.title || '首页' }}</h3>
          <div class="header-right">
            <span class="welcome-text">欢迎使用 Vue3 + Element Plus</span>
            <ThemeSwitcher />
          </div>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.layout-aside {
  background: var(--theme-sidebar, #001529);
  transition: width 0.3s, background 0.3s;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  height: 100vh;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-sidebar-dark, #002140);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.3s;
}

.logo-title {
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.logo-title-collapsed {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background: var(--theme-sidebar, #001529);
  transition: background 0.3s;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
}

:deep(.el-menu-item:hover) {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.08) !important;
}

:deep(.el-menu-item.is-active) {
  color: #fff;
  background-color: var(--theme-primary, #1890ff) !important;
  transition: background-color 0.3s;
}

:deep(.el-menu-item .el-icon) {
  color: inherit;
}

.collapse-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.collapse-btn:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.08);
}

.main-container {
  background: #f0f2f5;
  height: 100vh;
  overflow: hidden;
}

.layout-header {
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  height: 60px;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-text {
  color: #606266;
  font-size: 14px;
}

.layout-main {
  padding: 0;
  margin: 0;
  overflow-y: auto;
  background: #f0f2f5;
  height: calc(100vh - 60px);
}

/* 路由过渡动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
