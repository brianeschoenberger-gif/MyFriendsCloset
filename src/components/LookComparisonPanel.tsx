import { useState } from 'react'
import type { ClosetItem, OutfitLook } from '../types'
import type { LookComparison } from '../lib/compareLooks'
import { ItemVisual } from './ClosetUI'

export function LookComparisonPanel({ match, resolve, saved, onSave, close }: {
  match: LookComparison
  resolve: (look: OutfitLook) => ClosetItem[]
  saved: OutfitLook[]
  onSave: (look: OutfitLook) => void
  close: () => void
}) {
  const [choice, setChoice] = useState<'A' | 'B' | 'Both' | 'Neither' | null>(null)
  return <section className="look-comparison" aria-label="Compare two outfit picks">
    <div className="section-heading inline">
      <div><p className="eyebrow">Same clothes · same occasion</p><h2>{match.kind === 'same' ? 'Same first pick' : 'Which would you wear?'}</h2></div>
      <button type="button" className="secondary-button" onClick={close}>Back to imported looks</button>
    </div>
    {match.kind === 'pair' && match.picks.some(({ look }) => resolve(look).length !== look.itemIds.length) ?
      <p>A garment changed or was removed. Go back and build fresh looks to compare.</p> :
      match.kind === 'same' ? <p>The built-in stylist and ChatGPT suggested the same pieces first. No need to choose between duplicates.</p> :
      <>
        <p>Pick based on the clothes. The sources are shown after you choose. Your choice isn’t saved or sent.</p>
        <div className="look-comparison-grid">{match.picks.map(({ look, source }, i) => {
          const letter = i ? 'B' : 'A'
          const isSaved = saved.some((item) => item.id === look.id)
          return <article key={look.id} className="outfit-card">
            <h3>Look {letter}</h3>
            <div className="outfit-items outfit-tiles">{resolve(look).map((item) =>
              <div key={item.id}><ItemVisual item={item} compact /><span>{item.name}</span>{item.color && <small>{item.color}</small>}</div>)}</div>
            {choice && <p className="compare-source">{source}</p>}
            {choice && <button type="button" className="secondary-button" aria-pressed={isSaved} onClick={() => onSave(look)}>
              {isSaved ? `Remove saved look ${letter}` : `Save look ${letter}`}
            </button>}
          </article>
        })}</div>
        {!choice && <div className="choice-row" role="group" aria-label="Your outfit preference">
          {(['A', 'B', 'Both', 'Neither'] as const).map((option) =>
            <button type="button" key={option} className="secondary-button" onClick={() => setChoice(option)}>
              {option.length === 1 ? `I’d wear look ${option}` : option}
            </button>)}
        </div>}
        {choice && <p role="status">{choice === 'Both' ? 'You’d wear both.' : choice === 'Neither' ? 'Neither felt right.' : `You picked look ${choice}.`} The sources are now shown above.</p>}
      </>}
  </section>
}
