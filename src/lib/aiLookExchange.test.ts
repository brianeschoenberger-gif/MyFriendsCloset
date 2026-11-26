import { describe, expect, it } from 'vitest'
import { exchangePrompt, hasOutfitBase, importAILooks, makeExchange } from './aiLookExchange'
import type { ClosetItem } from '../types'

function piece(id: number, category: string, ownerId = 'owner'): ClosetItem {
  return {
    id, name: `Piece ${id}`, category, ownerId, owner: 'Demo', size: 'SECRET_SIZE', brand: 'SECRET_BRAND',
    visibility: 'Private', color: 'Navy', glyph: 'PHOTO', imageData: 'data:image/png;base64,SECRET_PHOTO',
    occasionTags: ['SECRET_TAG'], notes: 'SECRET_NOTE', createdAt: '', updatedAt: '',
  }
}

const preferences = { occasion: 'Dinner', vibe: 'Effortless', conditions: 'Mild' } as const
const wardrobe = [piece(1, 'Tops'), piece(2, 'Bottoms'), piece(3, 'Dresses'), piece(4, 'Shoes', 'friend')]

describe('optional ChatGPT outfit exchange', () => {
  it('exports a reviewable prompt without photos, sizes, notes, tags, brand, friend or local IDs', () => {
    const exchange = makeExchange(wardrobe, preferences, 1)
    const prompt = exchangePrompt(exchange)
    expect(exchange.pieces.map(({ localId }) => localId)).toEqual([1, 2, 3])
    expect(prompt).not.toMatch(/SECRET|localId|Piece 4/)
    expect(prompt).toContain('"requiredPiece": "P1"')
    expect(prompt).toContain('"occasion": "Dinner"')
  })

  it('requires a real base and imports the chosen garment with its verified local IDs', () => {
    expect(hasOutfitBase([wardrobe[0], wardrobe[2]], 1)).toBe(false)
    expect(hasOutfitBase(wardrobe, 1)).toBe(true)
    const exchange = makeExchange(wardrobe, preferences, 1)
    const result = JSON.stringify({ requestId: exchange.id, looks: [{ pieces: ['P2', 'P1'], why: 'A matching palette' }] })
    expect(importAILooks(`\`\`\`json\n${result}\n\`\`\``, exchange)[0]).toMatchObject({
      id: 'ai-1-2', title: 'Piece 1 + Piece 2', itemIds: [2, 1], source: 'ai-import',
    })
    expect(() => importAILooks(result, makeExchange(wardrobe, preferences, 1))).toThrow(/different request/)
  })

  it('rejects unknown IDs, missing anchors, incomplete or conflicting bases, and duplicate looks', () => {
    const exchange = makeExchange(wardrobe, preferences, 1)
    const response = (...pieces: string[][]) => JSON.stringify({ requestId: exchange.id, looks: pieces.map((piece) => ({ pieces: piece, why: 'test' })) })
    expect(() => importAILooks(response(['P1', 'P20']), exchange)).toThrow(/not in the shared list/)
    expect(() => importAILooks(response(['P3']), exchange)).toThrow(/left out/)
    expect(() => importAILooks(response(['P1']), exchange)).toThrow(/outfit base/)
    expect(() => importAILooks(response(['P1', 'P3']), exchange)).toThrow(/outfit base/)
    expect(() => importAILooks(response(['P1', 'P1', 'P2']), exchange)).toThrow(/repeats/)
    expect(() => importAILooks(response(['P1', 'P2'], ['P2', 'P1']), exchange)).toThrow(/same look/)
  })
})
