<template>
  <div class="playground-view">
    <div class="playground-sidebar">
      <div class="sidebar-header">
        <h2>组件示例</h2>
        <el-input v-model="searchText" placeholder="搜索组件..." :prefix-icon="Search" clearable />
      </div>

      <div class="sidebar-content">
        <el-menu :default-active="currentExampleId" @select="handleSelectExample">
          <el-menu-item-group
            v-for="category in categories"
            :key="category"
            :title="getCategoryName(category)"
          >
            <el-menu-item
              v-for="example in getFilteredExamples(category)"
              :key="example.id"
              :index="example.id"
            >
              <span>{{ example.title }}</span>
            </el-menu-item>
          </el-menu-item-group>
        </el-menu>
      </div>
    </div>

    <div class="playground-main">
      <PlaygroundContainer
        v-if="currentExample"
        :key="currentExample.id"
        :title="currentExample.title"
        :description="currentExample.description"
        :initial-code="currentExample.code"
      />
      <div v-else class="empty-state">
        <el-empty description="请选择一个示例开始体验" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import PlaygroundContainer from '@/components/Playground/PlaygroundContainer.vue'
import {
  playgroundExamples,
  getAllCategories,
  getExampleById,
  type PlaygroundExample
} from '@/config/playground-examples'

const searchText = ref('')
const currentExampleId = ref('')
const currentExample = ref<PlaygroundExample | undefined>()

const categories = computed(() => getAllCategories())

const categoryNames: Record<string, string> = {
  upload: '上传组件',
  basic: '基础组件',
  form: '表单组件',
  data: '数据展示',
  feedback: '反馈组件',
  navigation: '导航组件',
  others: '其他组件'
}

const getCategoryName = (category: string) => {
  return categoryNames[category] || category
}

const getFilteredExamples = (category: string) => {
  return playgroundExamples.filter(example => {
    const matchCategory = example.category === category
    const matchSearch = searchText.value
      ? example.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
        example.description.toLowerCase().includes(searchText.value.toLowerCase()) ||
        example.tags?.some(tag => tag.toLowerCase().includes(searchText.value.toLowerCase()))
      : true
    return matchCategory && matchSearch
  })
}

const handleSelectExample = (id: string) => {
  currentExampleId.value = id
  currentExample.value = getExampleById(id)
}

onMounted(() => {
  // 默认选择第一个示例
  if (playgroundExamples.length > 0) {
    handleSelectExample(playgroundExamples[0].id)
  }
})
</script>

<style scoped lang="scss">
.playground-view {
  display: flex;
  height: calc(100vh - 60px);
  background: #f5f7fa;
}

.playground-sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;

  h2 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;

  :deep(.el-menu) {
    border-right: none;
  }

  :deep(.el-menu-item-group__title) {
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    color: #909399;
  }

  :deep(.el-menu-item) {
    height: 40px;
    line-height: 40px;
    font-size: 14px;

    &:hover {
      background: #f5f7fa;
    }

    &.is-active {
      background: #ecf5ff;
      color: #409eff;
    }
  }
}

.playground-main {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fff;
  border-radius: 8px;
}
</style>
