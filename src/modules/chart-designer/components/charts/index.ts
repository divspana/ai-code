/**
 * 图表组件统一导出
 */

import LineChart from './LineChart.vue'
import BarChart from './BarChart.vue'
import PieChart from './PieChart.vue'
import ScatterChart from './ScatterChart.vue'
import RadarChart from './RadarChart.vue'
import GaugeChart from './GaugeChart.vue'

export {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart
}

// 图表组件映射
export const ChartComponents = {
  line: LineChart,
  bar: BarChart,
  pie: PieChart,
  scatter: ScatterChart,
  radar: RadarChart,
  gauge: GaugeChart
}
