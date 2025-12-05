<template>
  <div class="mixed-chart">
    <v-chart :option="mergedOption" :style="{ width, height }" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, ScatterChart, RadarChart, GaugeChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent
} from 'echarts/components'
import type { EChartsOption } from 'echarts'

// 注册所有需要的组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent
])

interface Props {
  seriesList: EChartsOption['series']  // 多个 series 数组
  width?: string
  height?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '600px',
  title: '混合图表'
})

// 合并所有 series 到一个 option 中
const mergedOption = computed<EChartsOption>(() => {
  // 收集所有 series 的名称用于图例
  const legendData: string[] = []
  const series = props.seriesList || []
  
  const seriesArray = Array.isArray(series) ? series : [series]
  seriesArray.forEach((s: any) => {
    if (s && s.name) {
      legendData.push(s.name)
    }
  })

  return {
    title: {
      text: props.title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: legendData,
      top: 'bottom'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: series
  }
})
</script>

<style scoped lang="scss">
.mixed-chart {
  width: 100%;
  height: 100%;
}
</style>
