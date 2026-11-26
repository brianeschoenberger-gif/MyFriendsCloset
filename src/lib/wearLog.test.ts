import { describe, expect, it } from 'vitest'
import { dateLabel, displayWearDate, toggleWear } from './wearLog'

describe('local wear notes', () => {
  it('uses the device date and stores one entry per day', () => {
    expect(dateLabel(new Date(2026, 10, 26, 23, 59))).toBe('2026-11-26')
    expect(toggleWear(undefined, '2026-11-26')).toEqual(['2026-11-26'])
    expect(toggleWear(['2026-11-26'], '2026-11-26')).toEqual([])
    expect(toggleWear(['2026-11-24'], '2026-11-26')).toEqual(['2026-11-26', '2026-11-24'])
    expect(displayWearDate('invalid')).toBe('')
  })
})
