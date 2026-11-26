// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { makeOpenAIOutfitProvider } from './openaiOutfits'
import { metadataConsentVersion, suggestPrivateOutfits, type StyleServiceDependencies } from './styleService'

const ask = { consent: metadataConsentVersion, occasion: 'Dinner', vibe: 'Effortless', conditions: 'Mild' }
const photos = [
  { id: 'item-s0', ownerId: 'account-a', name: 'Top', category: 'Tops', color: 'Ivory', hasPhoto: true, imageData: 'LOCAL_PHOTO' },
  { id: 'item-s1', ownerId: 'account-a', name: 'Pants', category: 'Bottoms', color: 'Blue', hasPhoto: true, notes: 'LOCAL_NOTE' },
  { id: 'item-other', ownerId: 'account-b', name: 'OTHER_ACCOUNT_CLOTHES', category: 'Shoes', color: 'Tan', hasPhoto: true },
  { id: 'item-s3', ownerId: 'account-a', name: 'DEMO_PLACEHOLDER', category: 'Shoes', color: 'Tan', hasPhoto: false },
]

function createDeps() {
  return {
    verifySession: vi.fn<StyleServiceDependencies['verifySession']>().mockResolvedValue({ userId: 'account-a', consentVersion: metadataConsentVersion }),
    listWardrobeMetadata: vi.fn<StyleServiceDependencies['listWardrobeMetadata']>().mockResolvedValue(photos),
    reserveRequestBudget: vi.fn<StyleServiceDependencies['reserveRequestBudget']>().mockResolvedValue(true),
    runModel: vi.fn<StyleServiceDependencies['runModel']>().mockImplementation(async ({ requestId }) =>
      JSON.stringify({ requestId, looks: [{ pieces: ['P1', 'P2'], why: 'A relaxed combination.' }] })),
  }
}

describe('private hosted stylist preparation', () => {
  it('never reads wardrobe data or calls the model before verifying sign-in and consent', async () => {
    const deps = createDeps()
    deps.verifySession.mockResolvedValueOnce(null).mockResolvedValueOnce({ userId: 'account-a', consentVersion: null })
    expect(await suggestPrivateOutfits('bad-token', ask, deps)).toEqual({ ok: false, reason: 'sign_in' })
    expect(await suggestPrivateOutfits('verified-without-consent', ask, deps)).toEqual({ ok: false, reason: 'consent_required' })
    expect(deps.listWardrobeMetadata).not.toHaveBeenCalled()
    expect(deps.runModel).not.toHaveBeenCalled()
  })

  it('does not accept forged identities, extra payload data, or anchors from another closet', async () => {
    const deps = createDeps()
    expect(await suggestPrivateOutfits('session', { ...ask, userId: 'account-b' }, deps)).toEqual({ ok: false, reason: 'invalid_request' })
    expect(await suggestPrivateOutfits('session', { ...ask, anchorItemId: 'item-other' }, deps)).toEqual({ ok: false, reason: 'missing_pieces' })
    expect(deps.runModel).not.toHaveBeenCalled()
    expect(deps.reserveRequestBudget).not.toHaveBeenCalled()
  })

  it('sends only scoped text through the budget gate and remaps provider codes to verified garments', async () => {
    const deps = createDeps()
    const response = await suggestPrivateOutfits('session', { ...ask, anchorItemId: 'item-s0' }, deps)
    expect(deps.listWardrobeMetadata).toHaveBeenCalledWith('account-a')
    expect(deps.reserveRequestBudget).toHaveBeenCalledWith('account-a')
    expect(response).toEqual({ ok: true, omittedCount: 0, looks: [{ itemIds: ['item-s0', 'item-s1'], explanation: 'A relaxed combination.' }] })
    const [data] = deps.runModel.mock.calls[0]
    expect(data.requiredPiece).toBe('P1')
    expect(data.clothes).toEqual([
      { code: 'P1', name: 'Top', category: 'Tops', color: 'Ivory' },
      { code: 'P2', name: 'Pants', category: 'Bottoms', color: 'Blue' },
    ])
    expect(JSON.stringify(data)).not.toMatch(/account-|item-|LOCAL_|OTHER_ACCOUNT|DEMO_PLACEHOLDER/)
  })

  it('returns a safe fallback on exhausted budget, unknown codes, or provider errors', async () => {
    const deps = createDeps()
    deps.reserveRequestBudget.mockResolvedValueOnce(false)
    expect(await suggestPrivateOutfits('session', ask, deps)).toEqual({ ok: false, reason: 'limit' })
    expect(deps.runModel).not.toHaveBeenCalled()
    deps.runModel.mockImplementationOnce(async ({ requestId }) => JSON.stringify({ requestId, looks: [{ pieces: ['P1', 'P99'], why: 'Invented' }] }))
    expect(await suggestPrivateOutfits('session', ask, deps)).toEqual({ ok: false, reason: 'use_local' })
    deps.runModel.mockRejectedValueOnce(new Error('provider debug data'))
    expect(await suggestPrivateOutfits('session', ask, deps)).toEqual({ ok: false, reason: 'use_local' })
  })
})

describe('OpenAI adapter with a stub transport', () => {
  it('makes a bounded structured request, requires completion, and treats refusal as unavailable', async () => {
    const output = '{"requestId":"request-demo","looks":[]}'
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({
      status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: output }] }],
    })).mockResolvedValueOnce(Response.json({
      status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'No' }] }],
    }))
    const run = makeOpenAIOutfitProvider({ apiKey: 'fixture-value-not-a-key', model: 'fixture-model', fetcher: transport })
    const input = { requestId: 'request-demo', preferences: { occasion: 'Dinner', vibe: 'Effortless', conditions: 'Mild' } as const, requiredPiece: null,
      clothes: [{ code: 'P1', name: 'Dress', category: 'Dresses', color: 'Black' }] }
    expect(await run(input)).toBe(output)
    const [url, options] = transport.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/responses')
    expect(options?.redirect).toBe('error')
    const body = JSON.parse(String(options?.body))
    expect(body).toMatchObject({ store: false, max_output_tokens: 700, text: { format: { strict: true, type: 'json_schema' } } })
    expect(body).not.toHaveProperty('tools')
    expect(body.input[1].content).toBe(JSON.stringify(input))
    await expect(run(input)).rejects.toThrow('could not be used')
  })
})
