/**
 * 数据优化工具
 * 用于优化真实数据以提升图表渲染性能
 */

export interface DataOptimizationOptions {
  // 只保留必要字段
  essentialFields?: string[]
  // 简化字符串字段
  simplifyStrings?: boolean
  // 字符串最大长度
  maxStringLength?: number
  // 数值精度（小数位数）
  numericPrecision?: number
  // 移除嵌套对象
  flattenNested?: boolean
}

export interface OptimizationReport {
  originalSize: number
  optimizedSize: number
  reductionRate: number
  fieldCount: {
    before: number
    after: number
  }
  memoryEstimate: {
    before: string
    after: string
  }
}

/**
 * 估算对象内存占用（粗略估算）
 */
function estimateMemorySize(obj: unknown): number {
  const str = JSON.stringify(obj)
  // 粗略估算：每个字符约 2 字节（UTF-16）
  return str.length * 2
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 优化单个数据点
 */
export function optimizeDataPoint<T extends Record<string, unknown>>(
  data: T,
  options: DataOptimizationOptions = {}
): Record<string, unknown> {
  const {
    essentialFields,
    simplifyStrings = true,
    maxStringLength = 50,
    numericPrecision = 2,
    flattenNested = true
  } = options

  const optimized: Record<string, unknown> = {}

  // 如果指定了必要字段，只保留这些字段
  const fieldsToProcess = essentialFields || Object.keys(data)

  for (const key of fieldsToProcess) {
    const value = data[key]

    // 跳过 undefined 和 null
    if (value === undefined || value === null) {
      continue
    }

    // 处理数值
    if (typeof value === 'number') {
      // 保留指定精度
      optimized[key] = Number(value.toFixed(numericPrecision))
      continue
    }

    // 处理字符串
    if (typeof value === 'string') {
      if (simplifyStrings && value.length > maxStringLength) {
        // 截断长字符串
        optimized[key] = value.substring(0, maxStringLength) + '...'
      } else {
        optimized[key] = value
      }
      continue
    }

    // 处理嵌套对象
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (flattenNested) {
        // 跳过嵌套对象
        continue
      } else {
        optimized[key] = value
      }
      continue
    }

    // 处理数组
    if (Array.isArray(value)) {
      if (flattenNested) {
        // 跳过数组
        continue
      } else {
        optimized[key] = value
      }
      continue
    }

    // 其他类型直接保留
    optimized[key] = value
  }

  return optimized
}

/**
 * 批量优化数据
 */
export function optimizeDataset<T extends Record<string, unknown>>(
  dataset: T[],
  options: DataOptimizationOptions = {}
): {
  optimizedData: Record<string, unknown>[]
  report: OptimizationReport
} {
  console.log('🔧 开始优化数据集...')
  console.time('数据优化耗时')

  // 计算原始大小
  const originalSize = dataset.reduce((sum, item) => sum + estimateMemorySize(item), 0)
  const originalFieldCount = dataset.length > 0 ? Object.keys(dataset[0]).length : 0

  // 优化数据
  const optimizedData = dataset.map(item => optimizeDataPoint(item, options))

  // 计算优化后大小
  const optimizedSize = optimizedData.reduce((sum, item) => sum + estimateMemorySize(item), 0)
  const optimizedFieldCount = optimizedData.length > 0 ? Object.keys(optimizedData[0]).length : 0

  const reductionRate = ((originalSize - optimizedSize) / originalSize) * 100

  const report: OptimizationReport = {
    originalSize,
    optimizedSize,
    reductionRate,
    fieldCount: {
      before: originalFieldCount,
      after: optimizedFieldCount
    },
    memoryEstimate: {
      before: formatBytes(originalSize),
      after: formatBytes(optimizedSize)
    }
  }

  console.timeEnd('数据优化耗时')
  console.log('📊 优化报告:')
  console.log(`  数据量: ${dataset.length.toLocaleString()} 条`)
  console.log(`  字段数: ${originalFieldCount} → ${optimizedFieldCount}`)
  console.log(`  内存占用: ${report.memoryEstimate.before} → ${report.memoryEstimate.after}`)
  console.log(`  减少率: ${reductionRate.toFixed(1)}%`)

  return {
    optimizedData,
    report
  }
}

/**
 * 分析数据集，给出优化建议
 */
export function analyzeDataset<T extends Record<string, unknown>>(
  dataset: T[]
): {
  totalFields: number
  fieldTypes: Record<string, string>
  largeFields: string[]
  nestedFields: string[]
  suggestions: string[]
} {
  if (dataset.length === 0) {
    return {
      totalFields: 0,
      fieldTypes: {},
      largeFields: [],
      nestedFields: [],
      suggestions: ['数据集为空']
    }
  }

  const sample = dataset[0]
  const fieldTypes: Record<string, string> = {}
  const largeFields: string[] = []
  const nestedFields: string[] = []
  const suggestions: string[] = []

  // 分析字段
  for (const [key, value] of Object.entries(sample)) {
    const type = typeof value
    fieldTypes[key] = type

    // 检查大字符串
    if (type === 'string' && (value as string).length > 50) {
      largeFields.push(key)
    }

    // 检查嵌套对象
    if (type === 'object' && value !== null && !Array.isArray(value)) {
      nestedFields.push(key)
    }

    // 检查数组
    if (Array.isArray(value)) {
      nestedFields.push(key)
    }
  }

  // 生成建议
  const totalFields = Object.keys(fieldTypes).length
  
  if (totalFields > 10) {
    suggestions.push(`⚠️ 字段数量较多 (${totalFields})，建议只保留图表必需的字段`)
  }

  if (largeFields.length > 0) {
    suggestions.push(`⚠️ 发现 ${largeFields.length} 个长字符串字段: ${largeFields.join(', ')}`)
    suggestions.push('   建议截断或移除这些字段')
  }

  if (nestedFields.length > 0) {
    suggestions.push(`⚠️ 发现 ${nestedFields.length} 个嵌套字段: ${nestedFields.join(', ')}`)
    suggestions.push('   建议扁平化或移除这些字段')
  }

  const sampleSize = estimateMemorySize(sample)
  const totalSize = sampleSize * dataset.length
  
  if (totalSize > 50 * 1024 * 1024) { // > 50MB
    suggestions.push(`⚠️ 数据集较大 (${formatBytes(totalSize)})，强烈建议优化`)
  }

  if (suggestions.length === 0) {
    suggestions.push('✅ 数据结构良好，无需特别优化')
  }

  console.log('📋 数据集分析:')
  console.log(`  总字段数: ${totalFields}`)
  console.log(`  字段类型:`, fieldTypes)
  console.log(`  大字符串字段: ${largeFields.length}`)
  console.log(`  嵌套字段: ${nestedFields.length}`)
  console.log(`  单条数据大小: ${formatBytes(sampleSize)}`)
  console.log(`  总数据大小: ${formatBytes(totalSize)}`)
  console.log('💡 优化建议:')
  suggestions.forEach(s => console.log(`  ${s}`))

  return {
    totalFields,
    fieldTypes,
    largeFields,
    nestedFields,
    suggestions
  }
}

/**
 * 快速优化配置（针对散点图）
 */
export const SCATTER_CHART_OPTIMIZATION: DataOptimizationOptions = {
  essentialFields: ['x', 'y', 'value', 'name'], // 只保留必要字段
  simplifyStrings: true,
  maxStringLength: 30,
  numericPrecision: 2,
  flattenNested: true
}

/**
 * 快速优化配置（针对箱线图）
 */
export const BOX_PLOT_OPTIMIZATION: DataOptimizationOptions = {
  essentialFields: ['category', 'values'],
  simplifyStrings: true,
  maxStringLength: 20,
  numericPrecision: 2,
  flattenNested: true
}
