import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './style.scss'
import './assets/form-focus.scss'

import App from './App.vue'
import router from './router'
import { setupStore } from './store'
import { setupRouterGuard } from './router/guard'

async function bootstrap() {
  const app = createApp(App)

  // 配置 store
  setupStore(app)

  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  // 配置路由
  app.use(router)

  // 路由守卫
  setupRouterGuard(router)

  // 配置 Element Plus
  app.use(ElementPlus)

  // 挂载应用
  app.mount('#app')
}

bootstrap()
