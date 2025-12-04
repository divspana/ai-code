# Wafer Map 模块

## 功能

- 晶圆图可视化
- 缩放、平移、框选
- 大数据性能优化
- 框选区域放大显示

## 文件结构

```
wafer-map/
├── index.vue                  # Wafer Map 演示页面
├── components/
│   └── WaferMap.vue          # Wafer Map 组件
└── README.md
```

## 路由

- 路径: `/wafer-map`
- 名称: `WaferMap`

## 性能优化

- 防抖渲染
- 自适应采样
- 视口裁剪
- 颜色分组批量渲染
