# ECharts 图表模块

## 功能

- 8 种图表类型（折线、柱状、饼图、散点、雷达、仪表盘、漏斗、热力图）
- 可视化配置器
- 主题切换
- 响应式支持

## 文件结构

```
charts/
├── index.vue                  # 图表配置器页面
├── components/
│   └── ChartWrapper.vue      # 图表封装组件
└── README.md
```

## 路由

- 路径: `/charts`
- 名称: `Charts`

## 使用示例

```vue
<ChartWrapper type="line" title="销售数据" :data="chartData" :x-axis-data="xAxisData" />
```
