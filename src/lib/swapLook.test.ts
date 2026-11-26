import { describe, expect, it } from 'vitest'
import { getSwapOptions, swapLook } from './swapLook'
import type { ClosetItem, OutfitLook } from '../types'

function item(id: number, name: string, category: string, ownerId = 'owner'): ClosetItem {
  return { id, name, category, ownerId, owner: 'Test', color: 'Navy', imageData: 'test', visibility: 'Private',
    size: '', brand: '', notes: '', occasionTags: [], glyph: 'PHOTO', createdAt: '', updatedAt: '' }
}
const tailor = [item(1, 'Tee', 'Tops'), item(2, 'Jeans', 'Bottoms'), item(3, 'Chinos', 'Bottoms'), item(4, 'Other Tee', 'Tops'),
  item(5, 'Boots', 'Shoes'), item(6, 'Friend Jeans', 'Bottoms', 'friend'), { ...item(7, 'Demo Jeans', 'Bottoms'), imageData: undefined }]
const look: OutfitLook = { id: '1-2-5', itemIds: [1, 2, 5], anchorId: 1, title: 'Tee + Jeans', explanation: '', occasion: 'Dinner', vibe: 'Effortless' }
describe('one-piece swaps', () => {
  it('offers only eligible photographed owner pieces from the same slot and protects an anchor', () => {
    expect(getSwapOptions(look, 2, tailor).map(({ id }) => id)).toEqual([3])
    expect(getSwapOptions(look, 1, tailor)).toEqual([])
    expect(swapLook(look, 2, 4, tailor)).toBeUndefined()
    expect(swapLook(look, 1, 4, tailor)).toBeUndefined()
  })
  it('saves the variant separately, preserves the other garments, and keeps the original untouched', () => {
    expect(swapLook(look, 2, 3, tailor)).toMatchObject({
      id: 'custom-1-3-5', title: 'Tee + Chinos', itemIds: [1, 3, 5], anchorId: 1, source: 'custom',
    })
    expect(look.itemIds).toEqual([1, 2, 5])
  })
})
