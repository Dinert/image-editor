<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Toolbar from '@/components/Toolbar.vue'
import ImageCanvas from '@/components/ImageCanvas.vue'
import { useImageEditor } from '@/composables/useImageEditor'

const error = ref('')
const {
  canvasRef,
  adjustments,
  watermark,
  cropMode,
  cropRect,
  hasImage,
  canUndo,
  loadFile,
  reset,
  rotate,
  toggleFlipX,
  toggleFlipY,
  setFilter,
  startCrop,
  cancelCrop,
  applyCrop,
  updateCropRect,
  download,
  pushHistory,
  undo,
} = useImageEditor()

function onUpload(file: File) {
  error.value = ''
  loadFile(file).catch((err) => {
    error.value = err instanceof Error ? err.message : '上传失败'
  })
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
    event.preventDefault()
    void undo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="app">
    <Toolbar
      :has-image="hasImage"
      :crop-mode="cropMode"
      :can-undo="canUndo"
      :adjustments="adjustments"
      :watermark="watermark"
      @upload="onUpload"
      @reset="reset"
      @undo="undo"
      @commit-history="pushHistory"
      @rotate="rotate"
      @flip-x="toggleFlipX"
      @flip-y="toggleFlipY"
      @download="download"
      @start-crop="startCrop"
      @apply-crop="applyCrop"
      @cancel-crop="cancelCrop"
      @update:brightness="adjustments.brightness = $event"
      @update:contrast="adjustments.contrast = $event"
      @update:saturation="adjustments.saturation = $event"
      @update:filter="setFilter"
      @update:watermark-enabled="watermark.enabled = $event"
      @update:watermark-text="watermark.text = $event"
      @update:watermark-font-size="watermark.fontSize = $event"
      @update:watermark-color="watermark.color = $event"
      @update:watermark-opacity="watermark.opacity = $event"
      @update:watermark-position="watermark.position = $event"
    />
    <main class="main">
      <p v-if="error" class="error">{{ error }}</p>
      <ImageCanvas
        v-model:canvas="canvasRef"
        :has-image="hasImage"
        :crop-mode="cropMode"
        :crop-rect="cropRect"
        @update-crop="updateCropRect"
      />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.error {
  margin: 12px 16px 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}
</style>
