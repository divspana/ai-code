<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Die {
  x: number
  y: number
  bin: number
  value?: number
  row?: number
  col?: number
}

interface BinInfo {
  bin: number
  name: string
  color: string
  count: number
  percentage: number
  category: 'pass' | 'fail' | 'test' | 'special'
}

interface Props {
  data: Die[]
  width?: number
  height?: number
  binConfig?: Record<number, { name: string; color: string; category: string }>
  showNotch?: boolean
  showCoordinates?: boolean
  showGrid?: boolean
  mode?: 'bin' | 'heatmap' | 'yield'
  waferSize?: number // 晶圆尺寸（英寸）
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 800,
  showNotch: true,
  showCoordinates: true,
  showGrid: true,
  mode: 'bin',
  waferSize: 12,
  binConfig: () => ({
    0: { name: 'Not Tested', color: '#9E9E9E', category: 'test' },
    1: { name: 'Pass', color: '#4CAF50', category: 'pass' },
    2: { name: 'Fail', color: '#F44336', category: 'fail' },
    3: { name: 'Parametric Fail', color: '#FF9800', category: 'fail' },
    4: { name: 'Retest Pass', color: '#2196F3', category: 'pass' },
    5: { name: 'Ink', color: '#9C27B0', category: 'special' },
    6: { name: 'Edge Die', color: '#607D8B', category: 'special' }
  })
})

const emit = defineEmits<{
  'select': [dies: Die[]]
  'click': [die: Die | null]
  'bin-click': [bin: number]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const overlayCanvasRef = ref<HTMLCanvasElement>()

// 视图状态
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// 框选状态
const isSelecting = ref(false)
const selectionStart = ref({ x: 0, y: 0 })
const selectionEnd = ref({ x: 0, y: 0 })

// 计算 Bin 统计信息
const binStatistics = computed<BinInfo[]>(() => {
  const total = props.data.length
  const binCount: Record<number, number> = {}
  
  props.data.forEach(die => {
    binCount[die.bin] = (binCount[die.bin] || 0) + 1
  })
  
  return Object.entries(binCount).map(([bin, count]) => {
    const binNum = Number(bin)
    const config = props.binConfig[binNum] || { 
      name: `Bin ${bin}`, 
      color: '#666666',
      category: 'special'
    }
    
    return {
      bin: binNum,
      name: config.name,
      color: config.color,
      count,
      percentage: (count / total) * 100,
      category: config.category as 'pass' | 'fail' | 'test' | 'special'
    }
  }).sort((a, b) => b.count - a.count)
})

// 计算良率
const yieldRate = computed(() => {
  const total = props.data.length
  const pass = props.data.filter(d => {
    const config = props.binConfig[d.bin]
    return config && config.category === 'pass'
  }).length
  
  return total > 0 ? ((pass / total) * 100).toFixed(2) : '0.00'
})

// 计算 die 尺寸和范围
const dieSize = computed(() => {
  if (props.data.length === 0) return { width: 10, height: 10, minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0 }
  
  const maxX = Math.max(...props.data.map(d => d.x))
  const maxY = Math.max(...props.data.map(d => d.y))
  const minX = Math.min(...props.data.map(d => d.x))
  const minY = Math.min(...props.data.map(d => d.y))
  
  const rangeX = maxX - minX + 1
  const rangeY = maxY - minY + 1
  
  const dieWidth = Math.max(2, Math.floor(props.width * 0.7 / rangeX))
  const dieHeight = Math.max(2, Math.floor(props.height * 0.7 / rangeY))
  
  return {
    width: Math.min(dieWidth, dieHeight),
    height: Math.min(dieWidth, dieHeight),
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  }
})

// 坐标转换
const worldToScreen = (x: number, y: number) => {
  const { width: dw, height: dh, minX, minY, maxX, maxY } = dieSize.value
  const centerX = props.width / 2
  const centerY = props.height / 2
  
  const rangeX = maxX - minX + 1
  const rangeY = maxY - minY + 1
  
  const worldX = (x - minX) * dw * scale.value
  const worldY = (y - minY) * dh * scale.value
  
  return {
    x: worldX + offsetX.value + centerX - (rangeX * dw * scale.value) / 2,
    y: worldY + offsetY.value + centerY - (rangeY * dh * scale.value) / 2
  }
}

const screenToWorld = (screenX: number, screenY: number) => {
  const { width: dw, height: dh, minX, minY, maxX, maxY } = dieSize.value
  const centerX = props.width / 2
  const centerY = props.height / 2
  
  const rangeX = maxX - minX + 1
  const rangeY = maxY - minY + 1
  
  const worldX = (screenX - offsetX.value - centerX + (rangeX * dw * scale.value) / 2) / (dw * scale.value)
  const worldY = (screenY - offsetY.value - centerY + (rangeY * dw * scale.value) / 2) / (dh * scale.value)
  
  return {
    x: Math.floor(worldX + minX),
    y: Math.floor(worldY + minY)
  }
}

// 渲染相关
let offscreenCanvas: HTMLCanvasElement | null = null
let needsRedraw = true
let renderTimer: number | null = null
let isRendering = false

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
  
  if (props.data.length === 0) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return
  }
  
  isRendering = true
  
  if (!offscreenCanvas || needsRedraw) {
    offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = canvas.width
    offscreenCanvas.height = canvas.height
    const offCtx = offscreenCanvas.getContext('2d', { alpha: false })
    if (!offCtx) {
      isRendering = false
      return
    }
    
    // 背景
    offCtx.fillStyle = '#1a1a1a'
    offCtx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制晶圆轮廓
    if (props.showNotch) {
      drawWaferOutline(offCtx)
    }
    
    const { width: dw, height: dh } = dieSize.value
    const scaledDw = dw * scale.value
    const scaledDh = dh * scale.value
    
    if (scaledDw < 1 || scaledDh < 1) {
      // 采样渲染
      const sampleRate = Math.max(1, Math.floor(1 / scaledDw))
      const sampledData = props.data.filter((_, index) => index % sampleRate === 0)
      
      sampledData.forEach(die => {
        const screen = worldToScreen(die.x, die.y)
        if (screen.x >= 0 && screen.x <= canvas.width && 
            screen.y >= 0 && screen.y <= canvas.height) {
          const color = getDieColor(die)
          offCtx.fillStyle = color
          offCtx.fillRect(Math.floor(screen.x), Math.floor(screen.y), 1, 1)
        }
      })
    } else {
      // 正常渲染
      const margin = 100
      const visibleDies = props.data.filter(die => {
        const screen = worldToScreen(die.x, die.y)
        return screen.x + scaledDw >= -margin && 
               screen.x <= canvas.width + margin &&
               screen.y + scaledDh >= -margin && 
               screen.y <= canvas.height + margin
      })
      
      // 按颜色分组
      const dieByColor: Record<string, typeof visibleDies> = {}
      visibleDies.forEach(die => {
        const color = getDieColor(die)
        if (!dieByColor[color]) {
          dieByColor[color] = []
        }
        dieByColor[color].push(die)
      })
      
      // 批量渲染
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
      
      // 网格
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
    
    // 坐标轴
    if (props.showCoordinates && scale.value > 0.5) {
      drawCoordinates(offCtx)
    }
    
    needsRedraw = false
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(offscreenCanvas, 0, 0)
  
  isRendering = false
}

// 获取 Die 颜色
const getDieColor = (die: Die): string => {
  if (props.mode === 'heatmap' && die.value !== undefined) {
    // 热力图模式
    const normalized = Math.min(1, Math.max(0, die.value / 100))
    const r = Math.floor(255 * normalized)
    const g = Math.floor(255 * (1 - normalized))
    return `rgb(${r}, ${g}, 0)`
  } else {
    // Bin 模式
    const config = props.binConfig[die.bin]
    return config ? config.color : '#666666'
  }
}

// 绘制晶圆轮廓和缺口
const drawWaferOutline = (ctx: CanvasRenderingContext2D) => {
  const { centerX, centerY, maxX, minX, maxY, minY } = dieSize.value
  const { width: dw, height: dh } = dieSize.value
  
  const rangeX = maxX - minX + 1
  const rangeY = maxY - minY + 1
  const radius = Math.max(rangeX, rangeY) * dw * scale.value / 2
  
  const screenCenter = worldToScreen(centerX, centerY)
  
  ctx.strokeStyle = '#00BCD4'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  
  // 绘制圆形轮廓
  ctx.beginPath()
  ctx.arc(screenCenter.x, screenCenter.y, radius, 0, Math.PI * 2)
  ctx.stroke()
  
  // 绘制缺口（Notch）
  const notchSize = radius * 0.1
  ctx.beginPath()
  ctx.arc(screenCenter.x, screenCenter.y - radius, notchSize, 0, Math.PI)
  ctx.stroke()
  
  ctx.setLineDash([])
}

// 绘制坐标轴
const drawCoordinates = (ctx: CanvasRenderingContext2D) => {
  const { minX, minY, maxX, maxY } = dieSize.value
  
  ctx.fillStyle = '#00BCD4'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  
  // X 轴标签（每隔一定间隔显示）
  const xStep = Math.max(1, Math.floor((maxX - minX) / 10))
  for (let x = minX; x <= maxX; x += xStep) {
    const screen = worldToScreen(x, minY)
    if (screen.x >= 0 && screen.x <= canvasRef.value!.width) {
      ctx.fillText(x.toString(), screen.x, screen.y + 20)
    }
  }
  
  // Y 轴标签
  const yStep = Math.max(1, Math.floor((maxY - minY) / 10))
  ctx.textAlign = 'right'
  for (let y = minY; y <= maxY; y += yStep) {
    const screen = worldToScreen(minX, y)
    if (screen.y >= 0 && screen.y <= canvasRef.value!.height) {
      ctx.fillText(y.toString(), screen.x - 10, screen.y + 5)
    }
  }
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
    
    ctx.strokeStyle = '#00BCD4'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x, y, w, h)
    
    ctx.fillStyle = 'rgba(0, 188, 212, 0.1)'
    ctx.fillRect(x, y, w, h)
  }
}

// 事件处理
let isPanning = false
let lastMousePos = { x: 0, y: 0 }

const handleMouseDown = (e: MouseEvent) => {
  const rect = overlayCanvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (e.button === 0 && e.shiftKey) {
    isSelecting.value = true
    selectionStart.value = { x, y }
    selectionEnd.value = { x, y }
  } else {
    isPanning = true
    lastMousePos = { x, y }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  const rect = overlayCanvasRef.value?.getBoundingClientRect()
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
    debouncedRender()
  }
}

const handleMouseUp = () => {
  if (isSelecting.value) {
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
  
  const rect = overlayCanvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  const worldBefore = screenToWorld(mouseX, mouseY)
  
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  scale.value = Math.max(0.1, Math.min(10, scale.value * delta))
  
  const worldAfter = screenToWorld(mouseX, mouseY)
  
  const { width: dw, height: dh } = dieSize.value
  offsetX.value += (worldAfter.x - worldBefore.x) * dw * scale.value
  offsetY.value += (worldAfter.y - worldBefore.y) * dh * scale.value
  
  needsRedraw = true
  debouncedRender()
}

const handleClick = (e: MouseEvent) => {
  if (isPanning || isSelecting.value) return
  
  const rect = overlayCanvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const world = screenToWorld(x, y)
  
  const clickedDie = props.data.find(die => die.x === world.x && die.y === world.y)
  emit('click', clickedDie || null)
}

const resetView = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  needsRedraw = true
  renderWaferMap()
}

defineExpose({
  resetView,
  binStatistics,
  yieldRate
})

watch(() => props.data, () => {
  needsRedraw = true
  debouncedRender()
})

watch(() => props.mode, () => {
  needsRedraw = true
  renderWaferMap()
})

onMounted(() => {
  if (canvasRef.value && overlayCanvasRef.value) {
    const canvas = canvasRef.value
    const overlay = overlayCanvasRef.value
    
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
    
    overlay.style.pointerEvents = 'auto'
    overlay.addEventListener('mousedown', handleMouseDown)
    overlay.addEventListener('mousemove', handleMouseMove)
    overlay.addEventListener('mouseup', handleMouseUp)
    overlay.addEventListener('wheel', handleWheel, { passive: false })
    overlay.addEventListener('click', handleClick)
    overlay.addEventListener('contextmenu', (e) => e.preventDefault())
  }
})
</script>

<template>
  <div class="wafer-map-pro">
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

<style scoped>
.wafer-map-pro {
  position: relative;
  display: inline-block;
  background: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
}

.wafer-canvas {
  display: block;
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
