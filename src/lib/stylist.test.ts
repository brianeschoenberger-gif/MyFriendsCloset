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

  it('locks the selected garment into every match, even if it would not rank or is a warm-weather layer', () => {
    const item = piece(99, 'Tops', 'fuchsia')
    const tops = Array.from({ length: 20 }, (_, i) => piece(i + 1, 'Tops', 'ivory', ['Weekend']))
    const bottom = piece(100, 'Bottoms', 'blue')
    const dress = piece(102, 'Dresses', 'ivory')
    const layer = piece(103, 'Jackets', 'navy')
    expect(suggestLooks([...tops, item, bottom, dress], baseline, 3, 99)[0].itemIds).toEqual([99, 100])
    expect(suggestLooks([dress, layer], { ...baseline, conditions: 'Warm' }, 3, 103)[0]).toMatchObject({ itemIds: [102, 103], explanation: expect.stringContaining('instead of wearing it in the heat') })
    expect(suggestLooks([item, dress], baseline, 3, 99)).toEqual([])
    expect(closetGaps([item, dress], 99)).toContain('Add a bottom')
    expect(suggestLooks([dress], baseline, 3, 404)).toEqual([])
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
