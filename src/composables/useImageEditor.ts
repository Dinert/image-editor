import { computed, nextTick, ref, watch } from 'vue'
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_WATERMARK,
  type CropRect,
  type EditorSnapshot,
  type FilterType,
  type ImageAdjustments,
  type WatermarkConfig,
  type WatermarkPosition,
} from '@/types/editor'

const MAX_HISTORY = 40

function buildFilter(adj: ImageAdjustments) {
  const base = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`
  console.log('base', base)
  switch (adj.filter) {
    case 'grayscale':
      return `${base} grayscale(100%)`
    case 'sepia':
      return `${base} sepia(80%)`
    case 'invert':
      return `${base} invert(100%)`
    case 'blur':
      return `${base} blur(2px)`
    case 'vintage':
      return `${base} sepia(45%) contrast(110%) saturate(80%)`
    case 'cool':
      return `${base} hue-rotate(190deg) saturate(90%)`
    case 'warm':
      return `${base} sepia(25%) saturate(120%) hue-rotate(-10deg)`
    default:
      return base
  }
}

function getWatermarkPoint(
  width: number,
  height: number,
  fontSize: number,
  textWidth: number,
  position: WatermarkPosition,
) {
  const pad = 24
  switch (position) {
    case 'top-left':
      return { x: pad, y: pad + fontSize }
    case 'top-right':
      return { x: width - textWidth - pad, y: pad + fontSize }
    case 'center':
      return { x: (width - textWidth) / 2, y: height / 2 + fontSize / 3 }
    case 'bottom-left':
      return { x: pad, y: height - pad }
    case 'bottom-right':
    default:
      return { x: width - textWidth - pad, y: height - pad }
  }
}

function cloneAdjustments(value: ImageAdjustments): ImageAdjustments {
  return { ...value }
}

function cloneWatermark(value: WatermarkConfig): WatermarkConfig {
  return { ...value }
}

export function useImageEditor() {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const sourceImage = ref<HTMLImageElement | null>(null)
  const imageSrc = ref('')
  const fileName = ref('')
  const adjustments = ref<ImageAdjustments>({ ...DEFAULT_ADJUSTMENTS })
  const watermark = ref<WatermarkConfig>({ ...DEFAULT_WATERMARK })
  const cropMode = ref(false)
  const cropRect = ref<CropRect | null>(null)
  const history = ref<EditorSnapshot[]>([])
  const historyLock = ref(false)
  const hasImage = computed(() => Boolean(sourceImage.value))
  const canUndo = computed(() => history.value.length > 0)

  function createDefaultCrop(width: number, height: number): CropRect {
    const size = Math.min(width, height) * 0.7
    return {
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size,
    }
  }

  function createSnapshot(): EditorSnapshot | null {
    if (!imageSrc.value) return null
    return {
      imageSrc: imageSrc.value,
      adjustments: cloneAdjustments(adjustments.value),
      watermark: cloneWatermark(watermark.value),
    }
  }

  function pushHistory() {
    if (historyLock.value || !imageSrc.value) return
    const snapshot = createSnapshot()
    if (!snapshot) return

    const last = history.value[history.value.length - 1]
    if (
      last &&
      last.imageSrc === snapshot.imageSrc &&
      JSON.stringify(last.adjustments) === JSON.stringify(snapshot.adjustments) &&
      JSON.stringify(last.watermark) === JSON.stringify(snapshot.watermark)
    ) {
      return
    }

    history.value.push(snapshot)
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
  }

  function clearHistory() {
    history.value = []
  }

  async function restoreSnapshot(snapshot: EditorSnapshot) {
    historyLock.value = true
    cropMode.value = false
    cropRect.value = null
    adjustments.value = cloneAdjustments(snapshot.adjustments)
    watermark.value = cloneWatermark(snapshot.watermark)
    imageSrc.value = snapshot.imageSrc

    await new Promise<void>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        sourceImage.value = image
        resolve()
      }
      image.onerror = () => reject(new Error('撤销恢复失败'))
      image.src = snapshot.imageSrc
    })

    await nextTick()
    draw()
    historyLock.value = false
  }

  async function undo() {
    const snapshot = history.value.pop()
    if (!snapshot) return
    try {
      await restoreSnapshot(snapshot)
    } catch {
      // ignore restore failure
    }
  }

  function loadImageFromSrc(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('图片加载失败'))
      image.src = src
    })
  }

  async function loadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      throw new Error('请选择图片文件')
    }

    const src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new Error('图片读取失败'))
      }
      reader.onerror = () => reject(new Error('图片读取失败'))
      reader.readAsDataURL(file)
    })

    const image = await loadImageFromSrc(src)
    sourceImage.value = image
    imageSrc.value = src
    fileName.value = file.name.replace(/\.[^.]+$/, '') || 'edited-image'
    adjustments.value = { ...DEFAULT_ADJUSTMENTS }
    watermark.value = { ...DEFAULT_WATERMARK }
    cropMode.value = false
    cropRect.value = null
    clearHistory()
    await nextTick()
    draw()
  }

  function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!watermark.value.enabled || !watermark.value.text.trim()) return

    const { text, fontSize, color, opacity, position } = watermark.value
    ctx.save()
    ctx.font = `600 ${fontSize}px system-ui, sans-serif`
    ctx.fillStyle = color
    ctx.globalAlpha = opacity / 100
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 4
    const textWidth = ctx.measureText(text).width
    const point = getWatermarkPoint(width, height, fontSize, textWidth, position)
    ctx.fillText(text, point.x, point.y)
    ctx.restore()
  }

  function drawCropOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const rect = cropRect.value
    if (!cropMode.value || !rect) return

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.beginPath()
    ctx.rect(0, 0, width, height)
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.fill('evenodd')

    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = 2
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)

    const handle = 8
    const points = [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x, rect.y + rect.height],
      [rect.x + rect.width, rect.y + rect.height],
    ]
    ctx.fillStyle = '#fff'
    for (const [hx, hy] of points) {
      ctx.fillRect(hx - handle / 2, hy - handle / 2, handle, handle)
      ctx.strokeRect(hx - handle / 2, hy - handle / 2, handle, handle)
    }
    ctx.restore()
  }

  function draw() {
    const canvas = canvasRef.value
    const image = sourceImage.value
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { rotation, flipX, flipY } = adjustments.value
    const radians = (rotation * Math.PI) / 180
    const swapped = Math.abs(rotation % 180) === 90

    const width = swapped ? image.height : image.width
    const height = swapped ? image.width : image.height

    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate(radians)
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)
    ctx.filter = buildFilter(adjustments.value)
    ctx.drawImage(image, -image.width / 2, -image.height / 2)
    ctx.restore()

    ctx.filter = 'none'
    drawWatermark(ctx, width, height)
    drawCropOverlay(ctx, width, height)
  }

  function reset() {
    pushHistory()
    adjustments.value = { ...DEFAULT_ADJUSTMENTS }
    watermark.value = { ...DEFAULT_WATERMARK }
    cropMode.value = false
    cropRect.value = null
    draw()
  }

  function rotate(delta: number) {
    if (cropMode.value) return
    pushHistory()
    adjustments.value.rotation = (adjustments.value.rotation + delta + 360) % 360
    draw()
  }

  function toggleFlipX() {
    if (cropMode.value) return
    pushHistory()
    adjustments.value.flipX = !adjustments.value.flipX
    draw()
  }

  function toggleFlipY() {
    if (cropMode.value) return
    pushHistory()
    adjustments.value.flipY = !adjustments.value.flipY
    draw()
  }

  function setFilter(filter: FilterType) {
    if (adjustments.value.filter === filter) return
    pushHistory()
    adjustments.value.filter = filter
    draw()
  }

  function startCrop() {
    const canvas = canvasRef.value
    if (!canvas || !sourceImage.value) return
    cropMode.value = true
    cropRect.value = createDefaultCrop(canvas.width, canvas.height)
    draw()
  }

  function cancelCrop() {
    cropMode.value = false
    cropRect.value = null
    draw()
  }

  function applyCrop() {
    const canvas = canvasRef.value
    const rect = cropRect.value
    if (!canvas || !rect || !sourceImage.value) return

    pushHistory()

    const watermarkEnabled = watermark.value.enabled
    cropMode.value = false
    watermark.value.enabled = false
    draw()

    const temp = document.createElement('canvas')
    temp.width = Math.max(1, Math.round(rect.width))
    temp.height = Math.max(1, Math.round(rect.height))
    const tempCtx = temp.getContext('2d')
    if (!tempCtx) return

    tempCtx.drawImage(
      canvas,
      Math.round(rect.x),
      Math.round(rect.y),
      Math.round(rect.width),
      Math.round(rect.height),
      0,
      0,
      temp.width,
      temp.height,
    )

    const nextSrc = temp.toDataURL('image/png')
    const image = new Image()
    image.onload = async () => {
      sourceImage.value = image
      imageSrc.value = nextSrc
      adjustments.value = { ...DEFAULT_ADJUSTMENTS }
      watermark.value.enabled = watermarkEnabled
      cropRect.value = null
      await nextTick()
      draw()
    }
    image.src = nextSrc
  }

  function updateCropRect(next: CropRect) {
    const canvas = canvasRef.value
    if (!canvas) return

    const width = Math.max(20, Math.min(next.width, canvas.width))
    const height = Math.max(20, Math.min(next.height, canvas.height))
    const x = Math.max(0, Math.min(next.x, canvas.width - width))
    const y = Math.max(0, Math.min(next.y, canvas.height - height))

    cropRect.value = { x, y, width, height }
    draw()
  }

  function download(type: 'image/png' | 'image/jpeg' = 'image/png') {
    const canvas = canvasRef.value
    if (!canvas) return

    const wasCrop = cropMode.value
    if (wasCrop) {
      cropMode.value = false
      draw()
    }

    const link = document.createElement('a')
    const ext = type === 'image/png' ? 'png' : 'jpg'
    link.download = `${fileName.value || 'edited'}.${ext}`
    link.href = canvas.toDataURL(type, 0.92)
    link.click()

    if (wasCrop) {
      cropMode.value = true
      draw()
    }
  }

  watch(
    () => [
      adjustments.value.brightness,
      adjustments.value.contrast,
      adjustments.value.saturation,
      adjustments.value.filter,
      watermark.value.enabled,
      watermark.value.text,
      watermark.value.fontSize,
      watermark.value.color,
      watermark.value.opacity,
      watermark.value.position,
    ],
    () => {
      if (!historyLock.value) draw()
    },
  )

  return {
    canvasRef,
    sourceImage,
    fileName,
    adjustments,
    watermark,
    cropMode,
    cropRect,
    hasImage,
    canUndo,
    loadFile,
    draw,
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
  }
}
