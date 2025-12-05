<template>
  <v-chart :option="chartOption" :style="{ width, height }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import type { EChartsOption } from 'echarts'

use([
  CanvasRenderer,
  LineChart,
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

// 默认配置
const defaultOption: EChartsOption = {
  title: {
    text: '折线图'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['数据1', '数据2']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '数据1',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: '数据2',
      type: 'line',
      data: [220, 182, 191, 234, 290, 330, 310]
    }
  ]
}

const chartOption = computed(() => props.option || defaultOption)

// 导出默认配置供外部使用
export const getDefaultOption = (): EChartsOption => defaultOption
</script>
