/**
 * 箱线图配置 Hook
 * 负责生成 ECharts 配置对象
 */

import { computed } from 'vue'
import type { Ref } from 'vue'
import type { EChartsOption } from 'echarts'

export interface UseBoxPlotOptionsParams {
  title?: string
  enableZoom: Ref<boolean> | boolean
  enableDataView: Ref<boolean> | boolean
  categories: string[]
  splitIntoSeries: () => unknown[]
}

export function useBoxPlotOptions(params: UseBoxPlotOptionsParams) {
  const {
    title,
    enableZoom,
    enableDataView,
    categories,
    splitIntoSeries
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
   * 获取 enableDataView 的值
   */
  const enableDataViewValue = computed(() => {
    return typeof enableDataView === 'object' && 'value' in enableDataView
      ? enableDataView.value
      : enableDataView
  })

  /**
   * 生成 ECharts 配置
   */
  const getChartOption = (): EChartsOption => {
    const seriesArray = splitIntoSeries()

    const option: EChartsOption = {
      title: title
        ? {
            text: title,
            left: 'center'
          }
        : undefined,
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: title ? '15%' : '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        boundaryGap: true,
        nameGap: 30,
        splitArea: {
          show: false
        },
        axisLabel: {
          rotate: 45,
          interval: 0
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        name: '值',
        splitArea: {
          show: true
        }
      },
      dataZoom: enableZoomValue.value
        ? [
            {
              type: 'inside',
              xAxisIndex: 0
            },
            {
              type: 'slider',
              xAxisIndex: 0,
              bottom: 25
            }
          ]
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
          dataView: enableDataViewValue.value
            ? {
                show: true,
                title: '数据视图',
                readOnly: false
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
