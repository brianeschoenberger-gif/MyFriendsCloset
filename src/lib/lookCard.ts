import type { ClosetItem } from '../types'

const localRaster = /^data:image\/(?:jpeg|png|webp);base64,[a-z\d+/]+={0,2}$/i

export function canMakeLookCard(items: ClosetItem[]) {
  return items.length >= 2 && items.length <= 6 && items.every((item) =>
    item.ownerId === 'owner' && typeof item.imageData === 'string' && localRaster.test(item.imageData))
}

export function coverCrop(imageWidth: number, imageHeight: number, width: number, height: number): [number, number, number, number] {
  const scale = Math.max(width / imageWidth, height / imageHeight)
  const visibleWidth = width / scale
  const visibleHeight = height / scale
  return [(imageWidth - visibleWidth) / 2, (imageHeight - visibleHeight) / 2, visibleWidth, visibleHeight]
}

function openImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => img.naturalWidth && img.naturalHeight ? resolve(img) : reject(new Error('Could not read a clothing photo.'))
    img.onerror = () => reject(new Error('Could not read a clothing photo.'))
    img.src = url
  })
}

function singleLineText(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const characters = Array.from(text.replace(/\s+/gu, ' ').trim())
  if (ctx.measureText(characters.join('')).width <= width) return characters.join('')
  while (characters.length && ctx.measureText(`${characters.join('')}…`).width > width) characters.pop()
  return `${characters.join('')}…`
}

export async function makeLookCard(items: ClosetItem[]) {
  if (!canMakeLookCard(items)) throw new Error('This look needs two to six of your own saved photos.')
  const images = await Promise.all(items.map((item) => openImage(item.imageData!)))
  const canvas = document.createElement('canvas')
  const columns = 2
  const rows = Math.ceil(items.length / columns)
  const margin = 48
  const gap = 16
  const top = 202
  const width = 1000
  const tileWidth = (width - 2 * margin - gap) / columns
  const photoHeight = 270
  const tileHeight = 335
  const height = top + rows * (tileHeight + gap) + 56
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Your browser could not create an outfit card.')

  ctx.fillStyle = '#f9f4ee'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#534239'
  ctx.font = '600 20px system-ui, sans-serif'
  ctx.fillText('MY FRIENDS CLOSET  /  STYLE NOTES', margin, 57)
  ctx.fillStyle = '#281f1a'
  ctx.font = 'italic 76px Georgia, serif'
  ctx.fillText('Would you wear this?', margin, 142)
  ctx.strokeStyle = '#c9ad9a'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(margin, 173)
  ctx.lineTo(width - margin, 173)
  ctx.stroke()

  for (const [index, image] of images.entries()) {
    const isLastUnpaired = index === images.length - 1 && index % columns === 0
    const x = isLastUnpaired ? (width - tileWidth) / 2 : margin + (index % columns) * (tileWidth + gap)
    const y = top + Math.floor(index / columns) * (tileHeight + gap)
    ctx.fillStyle = '#fffdf8'
    ctx.fillRect(x, y, tileWidth, tileHeight)
    const crop = coverCrop(image.naturalWidth, image.naturalHeight, tileWidth, photoHeight)
    ctx.drawImage(image, ...crop, x, y, tileWidth, photoHeight)
    ctx.font = '600 25px system-ui, sans-serif'
    ctx.fillStyle = '#352923'
    ctx.fillText(singleLineText(ctx, items[index].name, tileWidth - 42), x + 21, y + photoHeight + 41)
  }
  ctx.fillStyle = '#6c5448'
  ctx.font = '500 19px system-ui, sans-serif'
  ctx.fillText('PUT TOGETHER FROM MY OWN CLOSET', margin, height - 32)

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) =>
    blob ? resolve(blob) : reject(new Error('Your browser could not save an outfit card.')), 'image/png'))
}
