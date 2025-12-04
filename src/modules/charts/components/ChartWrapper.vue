<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { 
  LineChart, 
  BarChart, 
  PieChart, 
  ScatterChart, 
  RadarChart,
  GaugeChart,
  FunnelChart,
  HeatmapChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent
} from 'echarts/components'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  FunnelChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent
])

interface Props {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'gauge' | 'funnel' | 'heatmap'
  title?: string
  data: any[]
  xAxisData?: string[]
  width?: string
  height?: string
  theme?: 'light' | 'dark'
  customOptions?: any
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px',
  theme: 'light'
})

const chartRef = ref()

// 生成图表配置
const chartOption = computed(() => {
  const baseOption: any = {
    title: {
      text: props.title,
      left: 'center',
      textStyle: {
        color: props.theme === 'dark' ? '#fff' : '#333'
      }
    },
    tooltip: {
      trigger: props.type === 'pie' ? 'item' : 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#333',
      textStyle: {
        color: '#fff'
      }
    },
    legend: {
      top: 'bottom',
      textStyle: {
        color: props.theme === 'dark' ? '#fff' : '#333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: { title: '保存为图片' },
        dataZoom: { title: { zoom: '区域缩放', back: '还原' } },
        restore: { title: '还原' }
      }
    }
  }

  // 根据图表类型生成配置
  switch (props.type) {
    case 'line':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: props.xAxisData || [],
          axisLine: { lineStyle: { color: props.theme === 'dark' ? '#fff' : '#333' } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: props.theme === 'dark' ? '#fff' : '#333' } }
        },
        series: props.data.map(item => ({
          ...item,
          type: 'line',
          smooth: true,
          emphasis: { focus: 'series' }
        }))
      }

    case 'bar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: props.xAxisData || [],
          axisLine: { lineStyle: { color: props.theme === 'dark' ? '#fff' : '#333' } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: props.theme === 'dark' ? '#fff' : '#333' } }
        },
        series: props.data.map(item => ({
          ...item,
          type: 'bar',
          emphasis: { focus: 'series' }
        }))
      }

    case 'pie':
      return {
        ...baseOption,
        series: [{
          type: 'pie',
          radius: '60%',
          data: props.data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            color: props.theme === 'dark' ? '#fff' : '#333'
          }
        }]
      }

    case 'scatter':
      return {
        ...baseOption,
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: props.theme === 'dark' ? '#fff' : '#333' } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: props.theme === 'dark' ? '#fff' : '#333' } }
        },
        series: props.data.map(item => ({
          ...item,
          type: 'scatter',
          symbolSize: 10
        }))
      }

    case 'radar':
      return {
        ...baseOption,
        radar: {
          indicator: props.xAxisData?.map(name => ({ name, max: 100 })) || [],
          axisName: {
            color: props.theme === 'dark' ? '#fff' : '#333'
          }
        },
        series: [{
          type: 'radar',
          data: props.data
        }]
      }

    case 'gauge':
      return {
        ...baseOption,
        series: [{
          type: 'gauge',
          data: props.data,
          detail: {
            valueAnimation: true,
            formatter: '{value}%'
          }
        }]
      }

    case 'funnel':
      return {
        ...baseOption,
        series: [{
          type: 'funnel',
          data: props.data,
          label: {
            color: props.theme === 'dark' ? '#fff' : '#333'
          }
        }]
      }

    case 'heatmap':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: props.xAxisData || [],
          axisLine: { lineStyle: { color: props.theme === 'dark' ? '#fff' : '#333' } }
        },
        yAxis: {
          type: 'category',
          data: props.data[0]?.yAxisData || [],
          axisLine: { lineStyle: { color: props.theme === 'dark' ? '#fff' : '#333' } }
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          textStyle: {
            color: props.theme === 'dark' ? '#fff' : '#333'
          }
        },
        series: [{
          type: 'heatmap',
          data: props.data[0]?.data || [],
          label: {
            show: true,
            color: props.theme === 'dark' ? '#fff' : '#333'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }

    default:
      return baseOption
  }
})

// 合并自定义配置
const finalOption = computed(() => {
  if (props.customOptions) {
    return { ...chartOption.value, ...props.customOptions }
  }
  return chartOption.value
})

// 导出图表实例方法
const getChartInstance = () => {
  return chartRef.value?.chart
}

defineExpose({
  getChartInstance
})
</script>

<template>
  <div class="chart-wrapper" :style="{ width, height }">
    <VChart
      ref="chartRef"
      :option="finalOption"
      :theme="theme"
      autoresize
    />
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
}
</style>
