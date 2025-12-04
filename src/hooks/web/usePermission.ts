/**
 * 权限管理 Hook
 */

import { useUserStore } from '@/store/modules/user'
import { RoleEnum } from '@/enums/roleEnum'

export function usePermission() {
  const userStore = useUserStore()

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

  function hasAnyPermission(value: RoleEnum[] | string[]): boolean {
    return hasPermission(value, false)
  }

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
