/**
 * 应用配置状态管理
 */

import { defineStore } from 'pinia'
import { store } from '@/store'

interface AppState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  locale: string
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
