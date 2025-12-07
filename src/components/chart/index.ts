/**
 * 图表组件统一导出
 */

import LineChart from './LineChart'
import BarChart from './BarChart'
import PieChart from './PieChart'
import ScatterChart from './ScatterChart'
import RadarChart from './RadarChart'
import GaugeChart from './GaugeChart'

// 导出组件
export {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart
}

// 导出类型
export type { LineChartProps } from './LineChart'
export type { BarChartProps } from './BarChart'
export type { PieChartProps } from './PieChart'
export type { ScatterChartProps } from './ScatterChart'
export type { RadarChartProps } from './RadarChart'
export type { GaugeChartProps } from './GaugeChart'

// 导出默认配置
export {
  lineChartPropsDefaults,
  defaultLineChartOption
} from './LineChart'

export {
  barChartPropsDefaults,
  defaultBarChartOption
} from './BarChart'

export {
  pieChartPropsDefaults,
  defaultPieChartOption
} from './PieChart'

export {
  scatterChartPropsDefaults,
  defaultScatterChartOption
} from './ScatterChart'

export {
  radarChartPropsDefaults,
  defaultRadarChartOption
} from './RadarChart'

export {
  gaugeChartPropsDefaults,
  defaultGaugeChartOption
} from './GaugeChart'

// 导出 Hooks
export * from './composables'

// 图表组件映射
export const ChartComponents = {
  line: LineChart,
  bar: BarChart,
  pie: PieChart,
  scatter: ScatterChart,
  radar: RadarChart,
  gauge: GaugeChart
}
