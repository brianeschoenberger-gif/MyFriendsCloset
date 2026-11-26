import { useEffect, useRef, useState } from 'react'
import { Images, Trash2, X } from 'lucide-react'
import { prepareImageForStorage, type ImageProcessingResult } from '../lib/storage'
import type { ClosetItem } from '../types'

const categories = ['Tops', 'Bottoms', 'Dresses', 'Sets', 'Jackets', 'Shoes', 'Accessories']
const limit = 12
let draftId = 0

type Draft = { id: number; name: string; category: string; color: string; photo: ImageProcessingResult }

export function BulkAddModal({ close, save }: { close: () => void; save: (pieces: Omit<ClosetItem, 'id'>[]) => boolean | Promise<boolean> }) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  async function addFiles(files: File[]) {
    const remaining = limit - drafts.length
    if (!files.length || processing || remaining <= 0) return
    setProcessing(true)
    const issues = files.length > remaining ? [`Only ${remaining} more photos fit in this batch. Add the rest in another batch.`] : []
    const prepared: Draft[] = []
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.size > 25_000_000) {
        issues.push(`${file.name}: choose a photo under 25 MB.`)
        continue
      }
      try {
        const photo = await prepareImageForStorage(file, 1000)
        prepared.push({ id: ++draftId, name: '', category: '', color: '', photo })
      } catch {
        issues.push(`${file.name}: could not open this photo. Try exporting it as JPEG or PNG.`)
      }
    }
    setDrafts((current) => [...current, ...prepared])
    setErrors(issues)
    setProcessing(false)
  }

  function update(id: number, fields: Partial<Pick<Draft, 'name' | 'category' | 'color'>>) {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...fields } : draft))
  }

  return <div className="modal-backdrop" onKeyDown={(event) => { if (event.key === 'Escape' && !processing) close() }}>
    <form className="add-modal bulk-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-heading" onSubmit={async (event) => {
      event.preventDefault()
      if (!drafts.length || processing || saving || drafts.some((draft) => !draft.category)) return
      const now = new Date().toISOString()
      const pieces = drafts.map(({ name, category, color, photo }): Omit<ClosetItem, 'id'> => {
        const { dataUrl, ...imageMeta } = photo
        const singular = category === 'Accessories' ? 'Accessory' : ['Bottoms', 'Shoes'].includes(category) ? category : category.slice(0, -1)
        return {
          ownerId: 'owner', owner: 'Brian', imageData: dataUrl, imageMeta,
          name: name.trim() || [color.trim(), singular].filter(Boolean).join(' '),
          category, color: color.trim(), size: '', brand: '', occasionTags: [], notes: '',
          visibility: 'Private', glyph: 'PHOTO', createdAt: now, updatedAt: now,
        }
      })
      setSaving(true)
      const saved = await save(pieces)
      setSaving(false)
      if (!saved) setErrors(['Nothing in this batch was saved. Free browser space, or remove a few photos from this batch and try again.'])
    }}>
      <button type="button" className="modal-close" ref={closeRef} onClick={close} disabled={processing || saving} aria-label="Close photo batch"><X /></button>
      <p className="eyebrow">Your wardrobe</p>
      <h2 id="bulk-heading">Add photos in bulk</h2>
      <p className="photo-local-note">Pick up to {limit} photos. Choose a category for each; names and colors are optional. All items start private and stay in this browser.</p>
      <label className="gallery-picker"><Images size={18} /> Choose photos
        <input ref={fileInput} className="file-input" type="file" multiple accept="image/*" aria-label="Choose multiple clothing photos" disabled={processing || drafts.length >= limit} onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          event.currentTarget.value = ''
          void addFiles(files)
        }} />
      </label>
      {processing && <p role="status">Preparing photos…</p>}
      {errors.length > 0 && <ul className="form-error bulk-errors" role="alert">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
      <div className="bulk-drafts">{drafts.map((draft, index) => <fieldset className="bulk-draft" key={draft.id}>
        <legend className="sr-only">Photo {index + 1}</legend>
        <img src={draft.photo.dataUrl} alt={`Clothing photo ${index + 1}`} />
        <div className="bulk-fields">
          <label>Category<select required value={draft.category} aria-label={`Category for photo ${index + 1}`} onChange={(event) => update(draft.id, { category: event.target.value })}>
            <option value="">Choose one</option>{categories.map((category) => <option key={category}>{category}</option>)}
          </select></label>
          <label>Name<input maxLength={80} value={draft.name} aria-label={`Name for photo ${index + 1}`} placeholder="Optional" onChange={(event) => update(draft.id, { name: event.target.value })} /></label>
          <label>Color<input maxLength={35} value={draft.color} aria-label={`Color for photo ${index + 1}`} placeholder="Optional" onChange={(event) => update(draft.id, { color: event.target.value })} /></label>
        </div>
        <button type="button" className="icon-button bulk-remove" aria-label={`Remove photo ${index + 1}`} onClick={() => setDrafts((current) => current.filter(({ id }) => id !== draft.id))}><Trash2 size={19} /></button>
      </fieldset>)}</div>
      <div className="bulk-footer">
        <span>{drafts.length} of {limit} photos</span>
        <button className="primary-button" type="submit" disabled={processing || saving || !drafts.length || drafts.some((draft) => !draft.category)}>
          {saving ? 'Saving…' : drafts.length === 1 ? 'Save 1 private piece' : `Save ${drafts.length} private pieces`}
        </button>
      </div>
    </form>
  </div>
}
