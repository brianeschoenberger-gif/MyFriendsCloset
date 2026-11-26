import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getSwapOptions } from '../lib/swapLook'
import type { ClosetItem, OutfitLook } from '../types'

export function SwapRack({ look, wardrobe, onSwap, onReset }: {
  look: OutfitLook
  wardrobe: ClosetItem[]
  onSwap: (targetId: number, replacementId: number) => void
  onReset?: () => void
}) {
  const current = look
  const [targetId, setTargetId] = useState<number>()
  const [replacementId, setReplacementId] = useState<number>()
  const swapTargets = current.itemIds.flatMap((id) => {
    const item = wardrobe.find((piece) => piece.id === id)
    return item && getSwapOptions(current, id, wardrobe).length ? [item] : []
  })
  const active = swapTargets.find((item) => item.id === targetId)
  const replacements = active ? getSwapOptions(current, active.id, wardrobe) : []
  const replacement = replacements.find((item) => item.id === replacementId)
  if (!swapTargets.length && !onReset) return null
  return <details className="swap-rack">
    <summary><RefreshCw size={15} /> Swap a piece</summary>
    {swapTargets.length ? <div className="swap-choices">
      <label>Piece to swap<select value={active?.id ?? ''} onChange={(event) => {
        setTargetId(event.target.value ? Number(event.target.value) : undefined)
        setReplacementId(undefined)
      }}><option value="">Choose a piece</option>{swapTargets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Replacement<select disabled={!active} value={replacement?.id ?? ''} onChange={(event) => setReplacementId(event.target.value ? Number(event.target.value) : undefined)}>
        <option value="">Choose a replacement</option>{replacements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      <button className="secondary-button" disabled={!active || !replacement} onClick={() => {
        if (active && replacement) {
          onSwap(active.id, replacement.id)
          setTargetId(undefined); setReplacementId(undefined)
        }
      }}>Use replacement</button>
    </div> : <p>No other matching pieces in your wardrobe yet.</p>}
    {current.anchorId !== undefined && <small>The garment you built around stays in the look.</small>}
    {onReset && <button type="button" className="text-button" onClick={() => { setTargetId(undefined); setReplacementId(undefined); onReset() }}>Undo swaps</button>}
  </details>
}
