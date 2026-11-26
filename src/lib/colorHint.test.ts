import { describe, expect, it } from 'vitest'
import { guessColorFromPixels } from './colorHint'

const repeated = (rgb: number[], count = 36) => Array.from({ length: count }, () => rgb).flat()
describe('on-device color hints', () => {
  it('labels an unambiguous navy, neutral, and muted warm color', () => {
    expect(guessColorFromPixels(repeated([50, 73, 104, 255]))).toBe('Navy')
    expect(guessColorFromPixels(repeated([235, 235, 235, 255]))).toBe('White')
    expect(guessColorFromPixels(repeated([218, 196, 160, 255]))).toBe('Beige')
  })
  it('declines to guess on transparent or evenly mixed images', () => {
    expect(guessColorFromPixels(repeated([13, 18, 22, 0]))).toBeUndefined()
    expect(guessColorFromPixels([...repeated([255, 0, 0, 255]), ...repeated([0, 135, 0, 255])])).toBeUndefined()
  })
})
