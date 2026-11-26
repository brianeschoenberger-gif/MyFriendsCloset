import { useState } from 'react'
import { Download, Upload, X } from 'lucide-react'
import { useDialogFocus } from '../lib/useDialogFocus'
import {
  makeWardrobeBackup, maxBackupBytes, mergeLookBackup, parseWardrobeArchive, planWardrobeRestore, type WardrobeArchive,
} from '../lib/wardrobeBackup'
import type { ClosetItem, OutfitLook } from '../types'

type RestoreResult = 'complete' | 'photos-only' | 'some-skipped' | 'not-saved'

export function WardrobeBackupModal({ items, looks, close, restore }: {
  items: ClosetItem[]
  looks: OutfitLook[]
  close: () => void
  restore: (archive: WardrobeArchive) => Promise<RestoreResult>
}) {
  const [incoming, setIncoming] = useState<WardrobeArchive | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const dialog = useDialogFocus<HTMLElement>(close, working)
  const candidateCount = items.filter((item) => item.ownerId === 'owner' && item.imageData).length
  const plan = incoming && planWardrobeRestore(items, incoming.items)
  const addCount = plan ? plan.items.length - items.length : 0
  const outfitPlan = incoming && plan && mergeLookBackup(looks, incoming.looks, plan.ids, plan.items)
  const outfitChanges = outfitPlan ? outfitPlan.added + outfitPlan.historyEdits : 0

  function download() {
    const content = makeWardrobeBackup(items, looks)
    const file = new Blob([content], { type: 'application/json' })
    if (file.size > maxBackupBytes) { setError('This wardrobe is too large for a single backup. No file was exported.'); return }
    try {
      const checked = parseWardrobeArchive(content)
      setError(checked.items.length !== candidateCount || checked.looks.length !== looks.length ?
        'Some unsupported photos or looks were left out, including looks with sample pieces.' : '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This wardrobe couldn’t be exported.')
      return
    }
    const uri = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = uri
    link.download = `my-friends-closet-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(uri), 30_000)
    setDownloaded(true)
  }

  async function read(file?: File) {
    if (!file) return
    setIncoming(null)
    setError('')
    setWorking(true)
    try {
      if (file.size > maxBackupBytes) throw new Error('This wardrobe backup is too large.')
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Could not open this backup.'))
        reader.readAsText(file)
      })
      setIncoming(parseWardrobeArchive(content))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open this backup.')
    } finally { setWorking(false) }
  }

  async function restoreArchive(archive: WardrobeArchive) {
    setWorking(true)
    setError('')
    try {
      const result = await restore(archive)
      if (result === 'photos-only') setError('Your photos are safe, but the outfits could not be saved. Free some browser space and retry this backup; photos won’t duplicate.')
      if (result === 'some-skipped') setError('Compatible entries were restored. Some looks did not fit your current wardrobe or saved-look limit. Keep this backup.')
      if (result === 'not-saved') setError('Nothing was restored. Try freeing browser storage first.')
    } catch {
      setError('Couldn’t finish restoring this backup. You can retry; any restored entries won’t duplicate.')
    } finally { setWorking(false) }
  }

  return <div className="modal-backdrop">
    <section className="add-modal backup-modal" ref={dialog} data-closet-dialog tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="backup-heading">
      <button className="modal-close" onClick={close} disabled={working} data-dialog-initial aria-label="Close wardrobe backup"><X /></button>
      <p className="eyebrow">On this device</p>
      <h2 id="backup-heading">Wardrobe backup</h2>
      <p>Save your clothing photos, saved looks made from your own pieces, and wear history. Borrow requests and demo pieces are not included.</p>
      <p className="photo-local-note">The file can include private photos, notes, and wear dates. Keep it somewhere you trust; the app never uploads it.</p>
      <div className="backup-actions">
        <button className="secondary-button" onClick={download} disabled={!candidateCount || working}><Download size={18} /> Download wardrobe</button>
        <label className="gallery-picker"><Upload size={18} /> Choose backup file
          <input type="file" className="file-input" aria-label="Choose wardrobe backup file" accept=".json,application/json" disabled={working} onChange={(event) => {
            const input = event.currentTarget
            void read(input.files?.[0])
            input.value = ''
          }} />
        </label>
      </div>
      {working && <p role="status">Working on your backup…</p>}
      {downloaded && <p role="status">Download started. Check your browser’s downloads.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {incoming && <div className="backup-summary">
        <p>{incoming.items.length} {incoming.items.length === 1 ? 'piece' : 'pieces'} in this file. {addCount ? `${addCount} will be added as private. Existing items are kept.` : 'These pieces are already in your closet.'}</p>
        {!!incoming.looks.length && <p>{outfitPlan?.added ?? 0} new saved {outfitPlan?.added === 1 ? 'look' : 'looks'}, {outfitPlan?.historyEdits ?? 0} existing {outfitPlan?.historyEdits === 1 ? 'look' : 'looks'} with wear history to merge. {outfitPlan?.skipped ? `${outfitPlan.skipped} won’t fit this closet or storage limit.` : ''}</p>}
        <button className="primary-button" disabled={(!addCount && !outfitChanges) || working} onClick={() => void restoreArchive(incoming)}>{outfitChanges ? 'Restore backup' : `Restore ${addCount} private ${addCount === 1 ? 'piece' : 'pieces'}`}</button>
      </div>}
    </section>
  </div>
}
