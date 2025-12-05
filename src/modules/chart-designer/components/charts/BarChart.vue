<template>
  <v-chart :option="chartOption" :style="{ width, height }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import type { EChartsOption } from 'echarts'

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

interface Props {
  option?: EChartsOption
  width?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px'
})

const defaultOption: EChartsOption = {
  title: {
    text: '柱状图'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    data: ['销量', '利润']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '销量',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110, 130]
    },
    {
      name: '利润',
      type: 'bar',
      data: [60, 100, 75, 40, 35, 55, 65]
    }
  ]
}

const chartOption = computed(() => props.option || defaultOption)

export const getDefaultOption = (): EChartsOption => defaultOption
</script>
