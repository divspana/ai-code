# 表单引擎模块

## 功能

- Schema 驱动的动态表单
- 字段联动（禁用、显隐、必填）
- API 数据源支持
- 多种字段类型

## 文件结构

```
form-engine/
├── index.vue                    # 演示页面
├── components/
│   ├── FormEngine.vue          # 表单引擎核心
│   ├── types.ts                # 类型定义
│   └── fields/                 # 字段组件
│       ├── InputField.vue
│       ├── TextareaField.vue
│       ├── SelectField.vue
│       ├── RadioField.vue
│       ├── CheckboxField.vue
│       ├── NumberField.vue
│       ├── DateField.vue
│       └── SwitchField.vue
└── README.md
```

## 路由

- 路径: `/form-engine`
- 名称: `FormEngine`
