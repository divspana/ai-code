import { ref, computed, type Ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { merge } from 'lodash-es'

/**
 * 图表配置管理 Hook
 */
export interface ChartOptionManager {
  option: Ref<EChartsOption>
  setTitle: (title: string | object) => void
  setXAxis: (xAxis: any) => void
  setYAxis: (yAxis: any) => void
  setSeries: (series: any | any[]) => void
  addSeries: (series: any) => void
  removeSeries: (index: number) => void
  setLegend: (legend: any) => void
  setTooltip: (tooltip: any) => void
  setGrid: (grid: any) => void
  setColor: (colors: string[]) => void
  updateOption: (updates: Partial<EChartsOption>) => void
  resetOption: () => void
  getOption: () => EChartsOption
}

export function useOption(initialOption: EChartsOption): ChartOptionManager {
  const defaultOption = ref<EChartsOption>(JSON.parse(JSON.stringify(initialOption)))
  const option = ref<EChartsOption>(JSON.parse(JSON.stringify(initialOption)))

  // 设置标题
  const setTitle = (title: string | object) => {
    if (typeof title === 'string') {
      option.value.title = { text: title }
    } else {
      option.value.title = title
    }
  }

  // 设置 X 轴
  const setXAxis = (xAxis: any) => {
    option.value.xAxis = xAxis
  }

  // 设置 Y 轴
  const setYAxis = (yAxis: any) => {
    option.value.yAxis = yAxis
  }

  // 设置系列数据
  const setSeries = (series: any | any[]) => {
    option.value.series = Array.isArray(series) ? series : [series]
  }

  // 添加系列
  const addSeries = (series: any) => {
    if (!option.value.series) {
      option.value.series = []
    }
    if (Array.isArray(option.value.series)) {
      option.value.series.push(series)
    }
  }

  // 删除系列
  const removeSeries = (index: number) => {
    if (Array.isArray(option.value.series)) {
      option.value.series.splice(index, 1)
    }
  }

  // 设置图例
  const setLegend = (legend: any) => {
    option.value.legend = legend
  }

  // 设置提示框
  const setTooltip = (tooltip: any) => {
    option.value.tooltip = tooltip
  }

  // 设置网格
  const setGrid = (grid: any) => {
    option.value.grid = grid
  }

  // 设置颜色
  const setColor = (colors: string[]) => {
    option.value.color = colors
  }

  // 更新配置（深度合并）
  const updateOption = (updates: Partial<EChartsOption>) => {
    option.value = merge({}, option.value, updates)
  }

  // 重置配置
  const resetOption = () => {
    option.value = JSON.parse(JSON.stringify(defaultOption.value))
  }

  // 获取当前配置
  const getOption = () => {
    return JSON.parse(JSON.stringify(option.value))
  }

  return {
    option,
    setTitle,
    setXAxis,
    setYAxis,
    setSeries,
    addSeries,
    removeSeries,
    setLegend,
    setTooltip,
    setGrid,
    setColor,
    updateOption,
    resetOption,
    getOption
  }
}
