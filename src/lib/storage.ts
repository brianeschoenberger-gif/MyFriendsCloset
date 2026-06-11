import { useCallback, useRef, useState } from 'react'

export const storageKeys = {
  items: 'mfc-beta-items-v1',
  requests: 'mfc-beta-requests-v1',
  identity: 'mfc-beta-identity-v1',
  onboardingDismissed: 'mfc-beta-onboarding-dismissed-v1',
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

export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback))
  const [storageFailure, setStorageFailure] = useState<StorageFailure | null>(null)
  const valueRef = useRef(value)

  const setPersistentValue = useCallback((action: T | ((current: T) => T)) => {
    const nextValue = typeof action === 'function'
      ? (action as (current: T) => T)(valueRef.current)
      : action

    try {
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
  }, [key])

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

export async function prepareImageForStorage(file: File, maxDimension = 1600): Promise<ImageProcessingResult> {
  const originalDataUrl = await fileToDataUrl(file)
  const canResize = file.type !== 'image/svg+xml' && file.type !== 'image/gif' && 'createImageBitmap' in window

  if (!canResize) {
    return { dataUrl: originalDataUrl, originalBytes: file.size, storedBytes: originalDataUrl.length, compressed: false }
  }

  const bitmap = await createImageBitmap(file)
  const sourceWidth = bitmap.width
  const sourceHeight = bitmap.height
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return { dataUrl: originalDataUrl, originalBytes: file.size, storedBytes: originalDataUrl.length, width: sourceWidth, height: sourceHeight, compressed: false }
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const dataUrl = await canvasToDataUrl(canvas, 'image/jpeg', 0.82)
  return {
    dataUrl,
    originalBytes: file.size,
    storedBytes: dataUrl.length,
    width,
    height,
    compressed: dataUrl.length < originalDataUrl.length,
  }
}
