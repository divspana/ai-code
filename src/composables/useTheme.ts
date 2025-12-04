import { ref, watch, onMounted } from 'vue'

// 主题颜色配置
export const themeColors = {
  default: {
    name: '默认蓝',
    primary: '#1890ff',
    sidebar: '#001529',
    sidebarDark: '#002140'
  },
  green: {
    name: '清新绿',
    primary: '#52c41a',
    sidebar: '#0a3d0a',
    sidebarDark: '#0d4f0d'
  },
  purple: {
    name: '优雅紫',
    primary: '#722ed1',
    sidebar: '#1a0033',
    sidebarDark: '#2d0052'
  },
  red: {
    name: '热情红',
    primary: '#f5222d',
    sidebar: '#330008',
    sidebarDark: '#52000d'
  },
  orange: {
    name: '活力橙',
    primary: '#fa8c16',
    sidebar: '#331a00',
    sidebarDark: '#522a00'
  },
  cyan: {
    name: '科技青',
    primary: '#13c2c2',
    sidebar: '#002626',
    sidebarDark: '#003d3d'
  },
  magenta: {
    name: '玫瑰粉',
    primary: '#eb2f96',
    sidebar: '#330014',
    sidebarDark: '#520021'
  },
  gold: {
    name: '金色',
    primary: '#faad14',
    sidebar: '#332200',
    sidebarDark: '#523600'
  }
}

export type ThemeType = keyof typeof themeColors

const THEME_STORAGE_KEY = 'app-theme'

// 当前主题
const currentTheme = ref<ThemeType>('default')

/**
 * 应用主题颜色到 CSS 变量
 */
function applyTheme(theme: ThemeType) {
  const colors = themeColors[theme]
  const root = document.documentElement
  
  root.style.setProperty('--theme-primary', colors.primary)
  root.style.setProperty('--theme-sidebar', colors.sidebar)
  root.style.setProperty('--theme-sidebar-dark', colors.sidebarDark)
  
  // 同时设置 Element Plus 的主题色
  root.style.setProperty('--el-color-primary', colors.primary)
}

/**
 * 主题切换 Composable
 */
export function useTheme() {
  // 设置主题
  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme
    applyTheme(theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }

  // 获取当前主题
  const getTheme = () => currentTheme.value

  // 从 localStorage 加载主题
  const loadTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType
    if (savedTheme && themeColors[savedTheme]) {
      setTheme(savedTheme)
    } else {
      setTheme('default')
    }
  }

  // 初始化时加载主题
  onMounted(() => {
    loadTheme()
  })

  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    currentTheme,
    themeColors,
    setTheme,
    getTheme,
    loadTheme
  }
}
