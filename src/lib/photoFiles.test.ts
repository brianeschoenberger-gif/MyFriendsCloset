import { describe, expect, it } from 'vitest'
import { photoDecodeMessage, usablePhoto } from './photoFiles'

describe('camera and photo library files', () => {
  it('preserves correctly tagged photos and uses a known extension when the picker omits the MIME type', () => {
    const normal = new File(['bytes'], 'Photo.JPG', {type: 'image/jpeg', lastModified: 1234})
    expect(usablePhoto(normal, 100)).toBe(normal)
    expect(usablePhoto(new File(['bytes'], 'Photo.JPG', {lastModified: 1234}), 100)).toMatchObject({ name: 'Photo.JPG', type: 'image/jpeg', lastModified: 1234 })
    const generic = usablePhoto(new File(['bytes'], 'From-camera.HEIC', {type: 'application/octet-stream'}), 100)
    expect(generic.type).toBe('image/heic')
    expect(photoDecodeMessage(generic)).toMatch(/try a JPEG copy/i)
  })

  it('rejects incompatible types even if renamed, and gives separate empty and size errors', () => {
    expect(() => usablePhoto(new File(['text'], 'not-a-photo.jpg', {type: 'text/plain'}), 100)).toThrow(/supported photo/)
    expect(() => usablePhoto(new File(['bytes'], 'vector.svg', {type: 'image/svg+xml'}), 100)).toThrow(/vector images/i)
    expect(() => usablePhoto(new File([], 'zero.png'), 100)).toThrow(/empty/)
    expect(() => usablePhoto(new File(['bytes'], 'photo.png'), 2)).toThrow(/under/)
  })
})
