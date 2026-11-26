import type { OutfitLook } from '../types'
import { combinationKey } from './wearLog'

export type ComparisonPick = { look: OutfitLook; source: 'Built-in stylist' | 'ChatGPT import' }
export type LookComparison = { kind: 'same' } | { kind: 'pair'; picks: [ComparisonPick, ComparisonPick] }

export function compareTwoLooks(local: OutfitLook, imported: OutfitLook, putImportFirst: boolean): LookComparison {
  if (combinationKey(local.itemIds) === combinationKey(imported.itemIds)) return { kind: 'same' }
  const builtin: ComparisonPick = { look: local, source: 'Built-in stylist' }
  const external: ComparisonPick = { look: imported, source: 'ChatGPT import' }
  return { kind: 'pair', picks: putImportFirst ? [external, builtin] : [builtin, external] }
}

export function randomizedLookComparison(local: OutfitLook, imported: OutfitLook) {
  const byte = globalThis.crypto.getRandomValues(new Uint8Array(1))[0]
  return compareTwoLooks(local, imported, byte < 128)
}
