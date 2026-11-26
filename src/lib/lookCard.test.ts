import { describe, expect, it } from 'vitest'
import { canMakeLookCard, coverCrop } from './lookCard'
import type { ClosetItem } from '../types'

const photo = 'data:image/png;base64,AAAA=='
const item = (imageData: string | undefined = photo, ownerId = 'owner'): ClosetItem => ({
  id: 99, ownerId, name: 'Linen shirt', owner: 'Demo', category: 'Tops', size: '', brand: '', visibility: 'Private', color: '', glyph: '', imageData, occasionTags: [], notes: '', createdAt: '', updatedAt: '',
})

describe('local outfit cards', () => {
  it('uses only locally saved owner raster photos within the supported item count', () => {
    expect(canMakeLookCard([item(), item()])).toBe(true)
    expect(canMakeLookCard([item()])).toBe(false)
    expect(canMakeLookCard(Array.from({ length: 7 }, () => item()))).toBe(false)
    expect(canMakeLookCard([item(), item('https://example.com/garment.jpg')])).toBe(false)
    expect(canMakeLookCard([item(), item('data:image/svg+xml;base64,AAAA==')])).toBe(false)
    expect(canMakeLookCard([item(), item(photo, 'friend')])).toBe(false)
    expect(canMakeLookCard([item(), item('')])).toBe(false)
  })

  it('centers photos without distorting landscape, portrait, or matching proportions', () => {
    expect(coverCrop(400, 200, 100, 100)).toEqual([100, 0, 200, 200])
    expect(coverCrop(200, 400, 100, 100)).toEqual([0, 100, 200, 200])
    expect(coverCrop(400, 200, 100, 50)).toEqual([0, 0, 400, 200])
  })
})
