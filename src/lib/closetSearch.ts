import type { ClosetItem, Visibility } from '../types'

export type ClosetFilters = { category: string; photoOnly: boolean; visibility: 'Any' | Visibility; query: string; order: 'Recent' | 'A–Z' }
const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

export function filterCloset(items: ClosetItem[], { category, photoOnly, visibility, query, order }: ClosetFilters) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    if ((category !== 'All' && item.category !== category) || (photoOnly && !item.imageData) ||
      (visibility !== 'Any' && item.visibility !== visibility)) return false
    const words = normalize([item.name, item.brand, item.category, item.color, ...item.occasionTags].join(' '))
    return terms.every((term) => words.includes(term))
  }).sort((a, b) => Number(Boolean(b.imageData)) - Number(Boolean(a.imageData)) ||
    (order === 'A–Z' ? a.name.localeCompare(b.name) : b.createdAt.localeCompare(a.createdAt) || b.id - a.id))
}
