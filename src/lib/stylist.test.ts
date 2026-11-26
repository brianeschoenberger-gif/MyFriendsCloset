import { describe, expect, it } from 'vitest'
import { closetGaps, photographedPieces, suggestLooks } from './stylist'
import type { ClosetItem } from '../types'

function piece(id: number, category: string, color: string, tags: string[] = [], ownerId = 'owner'): ClosetItem {
  return { id, name: 'Test piece ' + id, ownerId, owner: 'Test', category, color, size: 'M', brand: '', visibility: 'Private', glyph: 'PHOTO', occasionTags: tags, notes: '', imageData: 'data:image/png;base64,test', createdAt: '', updatedAt: '' }
}

const baseline = { occasion: 'Weekend', vibe: 'Effortless', conditions: 'Mild' } as const

describe('the on-device outfit matcher', () => {
  it('combines tops and bottoms or uses a single dress, without duplicates', () => {
    const items = [piece(1, 'Tops', 'white'), piece(2, 'Bottoms', 'denim'), piece(3, 'Dresses', 'coral'), piece(4, 'Shoes', 'brown'), piece(5, 'Accessories', 'rose')]
    const looks = suggestLooks(items, baseline)
    expect(looks).toHaveLength(3)
    expect(new Set(looks.map((look) => look.id)).size).toBe(3)
    for (const { itemIds } of looks) {
      expect(itemIds).toContain(4)
      if (itemIds.includes(3)) {
        expect(itemIds).not.toContain(1)
        expect(itemIds).not.toContain(2)
      } else {
        expect(itemIds).toEqual(expect.arrayContaining([1, 2]))
      }
    }
  })

  it('aims for occasion tags, recognizes neutral colors, and adds a layer for cool conditions', () => {
    const items = [piece(1, 'Tops', 'ivory', ['office']), piece(2, 'Bottoms', 'navy', ['work']), piece(3, 'Dresses', 'berry', ['party']), piece(4, 'Jackets', 'gray'), piece(5, 'Shoes', 'brown')]
    const [first] = suggestLooks(items, { ...baseline, occasion: 'Business meeting', conditions: 'Cool' })
    expect(first.itemIds).toEqual(expect.arrayContaining([1, 2, 4, 5]))
    expect(first.explanation).toContain('occasion tags that match')
    expect(first.explanation).toContain('cooler conditions')
    expect(suggestLooks(items, { ...baseline, conditions: 'Warm' }).every((look) => !look.itemIds.includes(4))).toBe(true)
  })

  it('does not invent a garment to fill missing categories or silently use example photos', () => {
    expect(suggestLooks([piece(1, 'Tops', 'blue'), piece(2, 'Shoes', 'white')], baseline)).toEqual([])
    expect(closetGaps([piece(1, 'Tops', 'blue')])).toMatch(/add a bottom/i)
    const demo = { ...piece(2, 'Dresses', 'gray'), imageData: undefined }
    expect(photographedPieces([piece(1, 'Tops', 'blue'), demo, piece(3, 'Dresses', 'black', [], 'friend')]).map((item) => item.id)).toEqual([1])
    const noShoes = suggestLooks([piece(1, 'Dresses', 'black')], baseline)
    expect(noShoes[0].itemIds).toEqual([1])
    expect(noShoes[0].explanation).toContain('No saved shoes')
  })
})
