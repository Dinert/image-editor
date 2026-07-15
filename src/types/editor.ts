export type FilterType =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'blur'
  | 'vintage'
  | 'cool'
  | 'warm'

export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-right'

export interface ImageAdjustments {
  brightness: number
  contrast: number
  saturation: number
  rotation: number
  flipX: boolean
  flipY: boolean
  filter: FilterType
}

export interface WatermarkConfig {
  enabled: boolean
  text: string
  fontSize: number
  color: string
  opacity: number
  position: WatermarkPosition
}

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface EditorSnapshot {
  imageSrc: string
  adjustments: ImageAdjustments
  watermark: WatermarkConfig
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  rotation: 0,
  flipX: false,
  flipY: false,
  filter: 'none',
}

export const DEFAULT_WATERMARK: WatermarkConfig = {
  enabled: false,
  text: '图片编辑器',
  fontSize: 32,
  color: '#ffffff',
  opacity: 70,
  position: 'bottom-right',
}

export const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'none', label: '原图' },
  { value: 'grayscale', label: '黑白' },
  { value: 'sepia', label: '复古' },
  { value: 'invert', label: '反色' },
  { value: 'blur', label: '模糊' },
  { value: 'vintage', label: '胶片' },
  { value: 'cool', label: '冷色' },
  { value: 'warm', label: '暖色' },
]

export const WATERMARK_POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: 'top-left', label: '左上' },
  { value: 'top-right', label: '右上' },
  { value: 'center', label: '居中' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-right', label: '右下' },
]
