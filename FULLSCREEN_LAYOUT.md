# 全屏布局说明

## 概述

项目已配置为全屏 Web 应用，无任何留白，充分利用整个浏览器视口。

## 布局结构

```
┌─────────────────────────────────────────────────────────┐
│ 侧边栏 │           顶部导航栏 (60px)                    │
│ (可折叠)├─────────────────────────────────────────────────┤
│        │                                                │
│  菜单  │                                                │
│        │           主内容区域                            │
│        │        (自动填充剩余高度)                        │
│        │                                                │
│        │                                                │
└────────┴────────────────────────────────────────────────┘
```

## 关键配置

### 1. 全局样式 (`src/style.css`)

```css
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

### 2. App 组件 (`src/App.vue`)

```css
#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
```

### 3. 主布局 (`src/layout/MainLayout.vue`)

#### 容器

```css
.layout-container {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

#### 侧边栏

```css
.layout-aside {
  height: 100vh;
  /* 展开: 200px, 折叠: 64px */
}
```

#### 主内容区

```css
.layout-main {
  padding: 0;
  margin: 0;
  overflow-y: auto;
  height: calc(100vh - 60px); /* 减去顶部导航栏高度 */
}
```

### 4. 页面组件

#### TodoList (`src/view/TodoList.vue`)

```css
.todo-container {
  padding: 0;
  height: 100%;
  background: #fff;
}

.todo-card {
  width: 100%;
  height: 100%;
  margin: 0;
  border-radius: 0;
  border: none;
}
```

#### FormEngineDemo (`src/view/FormEngineDemo.vue`)

```css
.demo-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}
```

## 尺寸说明

| 元素       | 高度               | 宽度                       |
| ---------- | ------------------ | -------------------------- |
| 整体视口   | 100vh              | 100vw                      |
| 侧边栏     | 100vh              | 200px (展开) / 64px (折叠) |
| 顶部导航栏 | 60px               | 自适应                     |
| Logo 区域  | 60px               | 侧边栏宽度                 |
| 主内容区   | calc(100vh - 60px) | 自适应                     |

## 滚动行为

- **html/body**: `overflow: hidden` - 禁止滚动
- **#app**: `overflow: hidden` - 禁止滚动
- **layout-container**: `overflow: hidden` - 禁止滚动
- **layout-main**: `overflow-y: auto` - 垂直滚动
- **页面内容**: 根据需要设置滚动

## 响应式设计

### 侧边栏折叠

- 展开宽度: 200px
- 折叠宽度: 64px
- 过渡动画: 0.3s

### 内容区域自适应

主内容区域会自动调整宽度以填充侧边栏之外的空间。

## 无留白设计要点

1. **所有容器的 margin 和 padding 都设为 0**
2. **使用 100vh/100vw 确保填满视口**
3. **overflow: hidden 防止出现滚动条**
4. **border-radius: 0 移除圆角**
5. **border: none 移除边框**

## 页面内容建议

### 需要内边距的页面

如 FormEngineDemo，在容器内部添加 padding:

```css
.demo-container {
  padding: 20px;
  height: 100%;
}
```

### 不需要内边距的页面

如 TodoList，使用卡片组件自带的内边距:

```css
:deep(.el-card__body) {
  padding: 20px;
}
```

## 常见问题

### Q: 页面内容超出怎么办？

A: 在需要滚动的容器上设置 `overflow-y: auto`

### Q: 如何调整侧边栏宽度？

A: 修改 `MainLayout.vue` 中的 `el-aside` 的 `:width` 属性

### Q: 如何调整顶部导航栏高度？

A: 修改 `MainLayout.vue` 中的 `.layout-header` 高度和 `.layout-main` 的 `calc()` 计算

### Q: 页面底部被截断？

A: 确保父容器设置了 `height: 100%` 和 `overflow-y: auto`

## 浏览器兼容性

- ✅ Chrome/Edge (最新版)
- ✅ Firefox (最新版)
- ✅ Safari (最新版)
- ✅ 移动端浏览器

注意: 使用了 `100vh` 在某些移动浏览器上可能有地址栏的影响。
