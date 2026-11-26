import { describe, expect, it } from 'vitest'
import { filterCloset, type ClosetFilters } from './closetSearch'
import type { ClosetItem } from '../types'

const filters: ClosetFilters = { category: 'All', photoOnly: false, visibility: 'Any', query: '', order: 'Recent' }
function piece(id: number, fields: Partial<ClosetItem> = {}): ClosetItem {
  return { id, name: `Name ${id}`, category: 'Tops', ownerId: 'owner', owner: 'Test', color: 'navy', brand: 'Démo', size: '', visibility: 'Private',
    glyph: 'ITEM', occasionTags: ['Dinner'], notes: 'not searchable', createdAt: '2026-11-25', updatedAt: '2026-11-25', ...fields }
}
describe('wardrobe search and filtering', () => {
  it('searches all keywords across fields, handles accents, and excludes private notes from the search', () => {
    const items = [piece(1), piece(2, { color: 'Tan' })]
    expect(filterCloset(items, { ...filters, query: 'demo NAVY diner' })).toHaveLength(0)
    expect(filterCloset(items, { ...filters, query: 'demo NAVY dinner' }).map(({ id }) => id)).toEqual([1])
    expect(filterCloset(items, { ...filters, query: 'not searchable' })).toHaveLength(0)
  })
  it('keeps photographed garments ahead of samples and combines visibility and category filters', () => {
    const items = [piece(1), piece(2, { imageData: 'test', name: 'Zed', visibility: 'Borrowable' }), piece(3, { imageData: 'test', name: 'Alpha', category: 'Shoes' })]
    expect(filterCloset(items, { ...filters, order: 'A–Z' }).map(({ id }) => id)).toEqual([3, 2, 1])
    expect(filterCloset(items, { ...filters, category: 'Tops', photoOnly: true, visibility: 'Borrowable' }).map(({ id }) => id)).toEqual([2])
  })
})
