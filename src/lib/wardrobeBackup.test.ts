import { describe, expect, it } from 'vitest'
import { makeWardrobeBackup, parseWardrobeBackup, mergeWardrobeBackup } from './wardrobeBackup'
import type { ClosetItem } from '../types'

const black = 'data:image/png;base64,QUJD'
const white = 'data:image/jpeg;base64,REVG'
function piece(id = 1, imageData = black): ClosetItem {
  return {
    id, ownerId: 'owner', owner: 'Brian', glyph: 'PHOTO', name: 'Cotton tee',
    category: 'Tops', size: '', brand: '', visibility: 'Borrowable', color: 'Black', imageData,
    occasionTags: ['Travel'], notes: 'Wash cold', createdAt: '2026-11-26T00:00:00.000Z', updatedAt: '2026-11-26T00:00:00.000Z',
  }
}

describe('wardrobe backups', () => {
  it('backs up only owner photos; restores their details but strips sharing from imports', () => {
    const exported = parseWardrobeBackup(makeWardrobeBackup([
      piece(), { ...piece(2), ownerId: 'friend' }, { ...piece(3), imageData: undefined },
    ]))
    expect(exported).toHaveLength(1)
    expect(exported[0]).toMatchObject({ id: 1, name: 'Cotton tee', notes: 'Wash cold', imageData: black, visibility: 'Private', occasionTags: ['Travel'] })
  })

  it('refuses external images, scripts, unknown versions, and duplicate IDs before restoring', () => {
    const backup = JSON.parse(makeWardrobeBackup([piece()]))
    expect(() => parseWardrobeBackup(JSON.stringify({ ...backup, format: 'unknown' }))).toThrow()
    expect(() => parseWardrobeBackup(JSON.stringify({ ...backup, items: [backup.items[0], backup.items[0]] }))).toThrow(/duplicate/)
    for (const imageData of ['https://example.com/photo.png', 'data:image/svg+xml;base64,QQ==', 'javascript:alert(1)']) {
      expect(() => parseWardrobeBackup(JSON.stringify({ ...backup, items: [{ ...backup.items[0], imageData }] }))).toThrow(/unsupported photo/)
    }
  })

  it('preserves current edits, skips duplicate restores, and rekeys a genuinely different piece with an ID collision', () => {
    const edited = { ...piece(), name: 'My edited name' }
    const left = mergeWardrobeBackup([edited], [piece()])
    expect(left).toEqual([edited])
    const merged = mergeWardrobeBackup(left, [piece(1, white)])
    expect(merged).toHaveLength(2)
    expect(merged[1].id).not.toBe(1)
    expect(merged[1].visibility).toBe('Private')
    expect(mergeWardrobeBackup(merged, [piece(1, white)])).toEqual(merged)
  })
})
