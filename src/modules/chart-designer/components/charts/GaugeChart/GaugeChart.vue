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
import { gaugeChartPropsDefaults, defaultGaugeChartOption } from './props'
import type { GaugeChartProps } from './props'

use([
  CanvasRenderer,
  GaugeChart,
  TitleComponent,
  TooltipComponent
])

const props = withDefaults(defineProps<GaugeChartProps>(), gaugeChartPropsDefaults)

const chartOption = computed(() => props.option || defaultGaugeChartOption)
</script>
