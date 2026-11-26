import { useState } from 'react'
import { Download, Upload, X } from 'lucide-react'
import { useDialogFocus } from '../lib/useDialogFocus'
import { makeWardrobeBackup, maxBackupBytes, mergeWardrobeBackup, parseWardrobeBackup } from '../lib/wardrobeBackup'
import type { ClosetItem } from '../types'

export function WardrobeBackupModal({ items, close, restore }: { items: ClosetItem[]; close: () => void; restore: (items: ClosetItem[]) => boolean | Promise<boolean> }) {
  const [incoming, setIncoming] = useState<ClosetItem[]>([])
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const dialog = useDialogFocus<HTMLElement>(close, working)
  const candidateCount = items.filter((item) => item.ownerId === 'owner' && item.imageData).length
  const addCount = incoming.length ? mergeWardrobeBackup(items, incoming).length - items.length : 0

  function download() {
    const content = makeWardrobeBackup(items)
    if (content.length > maxBackupBytes) { setError('This wardrobe is too large for a single backup. No file was exported.'); return }
    const count = (JSON.parse(content) as { items: unknown[] }).items.length
    if (!count) { setError('No supported clothing photos are available to export.'); return }
    const uri = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = uri
    link.download = `my-friends-closet-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(uri), 30_000)
    setError(count !== candidateCount ? 'Some unsupported images were skipped.' : '')
    setDownloaded(true)
  }

  async function read(file?: File) {
    if (!file) return
    setIncoming([])
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
      setIncoming(parseWardrobeBackup(content))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open this backup.')
    } finally { setWorking(false) }
  }

  return <div className="modal-backdrop">
    <section className="add-modal backup-modal" ref={dialog} data-closet-dialog tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="backup-heading">
      <button className="modal-close" onClick={close} data-dialog-initial aria-label="Close wardrobe backup"><X /></button>
      <p className="eyebrow">On this device</p>
      <h2 id="backup-heading">Wardrobe backup</h2>
      <p>Save a copy of your clothing photos and details, or bring them to another device. It does not include saved looks, borrow requests, or demo pieces.</p>
      <p className="photo-local-note">The file includes private photos and notes. Keep it somewhere you trust; the app never uploads it.</p>
      <div className="backup-actions">
        <button className="secondary-button" onClick={download} disabled={!candidateCount}><Download size={18} /> Download wardrobe</button>
        <label className="gallery-picker"><Upload size={18} /> Choose backup file
          <input type="file" className="file-input" aria-label="Choose wardrobe backup file" accept=".json,application/json" disabled={working} onChange={(event) => {
            const input = event.currentTarget
            void read(input.files?.[0])
            input.value = ''
          }} />
        </label>
      </div>
      {working && <p role="status">Checking backup…</p>}
      {downloaded && <p role="status">Download started. Check your browser’s downloads.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {incoming.length > 0 && <div className="backup-summary">
        <p>{incoming.length} {incoming.length === 1 ? 'piece' : 'pieces'} in this file. {addCount ? `${addCount} will be added as private. Existing items are kept.` : 'These pieces are already in your closet.'}</p>
        <button className="primary-button" disabled={!addCount || working} onClick={async () => { setWorking(true); const saved = await restore(incoming); setWorking(false); if (!saved) setError('Nothing was restored. Try freeing browser storage first.') }}>Restore {addCount} private {addCount === 1 ? 'piece' : 'pieces'}</button>
      </div>}
    </section>
  </div>
}
