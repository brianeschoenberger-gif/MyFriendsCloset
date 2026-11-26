const labels: Record<string, string> = {
  Tops: 'Top', Bottoms: 'Bottoms', Dresses: 'Dress', Sets: 'Set', Jackets: 'Jacket', Shoes: 'Shoes', Accessories: 'Accessory',
}

export type BatchLabelInput = { name: string; category: string; color: string }

export function makeBatchLabels(rows: BatchLabelInput[]) {
  const used = new Set(rows.map(({ name }) => name.trim().toLocaleLowerCase()).filter(Boolean))
  const base = (row: BatchLabelInput) => [row.color.trim(), labels[row.category] || 'Garment'].filter(Boolean).join(' ')
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (row.name.trim()) continue
    const key = base(row).toLocaleLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return rows.map((row) => {
    const name = row.name.trim()
    if (name) return name
    const stem = base(row)
    const key = stem.toLocaleLowerCase()
    let label = stem
    if ((counts.get(key) ?? 0) > 1 || used.has(key)) {
      let number = 1
      do { label = `${stem} ${number++}` } while (used.has(label.toLocaleLowerCase()))
    }
    used.add(label.toLocaleLowerCase())
    return label
  })
}
