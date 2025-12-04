# 🎨 Vben Admin 风格实施指南

## ✅ 已完成

### 1. 依赖安装
```bash
✅ pinia - 状态管理
✅ @vueuse/core - Vue 组合式 API 工具集
✅ nprogress - 进度条
✅ @types/nprogress - TypeScript 类型
```

## 🚀 核心实施步骤

### 步骤 1: 创建 Pinia Store

#### 1.1 创建 Store 入口
```typescript
// src/store/index.ts
import type { App } from 'vue'
import { createPinia } from 'pinia'

const store = createPinia()

export function setupStore(app: App<Element>) {
  app.use(store)
}

export { store }
```

#### 1.2 创建用户 Store
```typescript
// src/store/modules/user.ts
import { defineStore } from 'pinia'
import { store } from '@/store'
import { getToken, setToken, removeToken } from '@/utils/http'

interface UserInfo {
  userId: string
  username: string
  realName: string
  avatar?: string
  roles: string[]
}

interface UserState {
  userInfo: Nullable<UserInfo>
  token?: string
  roleList: string[]
}

export const useUserStore = defineStore({
  id: 'app-user',
  state: (): UserState => ({
    userInfo: null,
    token: undefined,
    roleList: []
  }),
  getters: {
    getUserInfo(): UserInfo {
      return this.userInfo || ({} as UserInfo)
    },
    getToken(): string {
      return this.token || getToken() || ''
    },
    getRoleList(): string[] {
      return this.roleList
    }
  },
  actions: {
    setToken(info: string | undefined) {
      this.token = info ? info : ''
      setToken(info || '')
    },
    setUserInfo(info: UserInfo | null) {
      this.userInfo = info
    },
    setRoleList(roleList: string[]) {
      this.roleList = roleList
    },
    resetState() {
      this.userInfo = null
      this.token = ''
      this.roleList = []
    },
    async logout() {
      this.setToken(undefined)
      this.setUserInfo(null)
      this.setRoleList([])
      removeToken()
      // 跳转到登录页
      // router.push('/login')
    }
  }
})

// 在 setup 外使用
export function useUserStoreWithOut() {
  return useUserStore(store)
}
```

#### 1.3 创建应用配置 Store
```typescript
// src/store/modules/app.ts
import { defineStore } from 'pinia'
import { store } from '@/store'

interface AppState {
  // 侧边栏折叠状态
  sidebarCollapsed: boolean
  // 主题模式
  theme: 'light' | 'dark'
  // 语言
  locale: string
  // 页面加载状态
  pageLoading: boolean
}

export const useAppStore = defineStore({
  id: 'app',
  state: (): AppState => ({
    sidebarCollapsed: false,
    theme: 'light',
    locale: 'zh-CN',
    pageLoading: false
  }),
  getters: {
    getSidebarCollapsed(): boolean {
      return this.sidebarCollapsed
    },
    getTheme(): string {
      return this.theme
    }
  },
  actions: {
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme
    },
    setPageLoading(loading: boolean) {
      this.pageLoading = loading
    }
  }
})

export function useAppStoreWithOut() {
  return useAppStore(store)
}
```

### 步骤 2: 创建枚举

```typescript
// src/enums/httpEnum.ts
export enum ResultEnum {
  SUCCESS = 0,
  ERROR = -1,
  TIMEOUT = 401,
  TYPE = 'success'
}

export enum RequestEnum {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export enum ContentTypeEnum {
  JSON = 'application/json;charset=UTF-8',
  FORM_URLENCODED = 'application/x-www-form-urlencoded;charset=UTF-8',
  FORM_DATA = 'multipart/form-data;charset=UTF-8'
}

// src/enums/pageEnum.ts
export enum PageEnum {
  // 登录
  BASE_LOGIN = '/login',
  // 首页
  BASE_HOME = '/dashboard',
  // 错误
  ERROR_PAGE = '/exception',
  // 错误日志
  ERROR_LOG_PAGE = '/error-log/list'
}

// src/enums/roleEnum.ts
export enum RoleEnum {
  // 超级管理员
  SUPER = 'super',
  // 管理员
  ADMIN = 'admin',
  // 普通用户
  USER = 'user'
}
```

### 步骤 3: 创建 Hooks

```typescript
// src/hooks/web/usePermission.ts
import { useUserStore } from '@/store/modules/user'
import { RoleEnum } from '@/enums/roleEnum'

export function usePermission() {
  const userStore = useUserStore()

  /**
   * 判断是否有权限
   */
  function hasPermission(value?: RoleEnum | RoleEnum[] | string | string[], def = true): boolean {
    if (!value) {
      return def
    }

    const roleList = userStore.getRoleList

    if (!roleList || roleList.length === 0) {
      return false
    }

    const permissionList = Array.isArray(value) ? value : [value]
    return roleList.some(role => permissionList.includes(role))
  }

  /**
   * 判断是否有任一权限
   */
  function hasAnyPermission(value: RoleEnum[] | string[]): boolean {
    return hasPermission(value, false)
  }

  /**
   * 判断是否有所有权限
   */
  function hasAllPermission(value: RoleEnum[] | string[]): boolean {
    const roleList = userStore.getRoleList
    return value.every(role => roleList.includes(role))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermission
  }
}

// src/hooks/web/useMessage.ts
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { MessageOptions, NotificationOptions } from 'element-plus'

export function useMessage() {
  return {
    success: (message: string, options?: MessageOptions) => {
      return ElMessage.success({ message, ...options })
    },
    error: (message: string, options?: MessageOptions) => {
      return ElMessage.error({ message, ...options })
    },
    warning: (message: string, options?: MessageOptions) => {
      return ElMessage.warning({ message, ...options })
    },
    info: (message: string, options?: MessageOptions) => {
      return ElMessage.info({ message, ...options })
    },
    confirm: (message: string, title = '提示') => {
      return ElMessageBox.confirm(message, title, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    },
    notify: (options: NotificationOptions) => {
      return ElNotification(options)
    }
  }
}

// src/hooks/web/useLoading.ts
import { ref } from 'vue'
import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

export function useLoading(options = {}) {
  const loading = ref(false)
  let loadingInstance: LoadingInstance | null = null

  const openLoading = (text = '加载中...') => {
    loading.value = true
    loadingInstance = ElLoading.service({
      lock: true,
      text,
      background: 'rgba(0, 0, 0, 0.7)',
      ...options
    })
  }

  const closeLoading = () => {
    loading.value = false
    loadingInstance?.close()
    loadingInstance = null
  }

  return {
    loading,
    openLoading,
    closeLoading
  }
}
```

### 步骤 4: 优化工具函数

```typescript
// src/utils/is.ts
const toString = Object.prototype.toString

export function is(val: unknown, type: string) {
  return toString.call(val) === `[object ${type}]`
}

export function isDef<T = unknown>(val?: T): val is T {
  return typeof val !== 'undefined'
}

export function isUnDef<T = unknown>(val?: T): val is T {
  return !isDef(val)
}

export function isObject(val: any): val is Record<any, any> {
  return val !== null && is(val, 'Object')
}

export function isEmpty<T = unknown>(val: T): val is T {
  if (isArray(val) || isString(val)) {
    return val.length === 0
  }

  if (val instanceof Map || val instanceof Set) {
    return val.size === 0
  }

  if (isObject(val)) {
    return Object.keys(val).length === 0
  }

  return false
}

export function isDate(val: unknown): val is Date {
  return is(val, 'Date')
}

export function isNull(val: unknown): val is null {
  return val === null
}

export function isNullAndUnDef(val: unknown): val is null | undefined {
  return isUnDef(val) && isNull(val)
}

export function isNullOrUnDef(val: unknown): val is null | undefined {
  return isUnDef(val) || isNull(val)
}

export function isNumber(val: unknown): val is number {
  return is(val, 'Number')
}

export function isPromise<T = any>(val: unknown): val is Promise<T> {
  return is(val, 'Promise') && isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

export function isString(val: unknown): val is string {
  return is(val, 'String')
}

export function isFunction(val: unknown): val is Function {
  return typeof val === 'function'
}

export function isBoolean(val: unknown): val is boolean {
  return is(val, 'Boolean')
}

export function isRegExp(val: unknown): val is RegExp {
  return is(val, 'RegExp')
}

export function isArray(val: any): val is Array<any> {
  return val && Array.isArray(val)
}

export function isWindow(val: any): val is Window {
  return typeof window !== 'undefined' && is(val, 'Window')
}

export function isElement(val: unknown): val is Element {
  return isObject(val) && !!val.tagName
}

export function isMap(val: unknown): val is Map<any, any> {
  return is(val, 'Map')
}

export const isServer = typeof window === 'undefined'

export const isClient = !isServer

export function isUrl(path: string): boolean {
  const reg = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/
  return reg.test(path)
}

// src/utils/dateUtil.ts
import dayjs from 'dayjs'

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
const DATE_FORMAT = 'YYYY-MM-DD'

export function formatToDateTime(
  date: dayjs.ConfigType = undefined,
  format = DATE_TIME_FORMAT
): string {
  return dayjs(date).format(format)
}

export function formatToDate(date: dayjs.ConfigType = undefined, format = DATE_FORMAT): string {
  return dayjs(date).format(format)
}

export const dateUtil = dayjs
```

### 步骤 5: 路由守卫

```typescript
// src/router/guard/index.ts
import type { Router } from 'vue-router'
import { useUserStoreWithOut } from '@/store/modules/user'
import { useAppStoreWithOut } from '@/store/modules/app'
import { PageEnum } from '@/enums/pageEnum'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const WHITE_LIST = [PageEnum.BASE_LOGIN]

export function setupRouterGuard(router: Router) {
  createPageGuard(router)
  createProgressGuard(router)
}

/**
 * 页面守卫
 */
function createPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStoreWithOut()
    const token = userStore.getToken

    // 白名单直接放行
    if (WHITE_LIST.includes(to.path as PageEnum)) {
      next()
      return
    }

    // 未登录跳转登录页
    if (!token) {
      next({ path: PageEnum.BASE_LOGIN, replace: true })
      return
    }

    // 已登录访问登录页，跳转首页
    if (to.path === PageEnum.BASE_LOGIN) {
      next({ path: PageEnum.BASE_HOME, replace: true })
      return
    }

    // 权限验证
    // const hasPermission = await checkPermission(to)
    // if (!hasPermission) {
    //   next({ path: PageEnum.ERROR_PAGE, replace: true })
    //   return
    // }

    next()
  })
}

/**
 * 进度条守卫
 */
function createProgressGuard(router: Router) {
  router.beforeEach(() => {
    NProgress.start()
    const appStore = useAppStoreWithOut()
    appStore.setPageLoading(true)
  })

  router.afterEach(() => {
    NProgress.done()
    const appStore = useAppStoreWithOut()
    appStore.setPageLoading(false)
  })
}
```

### 步骤 6: 更新 main.ts

```typescript
// src/main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './style.scss'
import './assets/form-focus.scss'

import App from './App.vue'
import router from './router'
import { setupStore } from './store'
import { setupRouterGuard } from './router/guard'

async function bootstrap() {
  const app = createApp(App)

  // 配置 store
  setupStore(app)

  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  // 配置路由
  app.use(router)

  // 路由守卫
  setupRouterGuard(router)

  // 配置 Element Plus
  app.use(ElementPlus)

  // 挂载应用
  app.mount('#app')
}

bootstrap()
```

## 📁 完整目录结构

```
src/
├── api/                    # API 接口
│   ├── model/             # 类型定义
│   │   └── userModel.ts
│   ├── sys/               # 系统 API
│   │   ├── user.ts
│   │   └── menu.ts
│   └── modules/           # 业务 API
│       └── ...
├── assets/                # 静态资源
├── components/            # 全局组件
│   ├── Basic/            # 基础组件
│   ├── Form/             # 表单组件
│   └── Table/            # 表格组件
├── composables/           # 组合式函数
│   └── ...
├── directives/            # 自定义指令
│   ├── permission.ts     # 权限指令
│   └── loading.ts        # 加载指令
├── enums/                 # 枚举
│   ├── httpEnum.ts
│   ├── pageEnum.ts
│   └── roleEnum.ts
├── hooks/                 # Hooks
│   ├── web/
│   │   ├── usePermission.ts
│   │   ├── useMessage.ts
│   │   └── useLoading.ts
│   └── setting/
│       └── useTheme.ts
├── layouts/               # 布局
│   └── default/
│       └── index.vue
├── router/                # 路由
│   ├── routes/           # 路由配置
│   │   ├── basic.ts
│   │   └── modules/
│   ├── guard/            # 路由守卫
│   │   └── index.ts
│   └── index.ts
├── store/                 # 状态管理
│   ├── modules/
│   │   ├── user.ts
│   │   ├── app.ts
│   │   └── permission.ts
│   └── index.ts
├── styles/                # 全局样式
│   ├── variables.scss
│   ├── mixins.scss
│   └── index.scss
├── utils/                 # 工具函数
│   ├── auth/
│   ├── cache/
│   ├── http/
│   ├── is.ts
│   ├── dateUtil.ts
│   └── domUtils.ts
├── views/                 # 页面视图
│   ├── dashboard/
│   ├── system/
│   └── ...
├── App.vue
└── main.ts
```

## 🎯 使用示例

### 在组件中使用 Store

```vue
<script setup lang="ts">
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'

const userStore = useUserStore()
const appStore = useAppStore()

// 获取用户信息
const userInfo = computed(() => userStore.getUserInfo)

// 切换侧边栏
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 登出
const handleLogout = async () => {
  await userStore.logout()
}
</script>
```

### 使用 Hooks

```vue
<script setup lang="ts">
import { usePermission } from '@/hooks/web/usePermission'
import { useMessage } from '@/hooks/web/useMessage'
import { useLoading } from '@/hooks/web/useLoading'
import { RoleEnum } from '@/enums/roleEnum'

const { hasPermission } = usePermission()
const { success, error, confirm } = useMessage()
const { loading, openLoading, closeLoading } = useLoading()

// 权限判断
const canEdit = hasPermission(RoleEnum.ADMIN)

// 确认对话框
const handleDelete = async () => {
  try {
    await confirm('确定要删除吗？')
    // 执行删除
    success('删除成功')
  } catch {
    // 用户取消
  }
}

// 加载状态
const fetchData = async () => {
  openLoading('加载中...')
  try {
    // 请求数据
  } finally {
    closeLoading()
  }
}
</script>
```

## 🎉 总结

参考 Vben Admin 风格的重构将带来：

1. ✅ **清晰的架构** - 模块化、可维护
2. ✅ **强大的功能** - Pinia、权限、Hooks
3. ✅ **优雅的代码** - TypeScript、规范
4. ✅ **良好的体验** - 性能、用户体验
5. ✅ **完整的文档** - 易于理解和使用

这是一个生产级别的架构，可以支撑大型项目的开发！🚀
