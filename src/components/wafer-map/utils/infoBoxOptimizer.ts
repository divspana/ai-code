/**
 * 信息框性能优化器
 * 用于处理大数据量（100w+）下的信息框渲染
 */

import type { SelectedDefectInfo } from '../types/defectData'

export interface OptimizationConfig {
  maxInfoBoxes: number // 最大信息框数量
  samplingStrategy: 'random' | 'grid' | 'density' | 'priority' // 采样策略
  enableClustering: boolean // 是否启用聚类
  clusterThreshold: number // 聚类距离阈值
  viewportPadding: number // 视口边距
}

export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  maxInfoBoxes: 50, // 最多显示 50 个信息框
  samplingStrategy: 'density',
  enableClustering: true,
  clusterThreshold: 30,
  viewportPadding: 50
}

/**
 * 空间分区网格（用于加速碰撞检测）
 */
class SpatialGrid {
  private grid: Map<string, SelectedDefectInfo[]>
  private cellSize: number

  constructor(cellSize: number = 100) {
    this.grid = new Map()
    this.cellSize = cellSize
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    return `${cellX},${cellY}`
  }

  insert(defect: SelectedDefectInfo): void {
    const key = this.getKey(defect.canvasX, defect.canvasY)
    if (!this.grid.has(key)) {
      this.grid.set(key, [])
    }
    this.grid.get(key)!.push(defect)
  }

  getNearby(x: number, y: number, radius: number): SelectedDefectInfo[] {
    const nearby: SelectedDefectInfo[] = []
    const cellRadius = Math.ceil(radius / this.cellSize)
    const centerCellX = Math.floor(x / this.cellSize)
    const centerCellY = Math.floor(y / this.cellSize)

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`
        const cell = this.grid.get(key)
        if (cell) {
          nearby.push(...cell)
        }
      }
    }

    return nearby
  }

  clear(): void {
    this.grid.clear()
  }
}

/**
 * 信息框优化器
 */
export class InfoBoxOptimizer {
  private config: OptimizationConfig
  private spatialGrid: SpatialGrid

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config }
    this.spatialGrid = new SpatialGrid(100)
  }

  /**
   * 优化信息框列表
   */
  optimize(
    defects: SelectedDefectInfo[],
    viewport?: { width: number; height: number }
  ): SelectedDefectInfo[] {
    // 1. 视口裁剪（如果提供了视口信息）
    let filtered = viewport ? this.filterByViewport(defects, viewport) : defects

    // 2. 如果数量仍然过多，进行采样
    if (filtered.length > this.config.maxInfoBoxes) {
      filtered = this.sample(filtered)
    }

    // 3. 聚类处理（可选）
    if (this.config.enableClustering && filtered.length > 10) {
      filtered = this.cluster(filtered)
    }

    return filtered
  }

  /**
   * 视口裁剪：只显示视口内的信息框
   */
  private filterByViewport(
    defects: SelectedDefectInfo[],
    viewport: { width: number; height: number }
  ): SelectedDefectInfo[] {
    const padding = this.config.viewportPadding
    return defects.filter(
      defect =>
        defect.canvasX >= -padding &&
        defect.canvasX <= viewport.width + padding &&
        defect.canvasY >= -padding &&
        defect.canvasY <= viewport.height + padding
    )
  }

  /**
   * 采样策略
   */
  private sample(defects: SelectedDefectInfo[]): SelectedDefectInfo[] {
    const { maxInfoBoxes, samplingStrategy } = this.config

    switch (samplingStrategy) {
      case 'random':
        return this.randomSample(defects, maxInfoBoxes)
      case 'grid':
        return this.gridSample(defects, maxInfoBoxes)
      case 'density':
        return this.densitySample(defects, maxInfoBoxes)
      case 'priority':
        return this.prioritySample(defects, maxInfoBoxes)
      default:
        return defects.slice(0, maxInfoBoxes)
    }
  }

  /**
   * 随机采样
   */
  private randomSample(defects: SelectedDefectInfo[], count: number): SelectedDefectInfo[] {
    const shuffled = [...defects].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  /**
   * 网格采样：均匀分布
   */
  private gridSample(defects: SelectedDefectInfo[], count: number): SelectedDefectInfo[] {
    if (defects.length <= count) return defects

    // 计算网格大小
    const gridSize = Math.ceil(Math.sqrt(defects.length / count))
    const grid: Map<string, SelectedDefectInfo> = new Map()

    defects.forEach(defect => {
      const cellX = Math.floor(defect.canvasX / 100)
      const cellY = Math.floor(defect.canvasY / 100)
      const key = `${Math.floor(cellX / gridSize)},${Math.floor(cellY / gridSize)}`

      // 每个网格只保留一个
      if (!grid.has(key)) {
        grid.set(key, defect)
      }
    })

    return Array.from(grid.values()).slice(0, count)
  }

  /**
   * 密度采样：优先显示密度低的区域
   */
  private densitySample(defects: SelectedDefectInfo[], count: number): SelectedDefectInfo[] {
    if (defects.length <= count) return defects

    // 构建空间网格
    this.spatialGrid.clear()
    defects.forEach(defect => this.spatialGrid.insert(defect))

    // 计算每个点的局部密度
    const densities = defects.map(defect => {
      const nearby = this.spatialGrid.getNearby(defect.canvasX, defect.canvasY, 100)
      return { defect, density: nearby.length }
    })

    // 按密度排序，优先选择密度低的
    densities.sort((a, b) => a.density - b.density)

    return densities.slice(0, count).map(d => d.defect)
  }

  /**
   * 优先级采样：根据自定义优先级
   */
  private prioritySample(defects: SelectedDefectInfo[], count: number): SelectedDefectInfo[] {
    // 可以根据坏点类型、严重程度等设置优先级
    const withPriority = defects.map(defect => ({
      defect,
      priority: this.calculatePriority(defect)
    }))

    withPriority.sort((a, b) => b.priority - a.priority)

    return withPriority.slice(0, count).map(d => d.defect)
  }

  /**
   * 计算优先级（可自定义）
   */
  private calculatePriority(defect: SelectedDefectInfo): number {
    let priority = 1

    // 根据类型调整优先级
    if (defect.type === 'critical') priority *= 3
    else if (defect.type === 'major') priority *= 2

    return priority
  }

  /**
   * 聚类：将相近的坏点合并为一个信息框
   */
  private cluster(defects: SelectedDefectInfo[]): SelectedDefectInfo[] {
    const { clusterThreshold } = this.config
    const clusters: SelectedDefectInfo[][] = []
    const visited = new Set<number>()

    defects.forEach((defect, index) => {
      if (visited.has(index)) return

      const cluster: SelectedDefectInfo[] = [defect]
      visited.add(index)

      // 查找附近的点
      for (let i = index + 1; i < defects.length; i++) {
        if (visited.has(i)) continue

        const other = defects[i]
        const distance = Math.sqrt(
          Math.pow(defect.canvasX - other.canvasX, 2) + Math.pow(defect.canvasY - other.canvasY, 2)
        )

        if (distance < clusterThreshold) {
          cluster.push(other)
          visited.add(i)
        }
      }

      clusters.push(cluster)
    })

    // 每个聚类选择一个代表点（中心点）
    return clusters.map(cluster => {
      if (cluster.length === 1) return cluster[0]

      // 计算聚类中心
      const centerX = cluster.reduce((sum, d) => sum + d.canvasX, 0) / cluster.length
      const centerY = cluster.reduce((sum, d) => sum + d.canvasY, 0) / cluster.length

      // 找到最接近中心的点
      let closest = cluster[0]
      let minDist = Infinity

      cluster.forEach(defect => {
        const dist = Math.sqrt(
          Math.pow(defect.canvasX - centerX, 2) + Math.pow(defect.canvasY - centerY, 2)
        )
        if (dist < minDist) {
          minDist = dist
          closest = defect
        }
      })

      // 添加聚类信息
      return {
        ...closest,
        clusterSize: cluster.length,
        isCluster: true
      }
    })
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * 创建优化器实例
 */
export function createInfoBoxOptimizer(config?: Partial<OptimizationConfig>): InfoBoxOptimizer {
  return new InfoBoxOptimizer(config)
}
