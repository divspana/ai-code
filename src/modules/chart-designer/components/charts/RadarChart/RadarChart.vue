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
import { radarChartPropsDefaults, defaultRadarChartOption } from './props'
import type { RadarChartProps } from './props'

use([
  CanvasRenderer,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent
])

const props = withDefaults(defineProps<RadarChartProps>(), radarChartPropsDefaults)

const chartOption = computed(() => props.option || defaultRadarChartOption)
</script>
