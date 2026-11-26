import type { ClosetItem, OutfitLook } from '../types'

function slot(category: string) {
  return ['Dresses', 'Sets', 'Jumpsuits'].includes(category) ? 'Dress or set' : category
}

export function getSwapOptions(look: OutfitLook, targetId: number, wardrobe: ClosetItem[]) {
  const target = wardrobe.find((item) => item.id === targetId)
  if (!target || !look.itemIds.includes(targetId) || look.anchorId === targetId) return []
  const already = new Set(look.itemIds)
  return wardrobe.filter((item) => item.ownerId === 'owner' && !!item.imageData &&
    slot(item.category) === slot(target.category) && !already.has(item.id))
    .sort((a, b) => Number(b.color.toLowerCase() === target.color.toLowerCase()) - Number(a.color.toLowerCase() === target.color.toLowerCase()) ||
      a.name.localeCompare(b.name))
}

export function swapLook(look: OutfitLook, targetId: number, replacementId: number, wardrobe: ClosetItem[]): OutfitLook | undefined {
  const replacement = getSwapOptions(look, targetId, wardrobe).find((item) => item.id === replacementId)
  const target = wardrobe.find((item) => item.id === targetId)
  if (!replacement || !target) return
  const itemIds = look.itemIds.map((id) => id === targetId ? replacementId : id)
  const fullLook = itemIds.map((id) => wardrobe.find((item) => item.id === id))
  if (fullLook.some((item) => !item)) return
  const base = fullLook.flatMap((item) => item && ['Tops', 'Bottoms', 'Dress or set'].includes(slot(item.category)) ? [item.name] : [])
  const key = itemIds.slice().sort((a, b) => a - b).join('-')
  return {
    ...look, id: `custom-${key}`, itemIds,
    title: base.join(' + ') || look.title,
    explanation: `You swapped ${target.name} for ${replacement.name}; your other pieces stayed the same.`,
    source: 'custom',
  }
}
