/**
 * 路由守卫
 */

import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

// 开发环境下禁用权限验证
const ENABLE_PERMISSION = import.meta.env.PROD

export function setupRouterGuard(router: Router) {
  createProgressGuard(router)
  
  // 生产环境才启用权限守卫
  if (ENABLE_PERMISSION) {
    createPageGuard(router)
  }
}

function createPageGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    // 这里可以添加权限验证逻辑
    // const userStore = useUserStoreWithOut()
    // const token = userStore.getToken
    // ...
    
    next()
  })
}

function createProgressGuard(router: Router) {
  router.beforeEach(() => {
    NProgress.start()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
