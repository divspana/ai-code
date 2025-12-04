<script setup lang="ts">
import { ref } from 'vue'
import { useTheme, themeColors, type ThemeType } from '../composables/useTheme'

const { currentTheme, setTheme } = useTheme()
const popoverVisible = ref(false)

// 主题列表
const themes = Object.entries(themeColors).map(([key, value]) => ({
  key: key as ThemeType,
  name: value.name,
  color: value.primary
}))

// 切换主题
const handleThemeChange = (theme: ThemeType) => {
  setTheme(theme)
  popoverVisible.value = false
}
</script>

<template>
  <el-popover
    v-model:visible="popoverVisible"
    placement="bottom"
    :width="280"
    trigger="click"
  >
    <template #reference>
      <el-button circle :style="{ backgroundColor: themeColors[currentTheme].primary, borderColor: themeColors[currentTheme].primary }">
        <el-icon color="#fff"><Brush /></el-icon>
      </el-button>
    </template>
    
    <div class="theme-switcher">
      <h4 class="theme-title">选择主题颜色</h4>
      <div class="theme-grid">
        <div
          v-for="theme in themes"
          :key="theme.key"
          class="theme-item"
          :class="{ active: currentTheme === theme.key }"
          @click="handleThemeChange(theme.key)"
        >
          <div class="theme-color" :style="{ backgroundColor: theme.color }">
            <el-icon v-if="currentTheme === theme.key" color="#fff" :size="20">
              <Check />
            </el-icon>
          </div>
          <span class="theme-name">{{ theme.name }}</span>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.theme-switcher {
  padding: 8px;
}

.theme-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.theme-item:hover {
  background-color: #f5f7fa;
}

.theme-item.active {
  background-color: #e6f7ff;
}

.theme-color {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.theme-item:hover .theme-color {
  transform: scale(1.1);
}

.theme-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
}

.theme-item.active .theme-name {
  color: #303133;
  font-weight: 500;
}
</style>
