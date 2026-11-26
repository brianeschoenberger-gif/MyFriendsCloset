import { useCallback, useEffect, useRef, useState } from 'react'
import { hintColorFromImage } from './colorHint'

export const storageKeys = {
  items: 'mfc-beta-items-v1',
  requests: 'mfc-beta-requests-v1',
  identity: 'mfc-beta-identity-v1',
  onboardingDismissed: 'mfc-beta-onboarding-dismissed-v1',
  savedLooks: 'mfc-beta-saved-looks-v1',
} as const

export type StorageFailure = {
  key: string
  message: string
  isQuotaError: boolean
}

export type ImageProcessingResult = {
  dataUrl: string
  originalBytes: number
  storedBytes: number
  width?: number
  height?: number
  compressed: boolean
  colorHint?: string
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

export function isQuotaError(error: unknown) {
  return error instanceof DOMException && (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
}

export function usePersistentState<T>(key: string, fallback: T, syncTabs = false) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback))
  const [storageFailure, setStorageFailure] = useState<StorageFailure | null>(null)
  const valueRef = useRef(value)
  const initialFallback = useRef(fallback)

  useEffect(() => {
    if (!syncTabs) return
    function receive(event: StorageEvent) {
      if (event.key !== key || event.storageArea !== window.localStorage) return
      const latest = readStorage(key, initialFallback.current)
      if (Array.isArray(valueRef.current) && !Array.isArray(latest)) return
      valueRef.current = latest
      setValue(latest)
    }
    window.addEventListener('storage', receive)
    return () => window.removeEventListener('storage', receive)
  }, [key, syncTabs])

  const setPersistentValue = useCallback((action: T | ((current: T) => T)) => {
    try {
      const base = syncTabs ? readStorage(key, valueRef.current) : valueRef.current
      const current = Array.isArray(valueRef.current) && !Array.isArray(base) ? valueRef.current : base
      const nextValue = typeof action === 'function'
        ? (action as (current: T) => T)(current)
        : action
      window.localStorage.setItem(key, JSON.stringify(nextValue))
      valueRef.current = nextValue
      setValue(nextValue)
      setStorageFailure(null)
      return true
    } catch (error) {
      const quota = isQuotaError(error)
      setStorageFailure({
        key,
        isQuotaError: quota,
        message: quota
          ? 'This browser is out of local closet space. Delete an older photo or choose a smaller image, then try again.'
          : 'Your change could not be saved in this browser. Try again before leaving the page.',
      })
      return false
    }
  }, [key, syncTabs])

  return [value, setPersistentValue, storageFailure, () => setStorageFailure(null)] as const
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

function canvasToDataUrl(canvas: HTMLCanvasElement, type: string, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Could not compress image')); return }
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error ?? new Error('Could not read compressed image'))
      reader.readAsDataURL(blob)
    }, type, quality)
  })
}

function decodeBrowserImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unsupported photo format')) }
    image.src = url
  })
}

export async function prepareImageForStorage(file: File, maxDimension = 1600): Promise<ImageProcessingResult> {
  const canBitmapDecode = typeof window.createImageBitmap === 'function'
  const canNativeDecode = typeof URL.createObjectURL === 'function' && typeof window.HTMLImageElement.prototype.decode === 'function'
  const original = async (): Promise<ImageProcessingResult> => {
    const dataUrl = await fileToDataUrl(file)
    return { dataUrl, originalBytes: file.size, storedBytes: dataUrl.length, compressed: false }
  }
  if (file.type === 'image/gif' || (!canBitmapDecode && !canNativeDecode)) return original()

  const bitmap = canBitmapDecode ? await window.createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => undefined) : undefined
  const source = bitmap ?? (canNativeDecode ? await decodeBrowserImage(file) : undefined)
  if (!source) throw new Error('Unsupported photo format')
  try {
    const sourceWidth = bitmap?.width ?? (source as HTMLImageElement).naturalWidth
    const sourceHeight = bitmap?.height ?? (source as HTMLImageElement).naturalHeight
    if (!sourceWidth || !sourceHeight) throw new Error('Could not decode image')
    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight))
    const width = Math.max(1, Math.round(sourceWidth * scale))
    const height = Math.max(1, Math.round(sourceHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return original()
    // Flatten transparent PNG and WebP photos onto the closet’s warm backdrop.
    if (file.type === 'image/png' || file.type === 'image/webp') {
      context.fillStyle = '#f5f1ec'
      context.fillRect(0, 0, width, height)
    }
    context.drawImage(source, 0, 0, width, height)
    const colorHint = hintColorFromImage(source, sourceWidth, sourceHeight)
    const dataUrl = await canvasToDataUrl(canvas, 'image/jpeg', 0.82)
    return {
      dataUrl, originalBytes: file.size, storedBytes: dataUrl.length, width, height, colorHint,
      compressed: width < sourceWidth || height < sourceHeight || dataUrl.length * .75 < file.size,
    }
  } finally { bitmap?.close() }
}
