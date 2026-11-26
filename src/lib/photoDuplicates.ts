type Duplicate = { kind: 'saved' } | { kind: 'batch'; first: number }

export function findExactPhotoDuplicates(photos: string[], existing: ReadonlySet<string>): Array<Duplicate | undefined> {
  const firstAt = new Map<string, number>()
  return photos.map((photo, index) => {
    const earlier = firstAt.get(photo)
    const candidate = existing.has(photo) ? { kind: 'saved' as const } :
      earlier === undefined ? undefined : { kind: 'batch' as const, first: earlier }
    if (earlier === undefined) firstAt.set(photo, index + 1)
    return candidate
  })
}
