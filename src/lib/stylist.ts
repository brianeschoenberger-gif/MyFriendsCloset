import type { ClosetItem, OutfitLook } from '../types'

export const vibes = ['Effortless', 'A little bold', 'Romantic'] as const
export type Vibe = typeof vibes[number]
export const conditions = ['Mild', 'Warm', 'Cool'] as const
export type Conditions = typeof conditions[number]
export type StylePreferences = { occasion: string; vibe: Vibe; conditions: Conditions }
type Candidate = { items: ClosetItem[]; score: number; key: string }
type Slot = 'top' | 'bottom' | 'one-piece' | 'shoe' | 'layer' | 'accessory'

const colorGroups = {
  neutral: ['black', 'white', 'cream', 'ivory', 'sand', 'tan', 'beige', 'gray', 'grey', 'navy', 'ink', 'denim', 'brown', 'cocoa', 'taupe', 'khaki', 'stone', 'offwhite', 'olive', 'charcoal'],
  soft: ['rose', 'blush', 'lavender', 'peach', 'sage', 'dusty', 'pink', 'lilac', 'powder', 'pastel'],
  accent: ['red', 'berry', 'orange', 'yellow', 'lime', 'fuchsia', 'cobalt', 'coral', 'teal', 'emerald', 'gold', 'honey', 'purple', 'green', 'blue'],
} as const
const occasionGroups = [
  ['work', 'office', 'meeting', 'professional', 'business'],
  ['party', 'wedding', 'formal', 'dressy', 'cocktail', 'birthday'],
  ['dinner', 'date', 'evening', 'night'],
  ['travel', 'vacation', 'trip', 'weekend'],
  ['casual', 'everyday', 'relaxed', 'brunch'],
] as const

function words(value: string) {
  return (value.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 1)
}
function occasionWords(value: string) {
  const found = new Set(words(value))
  for (const group of occasionGroups) if (group.some((w) => found.has(w))) group.forEach((w) => found.add(w))
  return found
}
function colorGroup(item: ClosetItem): keyof typeof colorGroups | 'unknown' {
  const terms = words(item.color)
  return (Object.keys(colorGroups) as (keyof typeof colorGroups)[]).find((group) => colorGroups[group].some((color) => terms.includes(color))) ?? 'unknown'
}
function slot(item: ClosetItem): Slot | undefined {
  switch (item.category.toLowerCase().trim()) {
    case 'tops': return 'top'
    case 'bottoms': return 'bottom'
    case 'dresses':
    case 'sets':
    case 'jumpsuits': return 'one-piece'
    case 'shoes': return 'shoe'
    case 'jackets': return 'layer'
    case 'accessories': return 'accessory'
  }
}
function matchesOccasion(item: ClosetItem, tags: Set<string>) {
  return item.occasionTags.some((tag) => words(tag).some((w) => tags.has(w)))
}

export function photographedPieces(items: ClosetItem[]) {
  return items.filter((item) => item.ownerId === 'owner' && Boolean(item.imageData))
}

export function closetGaps(items: ClosetItem[], anchorId?: number) {
  const anchor = items.find((item) => item.id === anchorId)
  if (anchor && slot(anchor) === 'top' && !items.some((item) => slot(item) === 'bottom')) return `Add a bottom to build around ${anchor.name}.`
  if (anchor && slot(anchor) === 'bottom' && !items.some((item) => slot(item) === 'top')) return `Add a top to build around ${anchor.name}.`
  const slots = new Set(items.map(slot))
  if (!slots.has('one-piece') && !(slots.has('top') && slots.has('bottom'))) {
    return slots.has('top') ? 'Add a bottom to pair with your top, or add a dress or set.' :
      slots.has('bottom') ? 'Add a top to pair with your bottom, or add a dress or set.' :
        'Start with a top and bottom, or a dress or set.'
  }
  return 'Add a different pair of shoes, layer, or accessory to get more variations.'
}

export function suggestLooks(items: ClosetItem[], pref: StylePreferences, take = 3, anchorId?: number): OutfitLook[] {
  const tags = occasionWords(pref.occasion)
  const eligible = [...new Map(items.map((item) => [item.id, item])).values()]
  const anchor = eligible.find((item) => item.id === anchorId)
  if (anchorId !== undefined && (!anchor || !slot(anchor))) return []
  const weights = new Map(eligible.map((item) => {
    const group = colorGroup(item)
    const occasion = matchesOccasion(item, tags)
    const vibe = pref.vibe === 'Effortless' ? Number(group === 'neutral') * 3 :
      pref.vibe === 'Romantic' ? Number(group === 'soft') * 5 :
        Number(group === 'accent') * 4
    const material = words(`${item.name} ${item.occasionTags.join(' ')}`)
    const warmPenalty = pref.conditions === 'Warm' && (slot(item) === 'layer' || ['wool', 'fleece', 'puffer'].some((w) => material.includes(w))) ? -6 : 0
    const coolBonus = pref.conditions === 'Cool' && slot(item) === 'layer' ? 7 : 0
    return [item.id, (occasion ? 12 : 0) + vibe + warmPenalty + coolBonus + Number(Boolean(item.imageData)) * 2 + Number(item.ownerId === 'owner')]
  }))
  const weight = (item: ClosetItem) => weights.get(item.id) ?? 0
  const pick = (kind: Slot, limit: number) => {
    if (anchor && slot(anchor) === kind) return [anchor]
    return eligible.filter((item) => slot(item) === kind).sort((a, b) => weight(b) - weight(a) || a.id - b.id).slice(0, limit)
  }
  const top = pick('top', 16)
  const bottom = pick('bottom', 16)
  const bases = [...pick('one-piece', 18).map((item) => [item]), ...top.flatMap((item) => bottom.map((lower) => [item, lower]))]
  const shoes = pick('shoe', 5)
  const layers = pref.conditions === 'Warm' && !(anchor && slot(anchor) === 'layer') ? [] : pick('layer', 3)
  const accessories = pick('accessory', 4)
  const candidates: Candidate[] = []
  const seen = new Set<string>()
  for (const base of bases) for (const shoe of shoes.length ? shoes : [undefined]) for (const layer of [undefined, ...layers]) for (const accessory of [undefined, ...accessories]) {
    const outfit = [...base, ...[shoe, layer, accessory].filter((item): item is ClosetItem => !!item)]
    if (anchor && !outfit.some((item) => item.id === anchor.id)) continue
    const accents = outfit.filter((item) => colorGroup(item) === 'accent').length
    const neutrals = outfit.some((item) => colorGroup(item) === 'neutral')
    const score = outfit.reduce((sum, item) => sum + weight(item), 0) / outfit.length +
      (shoe ? 3 : 0) + (accessory ? 2 : 0) + (layer && pref.conditions === 'Cool' ? 4 : 0) +
      (neutrals && accents === 1 ? 3 : 0) - Math.max(0, accents - (pref.vibe === 'A little bold' ? 2 : 1)) * 3
    const key = outfit.map((item) => item.id).sort((a, b) => a - b).join('-')
    if (!seen.has(key)) {
      candidates.push({ items: outfit, score, key })
      seen.add(key)
    }
  }

  const selected: Candidate[] = []
  while (selected.length < take && candidates.length) {
    const diversity = (look: Candidate) => look.score - Math.max(0, ...selected.map((prior) =>
      prior.items.filter((item) => look.items.some((other) => other.id === item.id)).length /
      Math.max(prior.items.length, look.items.length) * 9 +
      Number(prior.items[0].id === look.items[0].id) * 3))
    let best = 0
    let bestScore = diversity(candidates[0])
    for (let i = 1; i < candidates.length; i++) {
      const score = diversity(candidates[i])
      if (score > bestScore) { best = i; bestScore = score }
    }
    selected.push(candidates.splice(best, 1)[0])
  }
  return selected.map(({ items: pieces, key }) => {
    const tagged = pieces.filter((piece) => matchesOccasion(piece, tags))
    const layer = pieces.find((piece) => slot(piece) === 'layer')
    const shoe = pieces.find((piece) => slot(piece) === 'shoe')
    const colorBalance = pieces.some((piece) => colorGroup(piece) === 'neutral') && pieces.some((piece) => colorGroup(piece) === 'accent')
    const reason = [
      anchor ? `Built around ${anchor.name}.` : '',
      anchor && slot(anchor) === 'layer' && pref.conditions === 'Warm' ? 'Keep this layer handy instead of wearing it in the heat.' : '',
      tagged.length ? `${tagged.map((piece) => piece.name).join(', ')} ${tagged.length === 1 ? 'has' : 'have'} occasion tags that match.` : '',
      layer && pref.conditions === 'Cool' ? `${layer.name} adds a layer for cooler conditions.` : '',
      colorBalance ? 'A neutral piece balances the stronger color.' : '',
      !shoe ? 'No saved shoes yet; footwear is open.' : '',
    ].filter(Boolean).join(' ') || (slot(pieces[0]) === 'one-piece' ? 'Starts from a saved dress or set rather than inventing a missing piece.' : 'Pairs a saved top and bottom, with extras only where your closet has them.')
    return { id: key, title: slot(pieces[0]) === 'one-piece' ? pieces[0].name : `${pieces[0].name} + ${pieces[1].name}`, itemIds: pieces.map((item) => item.id), explanation: reason, occasion: pref.occasion.trim(), vibe: pref.vibe }
  })
}
