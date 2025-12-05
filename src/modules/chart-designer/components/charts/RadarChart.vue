<template>
  <v-chart :option="chartOption" :style="{ width, height }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent
} from 'echarts/components'
import type { EChartsOption } from 'echarts'

use([
  CanvasRenderer,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent
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
    text: '雷达图'
  },
  tooltip: {},
  legend: {
    data: ['预算', '实际']
  },
  radar: {
    indicator: [
      { name: '销售', max: 6500 },
      { name: '管理', max: 16000 },
      { name: '技术', max: 30000 },
      { name: '客服', max: 38000 },
      { name: '研发', max: 52000 },
      { name: '市场', max: 25000 }
    ]
  },
  series: [
    {
      name: '预算 vs 实际',
      type: 'radar',
      data: [
        {
          value: [4200, 3000, 20000, 35000, 50000, 18000],
          name: '预算'
        },
        {
          value: [5000, 14000, 28000, 26000, 42000, 21000],
          name: '实际'
        }
      ]
    }
  ]
}

const chartOption = computed(() => props.option || defaultOption)

export const getDefaultOption = (): EChartsOption => defaultOption
</script>
