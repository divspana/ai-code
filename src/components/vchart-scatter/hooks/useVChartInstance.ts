/**
 * VChart 实例管理 Hook
 * 负责 VChart 实例的创建、更新、销毁
 */

import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Ref } from 'vue'
import VChart from '@visactor/vchart'

export interface UseVChartInstanceOptions {
  containerRef: Ref<HTMLElement | null>
  chartData: Ref<unknown[]>
  title?: string
  pointSizeRange: [number, number]
  color: string | string[]
  enableLargeMode: boolean
  largeThreshold: number
  enableZoom: boolean
  enableBrush: boolean
  enableTooltip: boolean
  lazyLoad: boolean
  onPointClick?: (data: { point: unknown; index: number }) => void
  onBrushSelect?: (data: { points: unknown[] }) => void
  onReady?: () => void
  onRenderStats?: (stats: { totalCount: number; renderedCount: number; renderTime: number }) => void
}

export function useVChartInstance(options: UseVChartInstanceOptions) {
  const {
    containerRef,
    chartData,
    title,
    pointSizeRange,
    color,
    enableLargeMode,
    largeThreshold,
    enableZoom,
    enableBrush,
    enableTooltip,
    lazyLoad,
    onPointClick,
    onBrushSelect,
    onReady,
    onRenderStats
  } = options

  let chartInstance: VChart | null = null
  const isReady = ref(false)

  /**
   * 创建图表配置
   */
  const createSpec = () => {
    const spec = {
      type: 'scatter',
      data: [
        {
          id: 'scatterData',
          values: chartData.value
        }
      ],
      xField: 'x',
      yField: 'y',
      sizeField: 'size',
      size: pointSizeRange,
      
      // 标题
      title: title ? {
        visible: true,
        text: title
      } : undefined,
      
      // 坐标轴
      axes: [
        {
          orient: 'bottom',
          type: 'linear',
          nice: true
        },
        {
          orient: 'left',
          type: 'linear',
          nice: true
        }
      ],
      
      // 图例
      legends: {
        visible: false
      },
      
      // Tooltip
      tooltip: {
        visible: enableTooltip,
        mark: {
          content: [
            {
              key: 'x',
              value: (datum: { x: number }) => `X: ${datum.x.toFixed(2)}`
            },
            {
              key: 'y',
              value: (datum: { y: number }) => `Y: ${datum.y.toFixed(2)}`
            },
            {
              key: 'size',
              value: (datum: { size: number }) => `Value: ${datum.size.toFixed(2)}`
            }
          ]
        }
      },
      
      // 缩放
      dataZoom: enableZoom ? [
        {
          orient: 'bottom',
          start: 0,
          end: 100,
          filterMode: 'axis'
        }
      ] : undefined,
      
      // 框选
      brush: enableBrush ? {
        visible: true,
        brushType: 'rect',
        inBrush: {
          colorAlpha: 1
        },
        outOfBrush: {
          colorAlpha: 0.2
        }
      } : undefined,
      
      // 大数据模式
      large: enableLargeMode,
      largeThreshold: largeThreshold,
      
      // 颜色
      color: Array.isArray(color) ? color : [color],
      
      // 动画
      animation: chartData.value.length > 10000 ? false : true
    }

    return spec
  }

  /**
   * 初始化图表
   */
  const initChart = () => {
    if (!containerRef.value || isReady.value) return

    nextTick(() => {
      if (!containerRef.value) return

      console.log('🎨 初始化 VChart...')
      console.log(`  数据点数: ${chartData.value.length}`)
      
      const startTime = performance.now()

      try {
        chartInstance = new VChart(createSpec(), {
          dom: containerRef.value,
          mode: 'desktop-browser'
        })

        // 渲染图表
        chartInstance.renderAsync().then(() => {
          const endTime = performance.now()
          const renderTime = Math.round(endTime - startTime)
          
          isReady.value = true
          console.log(`✅ VChart 渲染完成，耗时 ${renderTime}ms`)

          if (onReady) {
            onReady()
          }

          if (onRenderStats) {
            onRenderStats({
              totalCount: chartData.value.length,
              renderedCount: chartData.value.length,
              renderTime
            })
          }
        })

        // 点击事件
        if (onPointClick) {
          chartInstance.on('click', (params: { datum: unknown }) => {
            if (params.datum) {
              onPointClick({
                point: params.datum,
                index: 0
              })
            }
          })
        }

        // 框选事件
        if (onBrushSelect && enableBrush) {
          chartInstance.on('brushEnd', (params: { selected: unknown[] }) => {
            if (params.selected && params.selected.length > 0) {
              onBrushSelect({
                points: params.selected
              })
            }
          })
        }

      } catch (error) {
        console.error('❌ VChart 初始化失败:', error)
      }
    })
  }

  /**
   * 更新图表数据
   */
  const updateChart = () => {
    if (!chartInstance || !isReady.value) return

    console.log('🔄 更新 VChart 数据...')
    
    const startTime = performance.now()
    
    chartInstance.updateData('scatterData', chartData.value)
    
    const endTime = performance.now()
    console.log(`✅ 数据更新完成，耗时 ${Math.round(endTime - startTime)}ms`)

    if (onRenderStats) {
      onRenderStats({
        totalCount: chartData.value.length,
        renderedCount: chartData.value.length,
        renderTime: Math.round(endTime - startTime)
      })
    }
  }

  /**
   * 调整图表大小
   */
  const resize = () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  }

  /**
   * 导出图片
   */
  const exportImage = (type: 'png' | 'jpeg' = 'png') => {
    if (!chartInstance) {
      console.warn('图表未初始化')
      return null
    }

    try {
      const canvas = chartInstance.getCanvas()
      if (canvas) {
        const dataURL = canvas.toDataURL(`image/${type}`)
        return dataURL
      }
    } catch (error) {
      console.error('导出图片失败:', error)
    }
    return null
  }

  /**
   * 下载图片
   */
  const downloadImage = (filename: string = 'chart', type: 'png' | 'jpeg' = 'png') => {
    const dataURL = exportImage(type)
    if (!dataURL) return

    const link = document.createElement('a')
    link.download = `${filename}.${type}`
    link.href = dataURL
    link.click()
  }

  /**
   * 获取图表实例（用于外部操作）
   */
  const getChartInstance = () => chartInstance

  /**
   * 销毁图表
   */
  const dispose = () => {
    if (chartInstance) {
      console.log('🗑️  销毁 VChart 实例')
      chartInstance.release()
      chartInstance = null
      isReady.value = false
    }
  }

  // 生命周期
  onMounted(() => {
    if (!lazyLoad) {
      nextTick(() => {
        initChart()
      })
    }
  })

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    isReady,
    initChart,
    updateChart,
    resize,
    exportImage,
    downloadImage,
    getChartInstance,
    dispose
  }
}
