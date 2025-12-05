<template>
  <v-chart :option="chartOption" :style="{ width, height }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GaugeChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent } from 'echarts/components'
import type { EChartsOption } from 'echarts'

use([
  CanvasRenderer,
  GaugeChart,
  TitleComponent,
  TooltipComponent
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
    text: '仪表盘'
  },
  tooltip: {
    formatter: '{a} <br/>{b} : {c}%'
  },
  series: [
    {
      name: '业务指标',
      type: 'gauge',
      detail: {
        formatter: '{value}%'
      },
      data: [{ value: 75, name: '完成率' }]
    }
  ]
}

const chartOption = computed(() => props.option || defaultOption)
</script>
