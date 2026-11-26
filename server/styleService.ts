import { exchangeData, hasOutfitBase, importAILooks, makeMetadataExchange, type OutfitModelInput } from '../src/lib/aiLookExchange'
import { conditions, vibes, type StylePreferences } from '../src/lib/stylist'

export const metadataConsentVersion = 'wardrobe-metadata-v1' as const
const categories = new Set(['Tops', 'Bottoms', 'Dresses', 'Sets', 'Jackets', 'Shoes', 'Accessories'])

export type StyleActor = { userId: string; consentVersion: string | null }
export type OwnedMetadata = { id: string; ownerId: string; name: string; category: string; color: string; hasPhoto: boolean }
export type StyleServiceDependencies = {
  verifySession: (session: unknown) => Promise<StyleActor | null>
  listWardrobeMetadata: (ownerId: string) => Promise<OwnedMetadata[]>
  reserveRequestBudget: (ownerId: string) => Promise<boolean>
  runModel: (input: OutfitModelInput) => Promise<string>
}

type StyleRequest = StylePreferences & { consent: typeof metadataConsentVersion; anchorItemId?: string }
type Failure = { ok: false; reason: 'sign_in' | 'consent_required' | 'invalid_request' | 'missing_pieces' | 'limit' | 'use_local' }
type Success = { ok: true; looks: Array<{ itemIds: string[]; explanation: string }>; omittedCount: number }

function parseStyleRequest(value: unknown): StyleRequest | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (Object.keys(record).some((key) => !['consent', 'occasion', 'vibe', 'conditions', 'anchorItemId'].includes(key))) return null
  const { consent, occasion, vibe, conditions: temp, anchorItemId } = record
  if (consent !== metadataConsentVersion || typeof occasion !== 'string' || !occasion.trim() || occasion.length > 65 ||
    typeof vibe !== 'string' || !vibes.some((item) => item === vibe) || typeof temp !== 'string' || !conditions.some((item) => item === temp) ||
    (anchorItemId !== undefined && (typeof anchorItemId !== 'string' || !anchorItemId.trim() || anchorItemId.length > 128))) return null
  return { consent, occasion: occasion.trim(), vibe: vibe as StylePreferences['vibe'], conditions: temp as StylePreferences['conditions'], anchorItemId }
}

export async function suggestPrivateOutfits(session: unknown, input: unknown, deps: StyleServiceDependencies): Promise<Failure | Success> {
  try {
    const actor = await deps.verifySession(session)
    if (!actor?.userId) return { ok: false, reason: 'sign_in' }
    if (actor.consentVersion !== metadataConsentVersion) return { ok: false, reason: 'consent_required' }
    const request = parseStyleRequest(input)
    if (!request) return { ok: false, reason: 'invalid_request' }

    const metadata = await deps.listWardrobeMetadata(actor.userId)
    // A redundant owner check protects against a mis-scoped persistence adapter.
    const eligible = [...new Map(metadata.filter((item) => item.ownerId === actor.userId && item.hasPhoto &&
      categories.has(item.category) && typeof item.id === 'string' && item.id.length > 0 &&
      typeof item.name === 'string' && item.name.trim() && typeof item.color === 'string')
      .map((item) => [item.id, item])).values()]
    const index = eligible.findIndex((item) => item.id === request.anchorItemId)
    if (request.anchorItemId !== undefined && index < 0) return { ok: false, reason: 'missing_pieces' }
    const anchor = index >= 0 ? index + 1 : undefined
    // These temporary numeric IDs never enter the provider payload; the provider sees P1, P2, etc.
    const pieces = eligible.map(({ category, name, color }, i) => ({ id: i + 1, category, name: name.trim().slice(0, 80), color: color.trim().slice(0, 35) }))
    if (!hasOutfitBase(pieces, anchor)) return { ok: false, reason: 'missing_pieces' }

    const exchange = makeMetadataExchange(pieces, { occasion: request.occasion, vibe: request.vibe, conditions: request.conditions }, anchor)
    if (!await deps.reserveRequestBudget(actor.userId)) return { ok: false, reason: 'limit' }
    const raw = await deps.runModel(exchangeData(exchange))
    const validated = importAILooks(raw, exchange)
    if (!validated.length) return { ok: false, reason: 'use_local' }
    return { ok: true, omittedCount: exchange.omittedCount,
      looks: validated.map(({ itemIds, explanation }) => ({ itemIds: itemIds.map((id) => eligible[id - 1].id), explanation })) }
  } catch {
    // Don't return provider errors, request bodies, or garment metadata to untrusted callers.
    return { ok: false, reason: 'use_local' }
  }
}
