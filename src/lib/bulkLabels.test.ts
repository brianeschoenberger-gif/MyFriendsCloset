import { describe, expect, it } from 'vitest'
import { makeBatchLabels } from './bulkLabels'

describe('quick-intake garment names', () => {
  it('preserves manual names, fixes irregular plurals, and distinguishes otherwise identical defaults', () => {
    expect(makeBatchLabels([
      { category: 'Dresses', name: '', color: '' },
      { category: 'Tops', name: 'Top 1', color: '' },
      { category: 'Tops', name: '', color: '' },
      { category: 'Tops', name: '', color: '' },
      { category: 'Shoes', name: '', color: 'Tan' },
      { category: 'Accessories', name: '  Polka dots  ', color: '' },
    ])).toEqual(['Dress', 'Top 1', 'Top 2', 'Top 3', 'Tan Shoes', 'Polka dots'])
  })
})
