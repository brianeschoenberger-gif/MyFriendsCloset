import { describe, expect, it } from 'vitest'
import { combinationKey, dateLabel, displayWearDate, recentlyWornSignatures, toggleWear } from './wearLog'

describe('local wear notes', () => {
  it('uses the device date and stores one entry per day', () => {
    expect(dateLabel(new Date(2026, 10, 26, 23, 59))).toBe('2026-11-26')
    expect(toggleWear(undefined, '2026-11-26')).toEqual(['2026-11-26'])
    expect(toggleWear(['2026-11-26'], '2026-11-26')).toEqual([])
    expect(toggleWear(['2026-11-24'], '2026-11-26')).toEqual(['2026-11-26', '2026-11-24'])
    expect(displayWearDate('invalid')).toBe('')
  })

  it('indexes actual combinations rather than look IDs, ignores future wear and stops at seven device dates', () => {
    const look = { id: 'imported-a', title: 'One', explanation: '', itemIds: [4, 2], occasion: 'Dinner', vibe: 'Quiet' }
    const recent = recentlyWornSignatures([
      { ...look, wornOn: ['2026-11-20'] },
      { ...look, itemIds: [5, 3], wornOn: ['2026-11-19', '2026-11-27'] },
      { ...look, itemIds: [3, 2], wornOn: ['2026-11-26'] },
    ], new Date(2026, 10, 26, 23, 34))
    expect(combinationKey([4, 2])).toBe('2-4')
    expect(recent).toEqual(new Set(['2-4', '2-3']))
  })
})
