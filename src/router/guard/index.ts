/**
 * 路由守卫
 */

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

function createPageGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const userStore = useUserStoreWithOut()
    const token = userStore.getToken

    if (WHITE_LIST.includes(to.path as PageEnum)) {
      next()
      return
    }

    if (!token) {
      if (to.path !== PageEnum.BASE_LOGIN) {
        next({ path: PageEnum.BASE_LOGIN, replace: true })
        return
      }
    }

    if (to.path === PageEnum.BASE_LOGIN && token) {
      next({ path: PageEnum.BASE_HOME, replace: true })
      return
    }

    next()
  })
}

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
