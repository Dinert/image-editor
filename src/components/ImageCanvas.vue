<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { CropRect } from '@/types/editor'

const props = defineProps<{
  hasImage: boolean
  cropMode: boolean
  cropRect: CropRect | null
}>()

const emit = defineEmits<{
  'update-crop': [rect: CropRect]
}>()

const canvas = defineModel<HTMLCanvasElement | null>('canvas', {
  required: true,
})

const localCanvas = ref<HTMLCanvasElement | null>(null)

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null

let dragMode: DragMode = null
let startX = 0
let startY = 0
let startRect: CropRect | null = null

onMounted(() => {
  canvas.value = localCanvas.value
})

watch(localCanvas, (el) => {
  canvas.value = el
})

function getCanvasPoint(event: PointerEvent) {
  const el = localCanvas.value
  if (!el) return { x: 0, y: 0 }

  const rect = el.getBoundingClientRect()
  const scaleX = el.width / rect.width
  const scaleY = el.height / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

function hitTest(x: number, y: number): DragMode {
  const rect = props.cropRect
  if (!rect) return null

  const handle = 14
  const corners: Array<[DragMode, number, number]> = [
    ['nw', rect.x, rect.y],
    ['ne', rect.x + rect.width, rect.y],
    ['sw', rect.x, rect.y + rect.height],
    ['se', rect.x + rect.width, rect.y + rect.height],
  ]

  for (const [mode, cx, cy] of corners) {
    if (Math.abs(x - cx) <= handle && Math.abs(y - cy) <= handle) {
      return mode
    }
  }

  if (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  ) {
    return 'move'
  }

  return null
}

function onPointerDown(event: PointerEvent) {
  if (!props.cropMode || !props.cropRect || !localCanvas.value) return

  const point = getCanvasPoint(event)
  const mode = hitTest(point.x, point.y)
  if (!mode) return

  dragMode = mode
  startX = point.x
  startY = point.y
  startRect = { ...props.cropRect }
  localCanvas.value.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragMode || !startRect || !localCanvas.value) return

  const point = getCanvasPoint(event)
  const dx = point.x - startX
  const dy = point.y - startY
  let next = { ...startRect }

  if (dragMode === 'move') {
    next.x = startRect.x + dx
    next.y = startRect.y + dy
  } else if (dragMode === 'se') {
    next.width = startRect.width + dx
    next.height = startRect.height + dy
  } else if (dragMode === 'sw') {
    next.x = startRect.x + dx
    next.width = startRect.width - dx
    next.height = startRect.height + dy
  } else if (dragMode === 'ne') {
    next.y = startRect.y + dy
    next.width = startRect.width + dx
    next.height = startRect.height - dy
  } else if (dragMode === 'nw') {
    next.x = startRect.x + dx
    next.y = startRect.y + dy
    next.width = startRect.width - dx
    next.height = startRect.height - dy
  }

  if (next.width < 20) {
    if (dragMode === 'nw' || dragMode === 'sw') {
      next.x = startRect.x + startRect.width - 20
    }
    next.width = 20
  }
  if (next.height < 20) {
    if (dragMode === 'nw' || dragMode === 'ne') {
      next.y = startRect.y + startRect.height - 20
    }
    next.height = 20
  }

  emit('update-crop', next)
}

function onPointerUp(event: PointerEvent) {
  if (!localCanvas.value) return
  dragMode = null
  startRect = null
  try {
    localCanvas.value.releasePointerCapture(event.pointerId)
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="stage">
    <div v-if="!hasImage" class="empty">
      <p>上传一张图片开始编辑</p>
      <span>支持裁剪、滤镜、文字水印</span>
    </div>
    <canvas
      v-show="hasImage"
      ref="localCanvas"
      class="canvas"
      :class="{ cropping: cropMode }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
  </div>
</template>

<style scoped>
.stage {
  flex: 1;
  min-width: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
    linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
    linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  background-color: #f3f4f6;
  overflow: auto;
}

.empty {
  text-align: center;
  color: #6b7280;
  background: rgb(255 255 255 / 85%);
  padding: 28px 36px;
  border-radius: 16px;
}

.empty p {
  margin: 0 0 8px;
  font-size: 16px;
  color: #111827;
}

.canvas {
  max-width: 100%;
  max-height: calc(100vh - 48px);
  box-shadow: 0 12px 40px rgb(0 0 0 / 18%);
  background: #fff;
  touch-action: none;
}

.canvas.cropping {
  cursor: crosshair;
}
</style>
