import type { ClosetItem, Visibility } from '../types'

const schema = 'my-friends-closet/wardrobe-v1'
export const maxBackupBytes = 25_000_000
const categories = new Set(['Tops', 'Bottoms', 'Dresses', 'Sets', 'Jackets', 'Shoes', 'Accessories'])
const visibilities = new Set<Visibility>(['Private', 'Friends', 'Borrowable'])
type StoredPiece = Omit<ClosetItem, 'ownerId' | 'owner' | 'glyph' | 'imageMeta'>

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('This is not a valid wardrobe backup.')
  return value as Record<string, unknown>
}

function string(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max) throw new Error('A clothing entry has invalid details.')
  return value
}

function pieceOf(item: ClosetItem): StoredPiece {
  const { id, name, category, size, brand, visibility, color, imageData, occasionTags, notes, createdAt, updatedAt } = item
  return { id, name, category, size, brand, visibility, color, imageData, occasionTags, notes, createdAt, updatedAt }
}

function validPhoto(data: string) {
  return /^data:image\/(jpeg|png|webp|avif|gif|bmp|heic|heif);base64,[A-Za-z0-9+/=]+$/.test(data)
}

export function makeWardrobeBackup(items: ClosetItem[]) {
  return JSON.stringify({ format: schema, exportedAt: new Date().toISOString(),
    items: items.filter((item) => item.ownerId === 'owner' && item.imageData && validPhoto(item.imageData)).map(pieceOf) })
}

export function parseWardrobeBackup(contents: string): ClosetItem[] {
  if (contents.length > maxBackupBytes) throw new Error('This wardrobe backup is too large.')
  let data: Record<string, unknown>
  try { data = asRecord(JSON.parse(contents)) } catch { throw new Error('Choose a My Friends Closet wardrobe backup (.json).') }
  if (data.format !== schema || !Array.isArray(data.items) || !data.items.length || data.items.length > 500) throw new Error('This backup format or item count is not supported.')
  const ids = new Set<number>()
  return data.items.map((raw): ClosetItem => {
    const entry = asRecord(raw)
    const id = entry.id
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1 || id > 9_000_000_000_000_000 || ids.has(id)) throw new Error('The backup contains an invalid or duplicate item ID.')
    ids.add(id)
    const name = string(entry.name, 80).trim()
    const category = string(entry.category, 30)
    const imageData = string(entry.imageData, 10_000_000)
    const createdAt = string(entry.createdAt, 32)
    const updatedAt = string(entry.updatedAt, 32)
    if (!name || !categories.has(category) || !visibilities.has(entry.visibility as Visibility) ||
      !validPhoto(imageData) || !Number.isFinite(Date.parse(createdAt)) || !Number.isFinite(Date.parse(updatedAt)) ||
      !Array.isArray(entry.occasionTags) || entry.occasionTags.length > 35) throw new Error('A clothing entry has invalid details or an unsupported photo.')
    return {
      id, ownerId: 'owner', owner: 'Brian', glyph: 'PHOTO', name, category, imageData,
      size: string(entry.size, 24), brand: string(entry.brand, 80), color: string(entry.color, 35),
      visibility: 'Private', notes: string(entry.notes, 600),
      occasionTags: entry.occasionTags.map((tag) => string(tag, 160)), createdAt, updatedAt,
    }
  })
}

export function mergeWardrobeBackup(current: ClosetItem[], imported: ClosetItem[]) {
  const seenPhotos = new Map<string, Set<string>>()
  const signature = (item: ClosetItem) => JSON.stringify([item.name, item.category, item.color])
  const remember = (item: ClosetItem) => {
    if (!item.imageData) return
    const matches = seenPhotos.get(item.imageData) ?? new Set<string>()
    matches.add(signature(item))
    seenPhotos.set(item.imageData, matches)
  }
  current.filter((item) => item.ownerId === 'owner').forEach(remember)
  const result = [...current]
  const used = new Set(current.map((item) => item.id))
  const currentById = new Map(current.filter((item) => item.ownerId === 'owner').map((item) => [item.id, item]))
  let next = current.reduce((max, item) => Math.max(max, item.id + 1), Date.now())
  for (const item of imported) {
    if (item.imageData && (currentById.get(item.id)?.imageData === item.imageData || seenPhotos.get(item.imageData)?.has(signature(item)))) continue
    while (used.has(next)) next += 1
    const id = used.has(item.id) ? next++ : item.id
    used.add(id)
    result.push({ ...item, id, visibility: 'Private' })
    remember(item)
  }
  return result
}
