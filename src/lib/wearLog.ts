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
