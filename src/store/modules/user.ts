/**
 * 用户状态管理
 */

import { defineStore } from 'pinia'
import { store } from '@/store'
import { getToken, setToken as saveToken, removeToken } from '@/utils/http'

interface UserInfo {
  userId: string
  username: string
  realName: string
  avatar?: string
  roles: string[]
}

interface UserState {
  userInfo: UserInfo | null
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
      this.token = info || ''
      saveToken(info || '')
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
    }
  }
})

// 在 setup 外使用
export function useUserStoreWithOut() {
  return useUserStore(store)
}
