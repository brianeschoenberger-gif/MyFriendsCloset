import type { BorrowRequest, ClosetItem, Friend, UserProfile } from '../types'

const seededAt = '2026-06-10T12:00:00.000Z'

const itemDefaults = { ownerId: 'owner' as const, occasionTags: [], notes: '', createdAt: seededAt, updatedAt: seededAt }

export const initialItems: ClosetItem[] = [
  { ...itemDefaults, id: 1, name: 'Ivory linen set', owner: 'Brian', category: 'Sets', size: 'S', brand: 'Faithfull', visibility: 'Borrowable', color: 'sand', glyph: 'LINEN' },
  { ...itemDefaults, id: 2, name: 'Silk slip dress', owner: 'Brian', category: 'Dresses', size: 'S', brand: 'Reformation', visibility: 'Friends', color: 'rose', glyph: 'SILK' },
  { ...itemDefaults, id: 3, name: 'Oversized blazer', owner: 'Brian', category: 'Jackets', size: 'M', brand: 'Aritzia', visibility: 'Borrowable', color: 'ink', glyph: 'BLAZER' },
  { ...itemDefaults, id: 4, name: 'Sunday sunglasses', owner: 'Brian', category: 'Accessories', size: 'OS', brand: 'Le Specs', visibility: 'Private', color: 'honey', glyph: 'SHADES' },
  { ...itemDefaults, id: 5, name: 'Gold knot hoops', owner: 'Brian', category: 'Accessories', size: 'OS', brand: 'Mejuri', visibility: 'Borrowable', color: 'gold', glyph: 'HOOPS' },
  { ...itemDefaults, id: 6, name: 'White court sneakers', owner: 'Brian', category: 'Shoes', size: '7', brand: 'Veja', visibility: 'Friends', color: 'cream', glyph: 'SNEAKERS' },
]

export const friendItems: ClosetItem[] = [
  { ...itemDefaults, ownerId: 'maya', id: 11, name: 'Chocolate satin dress', owner: 'Maya', category: 'Dresses', size: 'S', brand: 'Dissh', visibility: 'Borrowable', color: 'cocoa', glyph: 'SATIN' },
  { ...itemDefaults, ownerId: 'liv', id: 12, name: 'Woven mini bag', owner: 'Liv', category: 'Accessories', size: 'OS', brand: 'Staud', visibility: 'Borrowable', color: 'lime', glyph: 'BAG' },
  { ...itemDefaults, ownerId: 'sam', id: 13, name: 'Cowboy boots', owner: 'Sam', category: 'Shoes', size: '7.5', brand: 'Tecovas', visibility: 'Borrowable', color: 'tan', glyph: 'BOOTS' },
  { ...itemDefaults, ownerId: 'nina', id: 14, name: 'Cropped leather jacket', owner: 'Nina', category: 'Jackets', size: 'S', brand: 'AllSaints', visibility: 'Borrowable', color: 'black', glyph: 'LEATHER' },
  { ...itemDefaults, ownerId: 'maya', id: 15, name: 'Poolside sarong', owner: 'Maya', category: 'Sets', size: 'OS', brand: 'Monday Swim', visibility: 'Friends', color: 'coral', glyph: 'SARONG' },
  { ...itemDefaults, ownerId: 'liv', id: 16, name: 'Neutral kitten heels', owner: 'Liv', category: 'Shoes', size: '7', brand: 'Aeyde', visibility: 'Borrowable', color: 'blush', glyph: 'HEELS' },
]

export const initialRequests: BorrowRequest[] = []

export const profiles: Record<'owner' | 'friend', UserProfile> = {
  owner: { id: 'owner', name: 'Brian', initials: 'BK' },
  friend: { id: 'friend', name: 'Alex', initials: 'AL' },
}

export const friends: Friend[] = [
  { name: 'Maya', initials: 'MA', count: 42, color: '#e8a48f' },
  { name: 'Liv', initials: 'LI', count: 31, color: '#a9be91' },
  { name: 'Sam', initials: 'SA', count: 28, color: '#d5ab69' },
  { name: 'Nina', initials: 'NI', count: 37, color: '#9a9ebd' },
]
