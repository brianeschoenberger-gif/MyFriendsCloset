import { describe, expect, it } from 'vitest'
import { compareTwoLooks } from './compareLooks'

const look = (id: string, itemIds: number[]) => ({ id, itemIds, title: id, explanation: '', occasion: 'Dinner', vibe: 'Effortless' })

describe('side-by-side outfit comparison', () => {
  it('recognizes when sources chose the same pieces in a different order', () => {
    expect(compareTwoLooks(look('a', [1, 3]), look('b', [3, 1]), false)).toEqual({ kind: 'same' })
  })

  it('supports either presentation order without changing the underlying source labels', () => {
    const first = look('a', [1, 3])
    const second = look('b', [2, 3])
    expect(compareTwoLooks(first, second, true)).toMatchObject({ picks: [{ look: second, source: 'ChatGPT import' }, { look: first, source: 'Built-in stylist' }] })
    expect(compareTwoLooks(first, second, false)).toMatchObject({ picks: [{ look: first, source: 'Built-in stylist' }, { look: second, source: 'ChatGPT import' }] })
  })
})
