import { useRef, useState } from 'react'
import { Copy, Sparkles, X } from 'lucide-react'
import { exchangePrompt, importAILooks, makeExchange } from '../lib/aiLookExchange'
import type { StylePreferences } from '../lib/stylist'
import type { ClosetItem, OutfitLook } from '../types'

export function AILookPanel({ pieces, preferences, anchorId, close, onLooks }: {
  pieces: ClosetItem[]
  preferences: StylePreferences
  anchorId?: number
  close: () => void
  onLooks: (looks: OutfitLook[], sharedItemIds: number[]) => void
}) {
  const [exchange, setExchange] = useState(() => makeExchange(pieces, preferences, anchorId))
  const [includeNames, setIncludeNames] = useState(true)
  const prompt = exchangePrompt(exchange, includeNames)
  const [reply, setReply] = useState('')
  const [message, setMessage] = useState('')
  const [problem, setProblem] = useState('')
  const promptBox = useRef<HTMLTextAreaElement>(null)

  async function copyPrompt() {
    setMessage('')
    try {
      await navigator.clipboard.writeText(prompt)
      setMessage('Prompt copied. Paste it into your ChatGPT chat.')
    } catch {
      promptBox.current?.focus()
      promptBox.current?.select()
      setMessage('Prompt selected. Use your device’s Copy command.')
    }
  }

  return <section className="page-container ai-look-panel" aria-labelledby="ai-look-heading">
    <div className="ai-look-header">
      <div><p className="eyebrow">Optional AI handoff</p><h2 id="ai-look-heading">Get another take in ChatGPT</h2></div>
      <button className="icon-button" type="button" aria-label="Close ChatGPT handoff" onClick={close}><X size={20} /></button>
    </div>
    <p>This app sends nothing automatically. If you paste this prompt into ChatGPT, it shares your occasion, vibe, conditions, plus {includeNames ? 'the names, categories and colors' : 'only the categories and colors'} of {exchange.pieces.length} pieces. It never includes photos, notes, sizing, or friend items. Keep this tab open so the app can match the reply to this prompt.</p>
    {exchange.omittedCount > 0 && <p>To keep the prompt short, it uses up to 60 pieces across your categories. {exchange.omittedCount} other pieces were left out.</p>}
    <label className="ai-name-choice"><input type="checkbox" checked={!includeNames} onChange={(event) => {
      setIncludeNames(!event.target.checked)
      setExchange(makeExchange(pieces, preferences, anchorId))
      setReply('')
      setProblem('')
      setMessage('Prompt updated. Recopy it before requesting another look.')
    }} /> <span>Keep my garment names out of this prompt</span></label>
    <label>1. Review and copy the prompt<textarea ref={promptBox} value={prompt} rows={6} readOnly spellCheck={false} /></label>
    <div className="ai-look-actions">
      <button className="secondary-button" type="button" onClick={() => void copyPrompt()}><Copy size={16} /> Copy outfit prompt</button>
      <a className="secondary-button" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT in a new tab</a>
    </div>
    {message && <p role="status">{message}</p>}
    <form onSubmit={(event) => {
      event.preventDefault()
      setProblem('')
      try {
        const looks = importAILooks(reply, exchange)
        if (!looks.length) { setProblem('The reply didn’t contain a wearable look. Try the local stylist or ask ChatGPT to try again.'); return }
        onLooks(looks, exchange.pieces.map((piece) => piece.localId))
      } catch (error) { setProblem(error instanceof Error ? error.message : 'Could not import those looks.') }
    }}>
      <label>2. Paste the ChatGPT reply<textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={25_000} rows={5} placeholder="Paste the JSON reply here" spellCheck={false} /></label>
      {problem && <p role="alert" className="form-error">{problem}</p>}
      <button className="primary-button" type="submit" disabled={!reply.trim()}><Sparkles size={17} /> Import AI looks</button>
    </form>
  </section>
}
