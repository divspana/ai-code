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
import { scatterChartPropsDefaults, defaultScatterChartOption } from './props'
import type { ScatterChartProps } from './props'

use([
  CanvasRenderer,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const props = withDefaults(defineProps<ScatterChartProps>(), scatterChartPropsDefaults)

const chartOption = computed(() => props.option || defaultScatterChartOption)
</script>
