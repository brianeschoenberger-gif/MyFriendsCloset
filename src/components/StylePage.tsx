import { useState, type ReactNode } from 'react'
import { Check, Heart, Plus, Shirt, Sparkles, Users } from 'lucide-react'
import { friendItems, initialItems } from '../data/mockData'
import type { StorageFailure } from '../lib/storage'
import { closetGaps, conditions, photographedPieces, suggestLooks, vibes, type Conditions, type StylePreferences, type Vibe } from '../lib/stylist'
import type { ClosetItem, OutfitLook } from '../types'
import { ItemVisual } from './ClosetUI'
import { AILookPanel } from './AILookPanel'
import { SwapRack } from './SwapRack'
import { swapLook } from '../lib/swapLook'
import { combinationKey, dateLabel, displayWearDate, recentlyWornSignatures, toggleWear } from '../lib/wearLog'
import { hasOutfitBase } from '../lib/aiLookExchange'
import { canMakeLookCard } from '../lib/lookCard'
import { LookCardDownload } from './LookCardDownload'

type Result = { looks: OutfitLook[]; preferences: StylePreferences; gaps: string; demo: boolean; ai?: boolean; preferFresh?: boolean }

type StylePageProps = {
  onItem: (item: ClosetItem) => void
  onAdd: () => void
  items: ClosetItem[]
  initialAnchorId?: number
  saved: OutfitLook[]
  setSaved: (update: (current: OutfitLook[]) => OutfitLook[]) => boolean
  storageError: StorageFailure | null
}

export function StylePage({ onItem, onAdd, items, initialAnchorId, saved, setSaved, storageError }: StylePageProps) {
  const [anchorId, setAnchorId] = useState(initialAnchorId)
  const [occasion, setOccasion] = useState('Everyday')
  const [vibe, setVibe] = useState<Vibe>('Effortless')
  const [condition, setCondition] = useState<Conditions>('Mild')
  const [includeDemo, setIncludeDemo] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [draftSwaps, setDraftSwaps] = useState<Record<string, OutfitLook>>({})
  const [showAI, setShowAI] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [preferFresh, setPreferFresh] = useState(false)
  const realPieces = photographedPieces(items)
  const anchor = realPieces.find((piece) => piece.id === anchorId)
  const demoPieces = [...items.filter((item) => !item.imageData), ...friendItems.filter((item) => item.visibility === 'Borrowable')]
  const source = includeDemo ? [...realPieces, ...(demoPieces.length ? demoPieces : initialItems)] : realPieces
  const itemById = new Map([...items, ...friendItems].map((item) => [item.id, item]))
  const resolve = (look: OutfitLook) => look.itemIds.map((id) => itemById.get(id)).filter((item): item is ClosetItem => typeof item !== 'undefined')
  const validSaved = saved.filter((look) => resolve(look).length === look.itemIds.length)
  const visibleLooks = (result?.looks ?? []).filter((look) => resolve(look).length === look.itemIds.length)
  const selectedOccasion = occasion.trim() || 'Everyday'
  const now = new Date()
  const today = dateLabel(now)
  const recentWear = recentlyWornSignatures(validSaved, now)
  const currentPreferences = { occasion: selectedOccasion, vibe, conditions: condition }
  const aiReady = hasOutfitBase(realPieces, anchor?.id)

  function handleGenerate() {
    const preferences = currentPreferences
    setDraftSwaps({})
    const requestedFresh = preferFresh && recentWear.size > 0
    setResult({ looks: suggestLooks(source, preferences, 3, anchor?.id, requestedFresh ? recentWear : undefined), preferences, gaps: closetGaps(source, anchor?.id), demo: includeDemo, preferFresh: requestedFresh })
    setShowSaved(false)
  }

  function toggleSave(look: OutfitLook) {
    setSaved((current) => current.some((entry) => entry.id === look.id) ? current.filter((entry) => entry.id !== look.id) : [look, ...current].slice(0, 60))
  }

  function markWorn(look: OutfitLook) {
    setSaved((current) => current.map((item) => item.id === look.id ? { ...item, wornOn: toggleWear(item.wornOn, today) } : item))
  }

  return <section className="style-page">
    <div className="style-intro page-container"><p className="eyebrow">The wardrobe you already own</p><h1>What are we<br /><em>dressing for?</em></h1><p>Build outfits from your photographed clothes. This preview matches pieces locally using category, color, and occasion rules. No AI service or photo uploads to a server.</p></div>
    <form className="style-form page-container" onSubmit={(event) => { event.preventDefault(); handleGenerate() }}>
      <label>Occasion<input value={occasion} placeholder="Work, dinner, weekend..." maxLength={65} onChange={(event) => setOccasion(event.target.value)} /></label>
      <fieldset><legend>Vibe</legend><div className="choice-row">{vibes.map((option) => <button type="button" key={option} className={vibe === option ? 'choice selected' : 'choice'} aria-pressed={vibe === option} onClick={() => setVibe(option)}>{option}</button>)}</div></fieldset>
      <fieldset><legend>Conditions</legend><div className="choice-row">{conditions.map((option) => <button type="button" key={option} className={condition === option ? 'choice selected' : 'choice'} aria-pressed={condition === option} onClick={() => setCondition(option)}>{option}</button>)}</div></fieldset>
      {!!realPieces.length && <div className="style-anchor">
        <label>Build around<select value={anchor?.id ?? ''} onChange={(event) => {
          setAnchorId(event.target.value ? Number(event.target.value) : undefined)
          setResult(null)
          setShowSaved(false)
        }}><option value="">Any saved piece</option>{realPieces.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.category}</option>)}</select></label>
        {anchor && <div className="style-anchor-piece"><ItemVisual item={anchor} compact /><p><strong>{anchor.name}</strong><br />Every outfit will include this piece.</p></div>}
      </div>}
      <div className="style-source"><div><strong>{realPieces.length} photographed {realPieces.length === 1 ? 'piece' : 'pieces'}</strong><button type="button" className="text-button" onClick={onAdd}><Plus size={16} /> Add a piece</button></div><label className="demo-toggle"><input type="checkbox" checked={includeDemo} onChange={(event) => { setIncludeDemo(event.target.checked); setResult(null) }} /><span>Include labeled sample pieces</span></label></div>
      {recentWear.size > 0 && <label className="demo-toggle fresh-toggle"><input type="checkbox" checked={preferFresh} onChange={(event) => { setPreferFresh(event.target.checked); setResult(null) }} /><span>Prefer outfits I haven’t worn in the last 7 days</span></label>}
      <div className="style-submit"><button className="primary-button generate" type="submit"><Sparkles size={19} /> Build my looks</button><button type="button" className="secondary-button" aria-pressed={showSaved} onClick={() => setShowSaved(!showSaved)}><Heart size={16} /> Saved looks ({validSaved.length})</button></div>
      {aiReady && <div className="ai-handoff-toggle"><button type="button" className="text-button" aria-expanded={showAI} onClick={() => setShowAI(!showAI)}>Try a ChatGPT look</button><span>Optional copy/paste. Your photos never leave this app.</span></div>}
      {storageError && <p role="alert" className="form-error">Couldn’t save that look in this browser. Try freeing some browser storage.</p>}
    </form>
    {showAI && aiReady && <AILookPanel key={JSON.stringify([selectedOccasion, vibe, condition, anchor?.id])} pieces={realPieces} preferences={currentPreferences} anchorId={anchor?.id} close={() => setShowAI(false)} onLooks={(looks) => {
      setDraftSwaps({})
      setResult({ looks, preferences: currentPreferences, gaps: '', demo: false, ai: true })
      setShowAI(false)
      setShowSaved(false)
    }} />}
    <div className="outfits page-container" aria-live="polite">
      {showSaved && <><div className="section-heading"><p className="eyebrow">Only in this browser</p><h2>Saved looks</h2></div>{validSaved.length ? <div className="outfit-grid">{validSaved.map((look, i) => <OutfitCard key={look.id} index={i} look={look} items={resolve(look)} onItem={onItem} onSave={toggleSave} isSaved onWorn={() => markWorn(look)} today={today} />)}</div> : <p>Save an outfit to come back to it later.</p>}</>}
      {!showSaved && result && !visibleLooks.length && <div className="empty-state"><Shirt /><h3>Your closet needs a base outfit</h3><p>{result.gaps} Style Me won’t substitute pieces you haven’t saved. You can also turn on sample pieces to try the flow.</p><button type="button" className="secondary-button" onClick={onAdd}><Plus size={16} /> Add a piece</button></div>}
      {!showSaved && result && !!visibleLooks.length && <>
        <div className="section-heading"><p className="eyebrow">{result.preferences.vibe} ideas for {result.preferences.occasion}{result.demo ? ' · sample pieces enabled' : ''}{result.ai ? ' · imported from ChatGPT' : ''}</p><h2>{result.ai ? 'Your imported looks are ready' : 'Your looks are ready'}</h2></div>
        <div className="outfit-grid">{visibleLooks.map((initial, i) => {
          const customized = draftSwaps[initial.id]
          const look = customized && resolve(customized).length === customized.itemIds.length ? customized : initial
          return <OutfitCard key={initial.id} index={i} look={look} items={resolve(look)} onItem={onItem} onSave={toggleSave}
            isSaved={saved.some((entry) => entry.id === look.id)} swaps={
              <SwapRack look={look} wardrobe={[...itemById.values()]} onSwap={(targetId, replacementId) => {
                const next = swapLook(look, targetId, replacementId, [...itemById.values()])
                if (next) setDraftSwaps((current) => ({ ...current, [initial.id]: next }))
              }} onReset={customized ? () => setDraftSwaps((current) => {
                const next = { ...current }; delete next[initial.id]; return next
              }) : undefined} />
            } />
        })}</div>
        {result.preferFresh && visibleLooks.some((look) => recentWear.has(combinationKey(look.itemIds))) &&
          <p className="style-limit">Some familiar looks are included when there aren’t enough good alternatives.</p>}
        {visibleLooks.length < 3 && <p className="style-limit">{result.gaps}</p>}
      </>}
    </div>
  </section>
}

function OutfitCard({ index, look, items, onItem, onSave, isSaved, swaps, onWorn, today }: { index: number; swaps?: ReactNode; onWorn?: () => void; today?: string; look: OutfitLook; items: ClosetItem[]; onItem: (item: ClosetItem) => void; onSave: (look: OutfitLook) => void; isSaved: boolean }) {
  const savedPieces = items.filter((item) => item.ownerId === 'owner' && Boolean(item.imageData)).length
  const friendPieces = items.length - items.filter((item) => item.ownerId === 'owner').length
  const samples = items.length - savedPieces
  const wornToday = Boolean(today && look.wornOn?.includes(today))
  const lastWorn = look.wornOn?.[0] && displayWearDate(look.wornOn[0])
  return <article className="outfit-card">
    <span className="outfit-number">LOOK {String(index + 1).padStart(2, '0')}{look.source === 'ai-import' ? ' · IMPORTED AI' : look.source === 'custom' ? ' · CUSTOM' : ''}</span>
    <div className="outfit-items outfit-tiles">{items.map((item) => <button key={item.id} onClick={() => onItem(item)} aria-label={`View ${item.name}`}><ItemVisual item={item} compact /><span>{item.name}</span></button>)}</div>
    <h3>{look.title}</h3><p>{look.explanation}</p>
    <div className="outfit-sources">
      {!!savedPieces && <small><Shirt size={14} /> {savedPieces === 1 ? '1 of your photos' : `${savedPieces} of your photos`}</small>}
      {!!samples && <small><Shirt size={14} /> {samples === 1 ? '1 sample piece' : `${samples} sample pieces`}{friendPieces ? ' including demo friend items' : ''}</small>}
      {!!friendPieces && <small><Users size={14} /> Demo loan, not a real request</small>}
    </div>
    {swaps}
    {onWorn && <div className="wear-actions">
      <button className="secondary-button" onClick={onWorn} aria-pressed={wornToday}><Check size={16} /> {wornToday ? 'Wore it today' : 'Mark worn today'}</button>
      {lastWorn && <span role="status">Last worn {wornToday ? 'today' : lastWorn} · {look.wornOn!.length} {look.wornOn!.length === 1 ? 'day' : 'days'} logged</span>}
    </div>}
    {onWorn && canMakeLookCard(items) && <LookCardDownload items={items} />}
    <button className="secondary-button" onClick={() => onSave(look)} aria-pressed={isSaved}><Heart size={16} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Remove saved look' : 'Save this look'}</button>
  </article>
}
