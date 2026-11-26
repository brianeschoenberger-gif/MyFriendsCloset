import type { ClosetItem, OutfitLook, Visibility } from '../types'

const originalSchema = 'my-friends-closet/wardrobe-v1'
const photoAndLookSchema = 'my-friends-closet/wardrobe-v2'
export const maxBackupLooks = 60
export const maxBackupBytes = 25_000_000
const categories = new Set(['Tops', 'Bottoms', 'Dresses', 'Sets', 'Jackets', 'Shoes', 'Accessories'])
const visibilities = new Set<Visibility>(['Private', 'Friends', 'Borrowable'])
type StoredPiece = Omit<ClosetItem, 'ownerId' | 'owner' | 'glyph' | 'imageMeta'>
export type WardrobeArchive = { items: ClosetItem[]; looks: OutfitLook[] }

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

function dateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value)
}

function validCombination(ids: number[], itemCategories: Map<number, string>) {
  if (!ids.length || ids.length > 5 || new Set(ids).size !== ids.length) return false
  const slots = ids.map((id) => itemCategories.get(id))
  if (slots.some((name) => !name)) return false
  const top = slots.filter((name) => name === 'Tops').length
  const bottom = slots.filter((name) => name === 'Bottoms').length
  const base = slots.filter((name) => name === 'Dresses' || name === 'Sets').length
  return ((base === 1 && top === 0 && bottom === 0) || (base === 0 && top === 1 && bottom === 1)) &&
    ['Shoes', 'Jackets', 'Accessories'].every((name) => slots.filter((entry) => entry === name).length <= 1)
}

function sanitizeLook(raw: unknown, itemCategories: Map<number, string>): OutfitLook {
  const entry = asRecord(raw)
  if (!Array.isArray(entry.itemIds) || entry.itemIds.some((id) => typeof id !== 'number' || !itemCategories.has(id)) ||
    !validCombination(entry.itemIds, itemCategories)) throw new Error('An outfit refers to unsupported or missing clothes.')
  const itemIds = entry.itemIds as number[]
  const anchorId = entry.anchorId
  if (anchorId !== undefined && (typeof anchorId !== 'number' || !itemIds.includes(anchorId))) throw new Error('An outfit has an invalid focus piece.')
  const worn = entry.wornOn ?? []
  if (!Array.isArray(worn) || worn.length > 365 || !worn.every(dateOnly)) throw new Error('An outfit has invalid wear dates.')
  const id = string(entry.id, 160)
  const title = string(entry.title, 200)
  if (!id.trim() || !title.trim()) throw new Error('An outfit needs a name.')
  const source = entry.source
  if (source !== undefined && source !== 'custom' && source !== 'ai-import') throw new Error('An outfit has an invalid source.')
  return { id, title, itemIds, anchorId, source, wornOn: Array.from(new Set(worn)).sort().reverse(),
    explanation: string(entry.explanation, 2400), occasion: string(entry.occasion, 65), vibe: string(entry.vibe, 40) }
}

export function makeWardrobeBackup(items: ClosetItem[], looks: OutfitLook[] = []) {
  const validItems = items.filter((item) => item.ownerId === 'owner' && item.imageData && validPhoto(item.imageData))
  const itemCategories = new Map(validItems.map((item) => [item.id, item.category]))
  const portableLooks = looks.flatMap((look) => {
    try { return [sanitizeLook(look, itemCategories)] } catch { return [] }
  }).slice(0, maxBackupLooks)
  return JSON.stringify({ format: portableLooks.length ? photoAndLookSchema : originalSchema,
    exportedAt: new Date().toISOString(), items: validItems.map(pieceOf),
    ...(portableLooks.length ? { looks: portableLooks } : {}) })
}

export function parseWardrobeBackup(contents: string): ClosetItem[] {
  return parseWardrobeArchive(contents).items
}

export function parseWardrobeArchive(contents: string): WardrobeArchive {
  if (contents.length > maxBackupBytes) throw new Error('This wardrobe backup is too large.')
  let data: Record<string, unknown>
  try { data = asRecord(JSON.parse(contents)) } catch { throw new Error('Choose a My Friends Closet wardrobe backup (.json).') }
  if ((data.format !== originalSchema && data.format !== photoAndLookSchema) ||
    !Array.isArray(data.items) || !data.items.length || data.items.length > 500) throw new Error('This backup format or item count is not supported.')
  const ids = new Set<number>()
  const items = data.items.map((raw): ClosetItem => {
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
  if (data.format === originalSchema) return { items, looks: [] }
  if (!Array.isArray(data.looks) || data.looks.length > maxBackupLooks) throw new Error('This backup has an unsupported number of looks.')
  const itemCategories = new Map(items.map((item) => [item.id, item.category]))
  return { items, looks: data.looks.map((look) => sanitizeLook(look, itemCategories)) }
}

export function mergeWardrobeBackup(current: ClosetItem[], imported: ClosetItem[]) {
  return planWardrobeRestore(current, imported).items
}

export function planWardrobeRestore(current: ClosetItem[], imported: ClosetItem[]) {
  const seenPhotos = new Map<string, Map<string, number>>()
  const signature = (item: ClosetItem) => JSON.stringify([item.name, item.category, item.color])
  const remember = (item: ClosetItem) => {
    if (!item.imageData) return
    const matches = seenPhotos.get(item.imageData) ?? new Map<string, number>()
    if (!matches.has(signature(item))) matches.set(signature(item), item.id)
    seenPhotos.set(item.imageData, matches)
  }
  current.filter((item) => item.ownerId === 'owner').forEach(remember)
  const items = [...current]
  const ids = new Map<number, number>()
  const used = new Set(current.map((item) => item.id))
  const currentById = new Map(current.filter((item) => item.ownerId === 'owner').map((item) => [item.id, item]))
  let next = current.reduce((max, item) => Math.max(max, item.id + 1), Date.now())
  for (const item of imported) {
    const existing = currentById.get(item.id)
    if (item.imageData && existing?.imageData === item.imageData) {
      ids.set(item.id, existing.id)
      continue
    }
    const exactMatch = item.imageData && seenPhotos.get(item.imageData)?.get(signature(item))
    if (typeof exactMatch === 'number') {
      ids.set(item.id, exactMatch)
      continue
    }
    while (used.has(next)) next += 1
    const id = used.has(item.id) ? next++ : item.id
    used.add(id)
    ids.set(item.id, id)
    const restored = { ...item, id, visibility: 'Private' as const }
    items.push(restored)
    remember(restored)
  }
  return { items, ids }
}

export function mergeLookBackup(current: OutfitLook[], imported: OutfitLook[], ids: Map<number, number>, wardrobe: ClosetItem[]) {
  const itemCategories = new Map(wardrobe.filter((item) => item.ownerId === 'owner').map((item) => [item.id, item.category]))
  const looks = [...current]
  const usedIds = new Set(current.map((look) => look.id))
  const keyOf = (itemIds: number[]) => itemIds.slice().sort((a, b) => a - b).join('-')
  const byPieces = new Map(current.map((look, index) => [keyOf(look.itemIds), index]))
  let added = 0
  let historyEdits = 0
  let skipped = 0
  for (const look of imported) {
    const resolved = look.itemIds.map((id) => ids.get(id))
    const itemIds = resolved.filter((id): id is number => id !== undefined)
    if (itemIds.length !== resolved.length || !validCombination(itemIds, itemCategories)) { skipped += 1; continue }
    const key = keyOf(itemIds)
    const position = byPieces.get(key)
    if (position !== undefined) {
      const existing = looks[position]
      const wornOn = Array.from(new Set([...(existing.wornOn ?? []), ...(look.wornOn ?? [])])).sort().reverse().slice(0, 365)
      if (wornOn.join(',') !== (existing.wornOn ?? []).join(',')) {
        looks[position] = { ...existing, wornOn }
        historyEdits += 1
      }
      continue
    }
    if (looks.length >= maxBackupLooks) { skipped += 1; continue }
    let id = look.source === 'ai-import' ? `ai-${key}` : look.source === 'custom' ? `custom-${key}` : key
    while (usedIds.has(id)) id = `restored-${id}`
    usedIds.add(id)
    byPieces.set(key, looks.length)
    looks.push({ ...look, id, itemIds, anchorId: look.anchorId === undefined ? undefined : ids.get(look.anchorId) })
    added += 1
  }
  return { looks, added, historyEdits, skipped }
}
