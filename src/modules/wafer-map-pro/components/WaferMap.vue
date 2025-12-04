<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

interface Die {
  x: number
  y: number
  bin: number
  value?: number
}

interface Props {
  data: Die[]
  width?: number
  height?: number
  colorMap?: Record<number, string>
  showGrid?: boolean
  enableSelection?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 800,
  showGrid: true,
  enableSelection: true,
  colorMap: () => ({
    0: '#e0e0e0',  // 未测试
    1: '#4caf50',  // Pass
    2: '#f44336',  // Fail
    3: '#ff9800',  // Warning
    4: '#2196f3',  // Special
  })
})

const emit = defineEmits<{
  'select': [dies: Die[]]
  'click': [die: Die | null]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const overlayCanvasRef = ref<HTMLCanvasElement>()
const containerRef = ref<HTMLDivElement>()

// 视图状态
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// 框选状态
const isSelecting = ref(false)
const selectionStart = ref({ x: 0, y: 0 })
const selectionEnd = ref({ x: 0, y: 0 })

// 计算 die 的尺寸和范围
const dieSize = computed(() => {
  if (props.data.length === 0) return { width: 10, height: 10 }
  
  const maxX = Math.max(...props.data.map(d => d.x))
  const maxY = Math.max(...props.data.map(d => d.y))
  const minX = Math.min(...props.data.map(d => d.x))
  const minY = Math.min(...props.data.map(d => d.y))
  
  const rangeX = maxX - minX + 1
  const rangeY = maxY - minY + 1
  
  const dieWidth = Math.max(2, Math.floor(props.width * 0.8 / rangeX))
  const dieHeight = Math.max(2, Math.floor(props.height * 0.8 / rangeY))
  
  return {
    width: Math.min(dieWidth, dieHeight),
    height: Math.min(dieWidth, dieHeight),
    minX,
    minY,
    maxX,
    maxY,
    rangeX,
    rangeY
  }
})

// 坐标转换
const worldToScreen = (x: number, y: number) => {
  const { width: dw, height: dh, minX, minY } = dieSize.value
  const centerX = props.width / 2
  const centerY = props.height / 2
  
  const worldX = (x - minX) * dw * scale.value
  const worldY = (y - minY) * dh * scale.value
  
  return {
    x: worldX + offsetX.value + centerX - (dieSize.value.rangeX * dw * scale.value) / 2,
    y: worldY + offsetY.value + centerY - (dieSize.value.rangeY * dh * scale.value) / 2
  }
}

const screenToWorld = (screenX: number, screenY: number) => {
  const { width: dw, height: dh, minX, minY } = dieSize.value
  const centerX = props.width / 2
  const centerY = props.height / 2
  
  const worldX = (screenX - offsetX.value - centerX + (dieSize.value.rangeX * dw * scale.value) / 2) / (dw * scale.value)
  const worldY = (screenY - offsetY.value - centerY + (dieSize.value.rangeY * dh * scale.value) / 2) / (dh * scale.value)
  
  return {
    x: Math.floor(worldX + minX),
    y: Math.floor(worldY + minY)
  }
}

// 渲染主画布（使用离屏 Canvas 优化）
let offscreenCanvas: HTMLCanvasElement | null = null
let needsRedraw = true
let renderTimer: number | null = null
let isRendering = false

// 防抖渲染
const debouncedRender = () => {
  if (renderTimer) {
    cancelAnimationFrame(renderTimer)
  }
  renderTimer = requestAnimationFrame(() => {
    renderWaferMap()
  })
}

const renderWaferMap = () => {
  if (!canvasRef.value || isRendering) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false })
  if (!ctx) return
  
  // 如果没有数据，只显示空背景
  if (props.data.length === 0) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return
  }
  
  isRendering = true
  
  // 创建离屏 Canvas
  if (!offscreenCanvas || needsRedraw) {
    offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = canvas.width
    offscreenCanvas.height = canvas.height
    const offCtx = offscreenCanvas.getContext('2d', { alpha: false, willReadFrequently: false })
    if (!offCtx) {
      isRendering = false
      return
    }
    
    // 清空背景
    offCtx.fillStyle = '#1a1a1a'
    offCtx.fillRect(0, 0, canvas.width, canvas.height)
    
    const { width: dw, height: dh } = dieSize.value
    const scaledDw = dw * scale.value
    const scaledDh = dh * scale.value
    
    // 只在 die 尺寸大于 1 像素时渲染
    if (scaledDw < 1 || scaledDh < 1) {
      // 缩放太小，使用采样渲染
      const sampleRate = Math.max(1, Math.floor(1 / scaledDw))
      const sampledData = props.data.filter((_, index) => index % sampleRate === 0)
      
      sampledData.forEach(die => {
        const screen = worldToScreen(die.x, die.y)
        if (screen.x >= 0 && screen.x <= canvas.width && 
            screen.y >= 0 && screen.y <= canvas.height) {
          const color = props.colorMap[die.bin] || '#666666'
          offCtx.fillStyle = color
          offCtx.fillRect(Math.floor(screen.x), Math.floor(screen.y), 1, 1)
        }
      })
    } else {
      // 正常渲染可见区域
      const margin = 100 // 增加边距以减少频繁重绘
      const visibleDies = props.data.filter(die => {
        const screen = worldToScreen(die.x, die.y)
        return screen.x + scaledDw >= -margin && 
               screen.x <= canvas.width + margin &&
               screen.y + scaledDh >= -margin && 
               screen.y <= canvas.height + margin
      })
      
      // 按颜色分组批量渲染（减少 fillStyle 切换）
      const dieByColor: Record<string, typeof visibleDies> = {}
      visibleDies.forEach(die => {
        const color = props.colorMap[die.bin] || '#666666'
        if (!dieByColor[color]) {
          dieByColor[color] = []
        }
        dieByColor[color].push(die)
      })
      
      // 批量渲染同颜色的 die
      Object.entries(dieByColor).forEach(([color, dies]) => {
        offCtx.fillStyle = color
        dies.forEach(die => {
          const screen = worldToScreen(die.x, die.y)
          offCtx.fillRect(
            Math.floor(screen.x),
            Math.floor(screen.y),
            Math.ceil(scaledDw),
            Math.ceil(scaledDh)
          )
        })
      })
      
      // 绘制网格（仅在缩放较大且数据量不太多时）
      if (props.showGrid && scale.value > 2 && visibleDies.length < 10000) {
        offCtx.strokeStyle = '#333333'
        offCtx.lineWidth = 0.5
        visibleDies.forEach(die => {
          const screen = worldToScreen(die.x, die.y)
          offCtx.strokeRect(
            Math.floor(screen.x),
            Math.floor(screen.y),
            Math.ceil(scaledDw),
            Math.ceil(scaledDh)
          )
        })
      }
    }
    
    needsRedraw = false
  }
  
  // 将离屏 Canvas 绘制到主 Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(offscreenCanvas, 0, 0)
  
  isRendering = false
}

// 渲染框选层
const renderSelection = () => {
  if (!overlayCanvasRef.value) return
  
  const canvas = overlayCanvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  if (isSelecting.value) {
    const x = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const y = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const w = Math.abs(selectionEnd.value.x - selectionStart.value.x)
    const h = Math.abs(selectionEnd.value.y - selectionStart.value.y)
    
    // 绘制选择框
    ctx.strokeStyle = '#2196f3'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x, y, w, h)
    
    // 绘制半透明填充
    ctx.fillStyle = 'rgba(33, 150, 243, 0.1)'
    ctx.fillRect(x, y, w, h)
  }
}

// 鼠标事件处理
let isPanning = false
let lastMousePos = { x: 0, y: 0 }

const handleMouseDown = (e: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (e.button === 0 && props.enableSelection && e.shiftKey) {
    // Shift + 左键：框选
    isSelecting.value = true
    selectionStart.value = { x, y }
    selectionEnd.value = { x, y }
  } else if (e.button === 0 || e.button === 2) {
    // 左键或右键：平移
    isPanning = true
    lastMousePos = { x, y }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (isSelecting.value) {
    selectionEnd.value = { x, y }
    renderSelection()
  } else if (isPanning) {
    const dx = x - lastMousePos.x
    const dy = y - lastMousePos.y
    
    offsetX.value += dx
    offsetY.value += dy
    lastMousePos = { x, y }
    
    needsRedraw = true
    debouncedRender() // 使用防抖渲染
  }
}

const handleMouseUp = (e: MouseEvent) => {
  if (isSelecting.value) {
    // 计算选中的 dies
    const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x)
    const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y)
    
    const world1 = screenToWorld(x1, y1)
    const world2 = screenToWorld(x2, y2)
    
    const selectedDies = props.data.filter(die => 
      die.x >= Math.min(world1.x, world2.x) &&
      die.x <= Math.max(world1.x, world2.x) &&
      die.y >= Math.min(world1.y, world2.y) &&
      die.y <= Math.max(world1.y, world2.y)
    )
    
    emit('select', selectedDies)
    isSelecting.value = false
    renderSelection()
  }
  
  isPanning = false
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  // 计算缩放前的世界坐标
  const worldBefore = screenToWorld(mouseX, mouseY)
  
  // 更新缩放
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  scale.value = Math.max(0.1, Math.min(10, scale.value * delta))
  
  // 计算缩放后的世界坐标
  const worldAfter = screenToWorld(mouseX, mouseY)
  
  // 调整偏移以保持鼠标位置不变
  const { width: dw, height: dh } = dieSize.value
  offsetX.value += (worldAfter.x - worldBefore.x) * dw * scale.value
  offsetY.value += (worldAfter.y - worldBefore.y) * dh * scale.value
  
  needsRedraw = true
  debouncedRender() // 使用防抖渲染
}

const handleClick = (e: MouseEvent) => {
  if (isPanning || isSelecting.value) return
  
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const world = screenToWorld(x, y)
  
  const clickedDie = props.data.find(die => die.x === world.x && die.y === world.y)
  emit('click', clickedDie || null)
}

// 重置视图
const resetView = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  needsRedraw = true
  renderWaferMap()
}

// 导出方法
defineExpose({
  resetView
})

// 监听数据变化
watch(() => props.data, () => {
  needsRedraw = true
  debouncedRender()
})

watch([scale, offsetX, offsetY], () => {
  needsRedraw = true
  // 不在 watch 中渲染，由事件处理函数触发
})

onMounted(() => {
  if (canvasRef.value && overlayCanvasRef.value) {
    const canvas = canvasRef.value
    const overlay = overlayCanvasRef.value
    
    // 设置高 DPI 支持
    const dpr = window.devicePixelRatio || 1
    canvas.width = props.width * dpr
    canvas.height = props.height * dpr
    overlay.width = props.width * dpr
    overlay.height = props.height * dpr
    
    const ctx = canvas.getContext('2d')
    const overlayCtx = overlay.getContext('2d')
    if (ctx && overlayCtx) {
      ctx.scale(dpr, dpr)
      overlayCtx.scale(dpr, dpr)
    }
    
    renderWaferMap()
    
    // 添加事件监听到 overlay（确保事件能被捕获）
    overlay.style.pointerEvents = 'auto'
    overlay.addEventListener('mousedown', handleMouseDown)
    overlay.addEventListener('mousemove', handleMouseMove)
    overlay.addEventListener('mouseup', handleMouseUp)
    overlay.addEventListener('wheel', handleWheel, { passive: false })
    overlay.addEventListener('click', handleClick)
    overlay.addEventListener('contextmenu', (e) => e.preventDefault())
  }
})

onUnmounted(() => {
  if (overlayCanvasRef.value) {
    const overlay = overlayCanvasRef.value
    overlay.removeEventListener('mousedown', handleMouseDown)
    overlay.removeEventListener('mousemove', handleMouseMove)
    overlay.removeEventListener('mouseup', handleMouseUp)
    overlay.removeEventListener('wheel', handleWheel)
    overlay.removeEventListener('click', handleClick)
  }
})
</script>

<template>
  <div ref="containerRef" class="wafer-map-container">
    <canvas
      ref="canvasRef"
      class="wafer-canvas"
      :style="{ width: `${width}px`, height: `${height}px` }"
    />
    <canvas
      ref="overlayCanvasRef"
      class="overlay-canvas"
      :style="{ width: `${width}px`, height: `${height}px` }"
    />
  </div>
</template>

<style scoped lang="scss">
.wafer-map-container {
  position: relative;
  display: inline-block;
  background: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
}

.wafer-canvas {
  display: block;
  cursor: grab;
}

.wafer-canvas:active {
  cursor: grabbing;
}

.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: grab;
}

.overlay-canvas:active {
  cursor: grabbing;
}
</style>
