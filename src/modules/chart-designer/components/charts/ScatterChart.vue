<template>
  <v-chart :option="chartOption" :style="{ width, height }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import type { EChartsOption } from 'echarts'

use([
  CanvasRenderer,
  ScatterChart,
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
    text: '散点图'
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    data: ['数据集1', '数据集2']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value'
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '数据集1',
      type: 'scatter',
      data: [[10, 20], [20, 30], [30, 25], [40, 35], [50, 45]]
    },
    {
      name: '数据集2',
      type: 'scatter',
      data: [[15, 25], [25, 35], [35, 30], [45, 40], [55, 50]]
    }
  ]
}

const chartOption = computed(() => props.option || defaultOption)

export const getDefaultOption = (): EChartsOption => defaultOption
</script>
