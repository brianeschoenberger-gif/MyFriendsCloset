import { describe, expect, it } from 'vitest'
import { makeWardrobeBackup, parseWardrobeArchive, parseWardrobeBackup, mergeLookBackup, mergeWardrobeBackup, planWardrobeRestore } from './wardrobeBackup'
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

describe('portable saved outfits', () => {
  const pants = { ...piece(2, white), category: 'Bottoms', name: 'Day pants' }
  const look = { id: 'custom-1-2', itemIds: [1, 2], anchorId: 1, source: 'custom' as const,
    title: 'Wear to dinner', occasion: 'Dinner', vibe: 'Effortless', explanation: 'A quick look', wornOn: ['2026-11-26'] }

  it('round-trips personal photos and wear dates and omits outfits with non-portable pieces', () => {
    const result = parseWardrobeArchive(makeWardrobeBackup([piece(), pants, { ...piece(3), ownerId: 'friend' }], [
      look, { ...look, id: 'mixed', itemIds: [1, 3] },
    ]))
    expect(result.items).toHaveLength(2)
    expect(result.items.every((entry) => entry.visibility === 'Private')).toBe(true)
    expect(result.looks).toEqual([look])
    expect(parseWardrobeArchive(makeWardrobeBackup([piece()])).looks).toEqual([])
  })

  it('refuses missing item IDs, malformed wear dates, and invalid anchors before applying an archive', () => {
    const data = JSON.parse(makeWardrobeBackup([piece(), pants], [look]))
    expect(() => parseWardrobeArchive(JSON.stringify({ ...data, looks: [{ ...look, itemIds: [1, 99] }] }))).toThrow(/missing clothes/)
    expect(() => parseWardrobeArchive(JSON.stringify({ ...data, looks: [{ ...look, wornOn: ['2026-02-30'] }] }))).toThrow(/wear dates/)
    expect(() => parseWardrobeArchive(JSON.stringify({ ...data, looks: [{ ...look, anchorId: 99 }] }))).toThrow(/focus piece/)
  })

  it('remaps colliding photos and merges wear history without replacing local labels or duplicating looks', () => {
    const local = [{ ...piece(1, white), name: 'Different shirt' }, { ...pants, id: 3 }]
    const plan = planWardrobeRestore(local, [piece(), pants])
    const newId = plan.ids.get(1)!
    expect(newId).not.toBe(1)
    expect(plan.ids.get(2)).toBe(3)
    const first = mergeLookBackup([], [look], plan.ids, plan.items)
    expect(first).toMatchObject({ added: 1, skipped: 0 })
    expect(first.looks[0]).toMatchObject({ itemIds: [newId, 3], anchorId: newId })
    const localEdited = [{ ...first.looks[0], title: 'Keep my label', wornOn: ['2026-11-24'] }]
    const again = planWardrobeRestore(plan.items, [piece(), pants])
    const merged = mergeLookBackup(localEdited, [look], again.ids, again.items)
    expect(merged).toMatchObject({ added: 0, historyEdits: 1 })
    expect(merged.looks).toHaveLength(1)
    expect(merged.looks[0]).toMatchObject({ title: 'Keep my label', wornOn: ['2026-11-26', '2026-11-24'] })
    expect(mergeLookBackup(merged.looks, [look], again.ids, again.items)).toMatchObject({ added: 0, historyEdits: 0 })
  })
})
