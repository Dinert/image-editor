<script setup lang="ts">
import { ref } from 'vue'
import {
  FILTER_OPTIONS,
  WATERMARK_POSITIONS,
  type FilterType,
  type ImageAdjustments,
  type WatermarkConfig,
  type WatermarkPosition,
} from '@/types/editor'

defineProps<{
  hasImage: boolean
  cropMode: boolean
  canUndo: boolean
  adjustments: ImageAdjustments
  watermark: WatermarkConfig
}>()

const emit = defineEmits<{
  upload: [file: File]
  reset: []
  undo: []
  commitHistory: []
  rotate: [delta: number]
  flipX: []
  flipY: []
  download: [type: 'image/png' | 'image/jpeg']
  startCrop: []
  applyCrop: []
  cancelCrop: []
  'update:brightness': [value: number]
  'update:contrast': [value: number]
  'update:saturation': [value: number]
  'update:filter': [value: FilterType]
  'update:watermarkEnabled': [value: boolean]
  'update:watermarkText': [value: string]
  'update:watermarkFontSize': [value: number]
  'update:watermarkColor': [value: string]
  'update:watermarkOpacity': [value: number]
  'update:watermarkPosition': [value: WatermarkPosition]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function onPick() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('upload', file)
  ;(event.target as HTMLInputElement).value = ''
}
</script>

<template>
  <aside class="toolbar">
    <header class="brand">
      <h1>图片编辑器</h1>
      <p>裁剪 · 滤镜 · 水印</p>
    </header>

    <section class="section">
      <h2>文件</h2>
      <button type="button" class="primary" @click="onPick">上传图片</button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        hidden
        @change="onFileChange"
      />
      <div class="row">
        <button type="button" :disabled="!hasImage" @click="emit('download', 'image/png')">
          导出 PNG
        </button>
        <button type="button" :disabled="!hasImage" @click="emit('download', 'image/jpeg')">
          导出 JPG
        </button>
      </div>
      <button type="button" :disabled="!canUndo" @click="emit('undo')">
        撤销上一步
      </button>
      <p class="hint">快捷键：Ctrl / ⌘ + Z</p>
    </section>

    <section class="section">
      <h2>变换</h2>
      <div class="row">
        <button type="button" :disabled="!hasImage || cropMode" @click="emit('rotate', -90)">
          左转 90°
        </button>
        <button type="button" :disabled="!hasImage || cropMode" @click="emit('rotate', 90)">
          右转 90°
        </button>
      </div>
      <div class="row">
        <button type="button" :disabled="!hasImage || cropMode" @click="emit('flipX')">
          水平翻转
        </button>
        <button type="button" :disabled="!hasImage || cropMode" @click="emit('flipY')">
          垂直翻转
        </button>
      </div>
    </section>

    <section class="section">
      <h2>裁剪</h2>
      <template v-if="!cropMode">
        <button type="button" :disabled="!hasImage" @click="emit('startCrop')">开始裁剪</button>
      </template>
      <template v-else>
        <p class="hint">拖动选区移动，拖四角调整大小</p>
        <div class="row">
          <button type="button" class="primary" @click="emit('applyCrop')">应用裁剪</button>
          <button type="button" class="danger" @click="emit('cancelCrop')">取消</button>
        </div>
      </template>
    </section>

    <section class="section">
      <h2>滤镜</h2>
      <div class="filter-grid">
        <button
          v-for="item in FILTER_OPTIONS"
          :key="item.value"
          type="button"
          class="filter-btn"
          :class="{ active: adjustments.filter === item.value }"
          :disabled="!hasImage"
          @click="emit('update:filter', item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </section>

    <section class="section">
      <h2>调整</h2>
      <label>
        <span>亮度 {{ adjustments.brightness }}%</span>
        <input
          type="range"
          min="0"
          max="200"
          :value="adjustments.brightness"
          :disabled="!hasImage"
          @pointerdown="emit('commitHistory')"
          @input="emit('update:brightness', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label>
        <span>对比度 {{ adjustments.contrast }}%</span>
        <input
          type="range"
          min="0"
          max="200"
          :value="adjustments.contrast"
          :disabled="!hasImage"
          @pointerdown="emit('commitHistory')"
          @input="emit('update:contrast', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label>
        <span>饱和度 {{ adjustments.saturation }}%</span>
        <input
          type="range"
          min="0"
          max="200"
          :value="adjustments.saturation"
          :disabled="!hasImage"
          @pointerdown="emit('commitHistory')"
          @input="emit('update:saturation', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </section>

    <section class="section">
      <h2>文字水印</h2>
      <label class="check">
        <input
          type="checkbox"
          :checked="watermark.enabled"
          :disabled="!hasImage"
          @change="
            emit('commitHistory');
            emit('update:watermarkEnabled', ($event.target as HTMLInputElement).checked)
          "
        />
        启用水印
      </label>
      <label>
        <span>文案</span>
        <input
          type="text"
          class="text-input"
          :value="watermark.text"
          :disabled="!hasImage || !watermark.enabled"
          @focus="emit('commitHistory')"
          @input="emit('update:watermarkText', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>字号 {{ watermark.fontSize }}</span>
        <input
          type="range"
          min="12"
          max="96"
          :value="watermark.fontSize"
          :disabled="!hasImage || !watermark.enabled"
          @pointerdown="emit('commitHistory')"
          @input="emit('update:watermarkFontSize', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label>
        <span>透明度 {{ watermark.opacity }}%</span>
        <input
          type="range"
          min="10"
          max="100"
          :value="watermark.opacity"
          :disabled="!hasImage || !watermark.enabled"
          @pointerdown="emit('commitHistory')"
          @input="emit('update:watermarkOpacity', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label>
        <span>颜色</span>
        <input
          type="color"
          class="color-input"
          :value="watermark.color"
          :disabled="!hasImage || !watermark.enabled"
          @pointerdown="emit('commitHistory')"
          @input="emit('update:watermarkColor', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>位置</span>
        <select
          class="text-input"
          :value="watermark.position"
          :disabled="!hasImage || !watermark.enabled"
          @change="
            emit('commitHistory');
            emit('update:watermarkPosition', ($event.target as HTMLSelectElement).value as WatermarkPosition)
          "
        >
          <option v-for="item in WATERMARK_POSITIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </label>
    </section>

    <button type="button" class="danger" :disabled="!hasImage" @click="emit('reset')">
      重置全部
    </button>
  </aside>
</template>

<style scoped>
.toolbar {
  width: 280px;
  flex-shrink: 0;
  padding: 20px 16px;
  background: #111827;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

.brand h1 {
  margin: 0;
  font-size: 20px;
}

.brand p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.section {
  display: grid;
  gap: 10px;
}

.section h2 {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9ca3af;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.filter-btn.active {
  border-color: #60a5fa;
  background: #1e3a5f;
  color: #fff;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

button,
label {
  width: 100%;
}

button {
  padding: 10px 12px;
  border: 1px solid #374151;
  border-radius: 10px;
  background: #1f2937;
  color: #e5e7eb;
  font-size: 13px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  border-color: #60a5fa;
  color: #fff;
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

button.primary {
  background: #2563eb;
  border-color: #2563eb;
}

button.danger {
  color: #fca5a5;
  border-color: #7f1d1d;
}

label {
  display: grid;
  gap: 6px;
  font-size: 13px;
}

label.check {
  display: flex;
  align-items: center;
  gap: 8px;
}

input[type='range'] {
  width: 100%;
}

.text-input,
.color-input,
select.text-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
  color: #e5e7eb;
  font-size: 13px;
}

.color-input {
  height: 36px;
  padding: 4px;
}
</style>
