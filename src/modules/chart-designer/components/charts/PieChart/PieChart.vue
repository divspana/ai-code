<template>
  <v-chart :option="chartOption" :style="{ width, height }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { pieChartPropsDefaults, defaultPieChartOption } from './props'
import type { PieChartProps } from './props'

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

const props = withDefaults(defineProps<PieChartProps>(), pieChartPropsDefaults)

const chartOption = computed(() => props.option || defaultPieChartOption)
</script>
