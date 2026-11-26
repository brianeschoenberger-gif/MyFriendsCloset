import { describe, expect, it } from 'vitest'
import { findExactPhotoDuplicates } from './photoDuplicates'

describe('exact photo warnings', () => {
  it('distinguishes copies already in the closet from repeats within the same upload', () => {
    expect(findExactPhotoDuplicates(['a', 'b', 'b', 'a', 'c'], new Set(['a']))).toEqual([
      { kind: 'saved' }, undefined, { kind: 'batch', first: 2 }, { kind: 'saved' }, undefined,
    ])
  })

  it('does not mistake similar or merely differently compressed files for exact copies', () => {
    expect(findExactPhotoDuplicates(['photo-v1', 'photo-v2'], new Set(['photo-v0']))).toEqual([undefined, undefined])
  })
})
