import type { OutfitLook } from '../types'

export function combinationKey(itemIds: number[]) {
  return [...itemIds].sort((a, b) => a - b).join('-')
}

export function recentlyWornSignatures(looks: OutfitLook[], reference: Date, days = 7) {
  const window = new Set<string>()
  const date = new Date(reference)
  for (let n = 0; n < days; n += 1) {
    window.add(dateLabel(date))
    date.setDate(date.getDate() - 1)
  }
  return new Set(looks.filter((look) => look.wornOn?.some((day) => window.has(day))).map((look) => combinationKey(look.itemIds)))
}

export function dateLabel(date: Date) {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function toggleWear(wornOn: string[] | undefined, date: string) {
  const days = new Set(wornOn ?? [])
  if (days.has(date)) days.delete(date)
  else days.add(date)
  return [...days].sort().reverse().slice(0, 365)
}

export function displayWearDate(date: string) {
  const timestamp = new Date(`${date}T12:00:00`)
  if (!Number.isFinite(timestamp.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(timestamp)
}
