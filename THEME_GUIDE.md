# 主题颜色切换功能说明

## 功能概述

项目已集成主题颜色切换功能，支持 8 种预设主题颜色，用户可以根据个人喜好自由切换，主题偏好会自动保存到浏览器本地存储。

## 可用主题

| 主题名称 | 主色调  | 侧边栏颜色 |
| -------- | ------- | ---------- |
| 默认蓝   | #1890ff | #001529    |
| 清新绿   | #52c41a | #0a3d0a    |
| 优雅紫   | #722ed1 | #1a0033    |
| 热情红   | #f5222d | #330008    |
| 活力橙   | #fa8c16 | #331a00    |
| 科技青   | #13c2c2 | #002626    |
| 玫瑰粉   | #eb2f96 | #330014    |
| 金色     | #faad14 | #332200    |

## 使用方式

### 1. 切换主题

点击顶部导航栏右侧的彩色圆形按钮，在弹出的主题选择器中选择喜欢的颜色主题。

### 2. 主题持久化

选择的主题会自动保存到浏览器的 localStorage，下次访问时会自动应用上次选择的主题。

## 技术实现

### 文件结构

```
src/
├── composables/
│   └── useTheme.ts           # 主题管理 Composable
├── components/
│   └── ThemeSwitcher.vue     # 主题切换器组件
├── layout/
│   └── MainLayout.vue        # 应用主题到布局
└── style.css                 # CSS 变量定义
```

### 核心代码

#### 1. 主题 Composable (`src/composables/useTheme.ts`)

```typescript
import { useTheme } from '@/composables/useTheme'

const { currentTheme, setTheme, themeColors } = useTheme()

// 切换主题
setTheme('green')

// 获取当前主题
console.log(currentTheme.value)
```

#### 2. CSS 变量

主题通过 CSS 变量实现，主要变量包括：

```css
:root {
  --theme-primary: #1890ff; /* 主色调 */
  --theme-sidebar: #001529; /* 侧边栏背景色 */
  --theme-sidebar-dark: #002140; /* 侧边栏深色背景 */
  --el-color-primary: #1890ff; /* Element Plus 主题色 */
}
```

#### 3. 应用主题

在组件中使用 CSS 变量：

```css
.sidebar {
  background: var(--theme-sidebar, #001529);
}

.active-menu {
  background-color: var(--theme-primary, #1890ff);
}
```

## 自定义主题

### 添加新主题

编辑 `src/composables/useTheme.ts`，在 `themeColors` 对象中添加新主题：

```typescript
export const themeColors = {
  // ... 现有主题
  custom: {
    name: '自定义主题',
    primary: '#your-color',
    sidebar: '#your-sidebar-color',
    sidebarDark: '#your-sidebar-dark-color'
  }
}
```

### 修改现有主题

直接修改 `themeColors` 对象中对应主题的颜色值：

```typescript
default: {
  name: '默认蓝',
  primary: '#1890ff',  // 修改这里
  sidebar: '#001529',
  sidebarDark: '#002140'
}
```

## 主题应用范围

当前主题颜色会应用到以下元素：

### 1. 侧边栏

- ✅ 侧边栏背景色
- ✅ Logo 区域背景色
- ✅ 菜单背景色

### 2. 菜单项

- ✅ 激活菜单项背景色

### 3. Element Plus 组件

- ✅ 按钮主色调
- ✅ 链接颜色
- ✅ 选中状态颜色
- ✅ 其他使用主题色的组件

### 4. 主题切换器

- ✅ 切换按钮颜色随主题变化

## API 参考

### useTheme()

主题管理 Composable，提供以下功能：

#### 返回值

```typescript
{
  currentTheme: Ref<ThemeType>,           // 当前主题
  themeColors: ThemeColors,               // 所有主题配置
  setTheme: (theme: ThemeType) => void,  // 设置主题
  getTheme: () => ThemeType,              // 获取当前主题
  loadTheme: () => void                   // 从 localStorage 加载主题
}
```

#### 主题类型

```typescript
type ThemeType = 'default' | 'green' | 'purple' | 'red' | 'orange' | 'cyan' | 'magenta' | 'gold'
```

#### 主题配置

```typescript
interface ThemeConfig {
  name: string // 主题名称
  primary: string // 主色调
  sidebar: string // 侧边栏背景色
  sidebarDark: string // 侧边栏深色背景
}
```

## 在新组件中使用主题

### 1. 导入 Composable

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { currentTheme, themeColors } = useTheme()
</script>
```

### 2. 使用主题颜色

#### 方式一：通过 CSS 变量

```vue
<style scoped>
.my-component {
  color: var(--theme-primary);
  background: var(--theme-sidebar);
}
</style>
```

#### 方式二：通过动态样式

```vue
<template>
  <div :style="{ color: themeColors[currentTheme].primary }">主题颜色文本</div>
</template>
```

## 注意事项

1. **CSS 变量兼容性**：现代浏览器都支持 CSS 变量，IE 不支持
2. **主题切换动画**：已添加 0.3s 的过渡动画，使主题切换更平滑
3. **localStorage 存储**：主题偏好存储在 `app-theme` 键下
4. **默认主题**：如果 localStorage 中没有保存的主题，默认使用"默认蓝"主题

## 扩展建议

### 1. 添加暗黑模式

可以扩展主题系统支持暗黑模式：

```typescript
export const darkTheme = {
  background: '#1a1a1a',
  text: '#ffffff'
  // ...
}
```

### 2. 自定义颜色选择器

可以添加颜色选择器让用户自定义主题颜色：

```vue
<el-color-picker v-model="customColor" @change="applyCustomTheme" />
```

### 3. 主题预览

在切换主题前预览效果：

```vue
<div class="theme-preview" :style="previewStyle">
  预览内容
</div>
```

## 故障排除

### 主题没有生效？

1. 检查浏览器控制台是否有错误
2. 确认 CSS 变量是否正确定义
3. 清除浏览器缓存重试

### 主题没有保存？

1. 检查浏览器是否禁用了 localStorage
2. 查看浏览器控制台的 Application/Storage 标签
3. 确认 `THEME_STORAGE_KEY` 的值

### 颜色显示不正确？

1. 检查颜色值格式是否正确（应为十六进制）
2. 确认 CSS 变量名称是否匹配
3. 检查是否有其他样式覆盖了主题颜色
