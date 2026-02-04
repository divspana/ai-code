/**
 * 图表配置 Hook
 * 负责生成 ECharts 配置对象
 */

import { computed } from 'vue'
import type { Ref } from 'vue'
import type { EChartsOption } from 'echarts'

export interface UseChartOptionsParams {
  title?: string
  enableZoom: Ref<boolean> | boolean
  enableBrush: Ref<boolean> | boolean
  enableLargeMode: boolean
  largeThreshold: number
  splitIntoSeries: (symbolSize: number | ((data: unknown) => number)) => unknown[]
  symbolSize: number | ((data: unknown) => number)
}

export function useChartOptions(params: UseChartOptionsParams) {
  const {
    title,
    enableZoom,
    enableBrush,
    splitIntoSeries,
    symbolSize
  } = params

  /**
   * 获取 enableZoom 的值
   */
  const enableZoomValue = computed(() => {
    return typeof enableZoom === 'object' && 'value' in enableZoom
      ? enableZoom.value
      : enableZoom
  })

  /**
   * 获取 enableBrush 的值
   */
  const enableBrushValue = computed(() => {
    return typeof enableBrush === 'object' && 'value' in enableBrush
      ? enableBrush.value
      : enableBrush
  })

  /**
   * 生成 ECharts 配置
   */
  const getChartOption = (): EChartsOption => {
    const seriesArray = splitIntoSeries(symbolSize)

    const option: EChartsOption = {
      title: title
        ? {
            text: title,
            left: 'center'
          }
        : undefined,
      tooltip: {
        trigger: 'item',
        formatter: (params: { data: { value: number[]; name?: string } }) => {
          const data = params.data
          return `X: ${data.value[0]}<br/>Y: ${data.value[1]}${
            data.name ? `<br/>Name: ${data.name}` : ''
          }`
        }
      },
      grid: {
        left: '3%',
        right: '7%',
        bottom: '7%',
        top: title ? '15%' : '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        scale: true
      },
      yAxis: {
        type: 'value',
        scale: true
      },
      dataZoom: enableZoomValue.value
        ? [
            {
              type: 'inside',
              xAxisIndex: 0,
              filterMode: 'none'
            },
            {
              type: 'slider',
              xAxisIndex: 0,
              filterMode: 'none',
              bottom: 25
            }
          ]
        : undefined,
      brush: enableBrushValue.value
        ? {
            toolbox: ['rect', 'polygon', 'keep', 'clear'],
            brushMode: 'multiple',
            transformable: true,
            throttleType: 'debounce',
            throttleDelay: 300,
            seriesIndex: 'all'
          }
        : undefined,
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
          dataZoom: enableZoomValue.value
            ? {
                show: true,
                yAxisIndex: false,
                title: {
                  zoom: '区域缩放',
                  back: '还原缩放'
                }
              }
            : undefined,
          brush: enableBrushValue.value
            ? {
                show: true,
                type: ['rect', 'polygon', 'keep', 'clear'],
                title: {
                  rect: '矩形选择',
                  polygon: '圈选',
                  keep: '保持选择',
                  clear: '清除选择'
                }
              }
            : undefined,
          restore: {
            show: true,
            title: '还原'
          },
          saveAsImage: {
            show: true,
            title: '保存为图片',
            pixelRatio: 2
          }
        }
      },
      series: seriesArray
    }

    return option
  }

  return {
    getChartOption
  }
}
