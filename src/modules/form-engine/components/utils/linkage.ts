import type { LinkageCondition, LinkageRule, FormData } from '../types'

/**
 * 检查单个条件是否满足
 */
export function checkCondition(condition: LinkageCondition, formData: FormData): boolean {
  const fieldValue = formData[condition.field]
  const { operator, value } = condition

  switch (operator) {
    case 'eq':
      return fieldValue === value
    case 'neq':
      return fieldValue !== value
    case 'gt':
      return fieldValue > value
    case 'gte':
      return fieldValue >= value
    case 'lt':
      return fieldValue < value
    case 'lte':
      return fieldValue <= value
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue)
    case 'notIn':
      return Array.isArray(value) && !value.includes(fieldValue)
    case 'includes':
      return Array.isArray(fieldValue) && fieldValue.includes(value)
    case 'notIncludes':
      return Array.isArray(fieldValue) && !fieldValue.includes(value)
    default:
      return false
  }
}

/**
 * 检查联动规则是否满足
 */
export function checkLinkageRule(rule: LinkageRule, formData: FormData): boolean {
  const { relation = 'all', conditions } = rule

  if (relation === 'all') {
    // 所有条件都满足
    return conditions.every(condition => checkCondition(condition, formData))
  } else {
    // 任一条件满足
    return conditions.some(condition => checkCondition(condition, formData))
  }
}

/**
 * 计算字段的联动状态
 */
export function calculateLinkageState(
  linkageRules: LinkageRule[] | undefined,
  formData: FormData
): {
  disabled?: boolean
  visible?: boolean
  required?: boolean
} {
  if (!linkageRules || linkageRules.length === 0) {
    return {}
  }

  const state: {
    disabled?: boolean
    visible?: boolean
    required?: boolean
  } = {}

  // 遍历所有联动规则
  for (const rule of linkageRules) {
    if (checkLinkageRule(rule, formData)) {
      // 规则满足，应用动作
      if (rule.action.disabled !== undefined) {
        state.disabled = rule.action.disabled
      }
      if (rule.action.visible !== undefined) {
        state.visible = rule.action.visible
      }
      if (rule.action.required !== undefined) {
        state.required = rule.action.required
      }
    }
  }

  return state
}
