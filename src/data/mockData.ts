import type { BorrowRequest, ClosetItem, Friend } from '../types'

export const initialItems: ClosetItem[] = [
  { id: 1, name: 'Ivory linen set', owner: 'You', category: 'Sets', size: 'S', brand: 'Faithfull', visibility: 'Borrowable', color: 'sand', glyph: 'LINEN' },
  { id: 2, name: 'Silk slip dress', owner: 'You', category: 'Dresses', size: 'S', brand: 'Reformation', visibility: 'Friends', color: 'rose', glyph: 'SILK' },
  { id: 3, name: 'Oversized blazer', owner: 'You', category: 'Jackets', size: 'M', brand: 'Aritzia', visibility: 'Borrowable', color: 'ink', glyph: 'BLAZER' },
  { id: 4, name: 'Sunday sunglasses', owner: 'You', category: 'Accessories', size: 'OS', brand: 'Le Specs', visibility: 'Private', color: 'honey', glyph: 'SHADES' },
  { id: 5, name: 'Gold knot hoops', owner: 'You', category: 'Accessories', size: 'OS', brand: 'Mejuri', visibility: 'Borrowable', color: 'gold', glyph: 'HOOPS' },
  { id: 6, name: 'White court sneakers', owner: 'You', category: 'Shoes', size: '7', brand: 'Veja', visibility: 'Friends', color: 'cream', glyph: 'SNEAKERS' },
]

export const friendItems: ClosetItem[] = [
  { id: 11, name: 'Chocolate satin dress', owner: 'Maya', category: 'Dresses', size: 'S', brand: 'Dissh', visibility: 'Borrowable', color: 'cocoa', glyph: 'SATIN' },
  { id: 12, name: 'Woven mini bag', owner: 'Liv', category: 'Accessories', size: 'OS', brand: 'Staud', visibility: 'Borrowable', color: 'lime', glyph: 'BAG' },
  { id: 13, name: 'Cowboy boots', owner: 'Sam', category: 'Shoes', size: '7.5', brand: 'Tecovas', visibility: 'Borrowable', color: 'tan', glyph: 'BOOTS' },
  { id: 14, name: 'Cropped leather jacket', owner: 'Nina', category: 'Jackets', size: 'S', brand: 'AllSaints', visibility: 'Borrowable', color: 'black', glyph: 'LEATHER' },
  { id: 15, name: 'Poolside sarong', owner: 'Maya', category: 'Sets', size: 'OS', brand: 'Monday Swim', visibility: 'Friends', color: 'coral', glyph: 'SARONG' },
  { id: 16, name: 'Neutral kitten heels', owner: 'Liv', category: 'Shoes', size: '7', brand: 'Aeyde', visibility: 'Borrowable', color: 'blush', glyph: 'HEELS' },
]

export const initialRequests: BorrowRequest[] = [
  { id: 1, item: 'Ivory linen set', person: 'Maya', dates: 'Jun 19 - 22', direction: 'incoming', status: 'Pending', glyph: 'LINEN' },
  { id: 2, item: 'Oversized blazer', person: 'Nina', dates: 'Jun 14', direction: 'incoming', status: 'Pending', glyph: 'BLAZER' },
  { id: 3, item: 'Chocolate satin dress', person: 'Maya', dates: 'Jun 27 - 29', direction: 'outgoing', status: 'Approved', glyph: 'SATIN' },
]

export const friends: Friend[] = [
  { name: 'Maya', initials: 'MA', count: 42, color: '#e8a48f' },
  { name: 'Liv', initials: 'LI', count: 31, color: '#a9be91' },
  { name: 'Sam', initials: 'SA', count: 28, color: '#d5ab69' },
  { name: 'Nina', initials: 'NI', count: 37, color: '#9a9ebd' },
]
