# 路由菜单使用指南

## 项目结构

```
src/
├── layout/
│   └── MainLayout.vue        # 主布局（包含侧边栏菜单）
├── router/
│   └── index.ts              # 路由配置
├── view/
│   ├── TodoList.vue          # 待办事项页面
│   └── FormEngineDemo.vue    # 表单引擎页面
├── App.vue                   # 根组件
└── main.ts                   # 入口文件（注册路由）
```

## 功能特性

### 1. 侧边栏菜单

- ✅ 可折叠/展开
- ✅ 图标 + 文字显示
- ✅ 当前路由高亮
- ✅ 深色主题
- ✅ 平滑过渡动画

### 2. 路由配置

- ✅ 待办事项 (`/todo-list`)
- ✅ 表单引擎 (`/form-engine`)
- ✅ 默认重定向到待办事项

### 3. 布局特性

- ✅ 顶部导航栏显示当前页面标题
- ✅ 主内容区域自适应
- ✅ 路由切换动画
- ✅ 响应式设计

## 使用说明

### 启动项目

```bash
npm run dev
```

### 菜单切换

点击左侧菜单项即可切换页面：

- **待办事项** - 管理你的 Todo List
- **表单引擎** - 体验 Schema 驱动的表单

### 折叠侧边栏

点击侧边栏底部的折叠按钮，可以收起/展开菜单。

## 添加新页面

### 1. 创建页面组件

在 `src/view/` 目录下创建新的 Vue 组件，例如 `NewPage.vue`

### 2. 配置路由

编辑 `src/router/index.ts`，添加路由配置：

```typescript
{
  path: '/new-page',
  name: 'NewPage',
  component: () => import('../view/NewPage.vue'),
  meta: {
    title: '新页面',
    icon: 'Setting'  // Element Plus 图标名称
  }
}
```

### 3. 添加菜单项

编辑 `src/layout/MainLayout.vue`，在 `menuItems` 中添加菜单项：

```typescript
const menuItems = [
  // ... 现有菜单
  {
    path: '/new-page',
    title: '新页面',
    icon: Setting // 需要先导入图标
  }
]
```

## 路由元信息

每个路由可以配置 `meta` 信息：

```typescript
meta: {
  title: '页面标题',  // 显示在顶部导航栏
  icon: 'Document'    // 菜单图标（Element Plus Icons）
}
```

## 可用图标

项目已全局注册 Element Plus 图标，常用图标包括：

- `Document` - 文档
- `Edit` - 编辑
- `Setting` - 设置
- `User` - 用户
- `List` - 列表
- `Calendar` - 日历
- `DataAnalysis` - 数据分析
- `Tools` - 工具

更多图标请查看：[Element Plus Icons](https://element-plus.org/zh-CN/component/icon.html)

## 布局说明

### 侧边栏

- 宽度：展开 200px，折叠 64px
- 背景色：深色主题 (#001529)
- Logo 区域：60px 高度
- 菜单区域：自适应高度
- 折叠按钮：48px 高度

### 顶部导航栏

- 高度：60px
- 背景色：白色
- 左侧：当前页面标题
- 右侧：欢迎文字（可自定义）

### 主内容区

- 背景色：#f0f2f5
- 自动滚动
- 内边距由各页面自行控制

## 路由过渡动画

页面切换时有淡入淡出 + 位移的过渡效果：

- 进入：从左侧淡入
- 离开：向右侧淡出
- 持续时间：0.3s

## 注意事项

1. **页面样式**：各页面组件应使用 `min-height: 100%` 而非 `100vh`，以适应布局容器
2. **背景色**：建议使用 `#f0f2f5` 与整体布局保持一致
3. **图标导入**：在 `MainLayout.vue` 中使用图标前需要先导入
4. **路由懒加载**：使用 `() => import()` 实现按需加载，提升性能

## 自定义样式

### 修改侧边栏颜色

编辑 `src/layout/MainLayout.vue`：

```css
.layout-aside {
  background: #001529; /* 修改此处 */
}
```

### 修改激活菜单颜色

```css
:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important; /* 修改此处 */
}
```

### 修改顶部导航栏

```css
.layout-header {
  background: #fff; /* 修改背景色 */
}
```
