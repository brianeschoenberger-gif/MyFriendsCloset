import { useState, type ReactNode } from 'react'
import { Camera, Heart, Pencil, Sparkles, Trash2, X } from 'lucide-react'
import { prepareImageForStorage } from '../lib/storage'
import type { BorrowRequest, ClosetItem, Identity, Visibility } from '../types'

export function ItemVisual({ item, compact = false }: { item: ClosetItem; compact?: boolean }) {
  if (item.imageData) return <div className={`item-visual uploaded ${compact ? 'compact' : ''}`}><img src={item.imageData} alt="" /></div>
  return <div className={`item-visual color-${item.color} ${compact ? 'compact' : ''}`}><span>{item.glyph}</span><div className={`garment garment-${item.category.toLowerCase()}`} /></div>
}

export function ItemCard({ item, onClick }: { item: ClosetItem; onClick: () => void }) {
  return <button className="item-card" onClick={onClick}>
    <div className="visual-wrap"><ItemVisual item={item} /><span className={`visibility-badge ${item.visibility.toLowerCase()}`}>{item.visibility === 'Borrowable' ? 'Available to borrow' : item.visibility}</span><Heart className="heart" size={20} /></div>
    <div className="item-info"><div><h3>{item.name}</h3><p>{item.brand || item.category}{item.size ? ` / Size ${item.size}` : ''}</p></div>{item.owner !== 'Brian' && <span className="owner">{item.owner.slice(0, 1)}</span>}</div>
  </button>
}

export function PageHeading({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{children}</div>
}

export function ItemModal({ item, own, canRequest, close, updateVisibility, requestItem, deleteItem, editItem, styleItem }: { item: ClosetItem; styleItem?: (item: ClosetItem) => void; own: boolean; canRequest: boolean; editItem: (item: ClosetItem) => void; close: () => void; updateVisibility: (item: ClosetItem, visibility: Visibility) => void; requestItem: (item: ClosetItem) => void; deleteItem: (item: ClosetItem) => void }) {
  return <div className="modal-backdrop" onMouseDown={close}><div className="item-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={close} aria-label="Close item details"><X /></button><ItemVisual item={item} /><div className="modal-content"><p className="eyebrow">{own ? 'From your closet' : `From ${item.owner}'s closet`}</p><h2>{item.name}</h2><p>{item.brand ? `${item.brand} / ` : ''}{item.category}{item.size ? ` / Size ${item.size}` : ''}</p>{item.notes && <p className="item-notes">{item.notes}</p>}{own ? <><button className="secondary-button full" onClick={() => editItem(item)}><Pencil size={16} /> Edit item</button>{styleItem && item.imageData && <button className="secondary-button full style-this" onClick={() => styleItem(item)}><Sparkles size={16} /> Style this piece</button>}<h4>Who can see this?</h4><div className="visibility-options">{(['Private', 'Friends', 'Borrowable'] as Visibility[]).map((option) => <button key={option} className={item.visibility === option ? 'selected' : ''} onClick={() => updateVisibility(item, option)}>{option}</button>)}</div><button className="danger-button" onClick={() => deleteItem(item)}><Trash2 size={16} /> Delete item</button></> : <><div className="lender-note"><span className="avatar">{item.owner.slice(0, 1)}</span><p><strong>{item.owner} says:</strong><br />Shared with close friends.</p></div>{canRequest && item.visibility === 'Borrowable' && <button className="primary-button full" onClick={() => requestItem(item)}>Request to borrow</button>}</>}</div></div></div>
}

export function AddItemModal({ close, save, item }: { close: () => void; save: (item: ClosetItem) => boolean | Promise<boolean>; item?: ClosetItem }) {
  const [imageData, setImageData] = useState(item?.imageData ?? '')
  const [color, setColor] = useState(item?.color ?? '')
  const [colorHint, setColorHint] = useState<string>()
  const [imageMeta, setImageMeta] = useState<ClosetItem['imageMeta']>(item?.imageMeta)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [visibility, setVisibility] = useState<Visibility>(item?.visibility ?? 'Private')

  async function selectImage(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return }
    if (file.size > 15_000_000) { setError('Choose an image under 15 MB. Large phone photos are compressed automatically.'); return }
    setProcessing(true)
    try {
      const prepared = await prepareImageForStorage(file)
      setImageData(prepared.dataUrl)
      setImageMeta(prepared)
      setColorHint(prepared.colorHint)
      setError('')
    } catch {
      setError('We could not prepare that photo. Try another image.')
    } finally {
      setProcessing(false)
    }
  }

  return <div className="modal-backdrop"><form className="add-modal" aria-label={item ? 'Edit clothing item' : 'Add clothing item'} onSubmit={async (event) => {
    event.preventDefault()
    if (saving || processing) return
    const data = new FormData(event.currentTarget)
    if (!imageData && !item) { setError('Add a photo before saving.'); return }
    const name = String(data.get('name')).trim()
    if (!name) { setError('Enter an item name.'); return }
    const now = new Date().toISOString()
    setSaving(true)
    const saved = await save({
      id: item?.id ?? Date.now(), ownerId: 'owner', owner: 'Brian',
      imageData: imageData || undefined,
      imageMeta: imageMeta ? { originalBytes: imageMeta.originalBytes, storedBytes: imageMeta.storedBytes, width: imageMeta.width, height: imageMeta.height, compressed: imageMeta.compressed } : undefined,
      name, category: String(data.get('category')), color: String(data.get('color')).trim(), size: String(data.get('size')).trim(),
      brand: String(data.get('brand')).trim(), visibility, occasionTags: String(data.get('tags')).split(',').map((tag) => tag.trim()).filter(Boolean),
      notes: String(data.get('notes')).trim(), glyph: imageData ? 'PHOTO' : (item?.glyph ?? 'ITEM'),
      createdAt: item?.createdAt ?? now, updatedAt: now,
    })
    setSaving(false)
    if (!saved) setError('Your closet is out of local space. Delete an older photo or choose a smaller image, then save again.')
  }}><button type="button" className="modal-close" onClick={close} aria-label={item ? 'Close edit item' : 'Close add item'}><X /></button><p className="eyebrow">Your wardrobe</p><h2>{item ? 'Edit an item' : 'Add an item'}</h2><label className={`upload-zone ${imageData ? 'has-preview' : ''}`}>{imageData ? <img src={imageData} alt="New item preview" /> : <><Camera /><strong>{processing ? 'Preparing photo...' : 'Take or choose a photo'}</strong><span>Large phone photos are compressed automatically</span></>}<input className="file-input" name="photo" type="file" accept="image/*" capture="environment" aria-label={imageData ? 'Replace with camera photo' : undefined} disabled={processing} onChange={(event) => selectImage(event.target.files?.[0])} /></label><label className="gallery-picker"><Camera size={16} /> {imageData ? 'Replace from photo library' : 'Choose from photo library'}<input className="file-input" type="file" accept="image/*" disabled={processing} onChange={(event) => selectImage(event.target.files?.[0])} /></label><p className="photo-local-note">Photos are saved in this browser only. Private items stay out of friend mode; this demo does not sync between devices.</p>{imageMeta && <p className="image-ready" role="status">{imageMeta.compressed ? `Photo optimized for your closet (${Math.max(1, Math.round(imageMeta.storedBytes / 1024))} KB).` : 'Photo ready to save.'}</p>}{error && <p className="form-error" role="alert">{error}</p>}<label>Item name<input name="name" defaultValue={item?.name} maxLength={80} placeholder="e.g. The perfect black dress" required /></label><div className="form-grid"><label>Category<select name="category" defaultValue={item?.category ?? 'Tops'}>{['Tops', 'Bottoms', 'Dresses', 'Sets', 'Jackets', 'Shoes', 'Accessories'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Size<input name="size" defaultValue={item?.size ?? 'M'} maxLength={24} /></label><label>Brand<input name="brand" defaultValue={item?.brand} maxLength={80} placeholder="Optional" /></label><label>Color<input name="color" value={color} onChange={(event) => setColor(event.target.value)} maxLength={35} placeholder="Optional" /></label>{colorHint && !color.trim() && <button type="button" className="color-hint" onClick={() => setColor(colorHint)}>Use suggested {colorHint}</button>}</div><label>Occasion tags<input name="tags" defaultValue={item?.occasionTags.join(', ')} maxLength={160} placeholder="Dinner, vacation, work" /></label><label>Notes<textarea name="notes" defaultValue={item?.notes} maxLength={600} placeholder="Fit notes, care instructions, or anything friends should know" /></label><fieldset><legend>Who can see it?</legend><div className="visibility-options">{(['Private', 'Friends', 'Borrowable'] as Visibility[]).map((option) => <button type="button" key={option} className={visibility === option ? 'selected' : ''} onClick={() => setVisibility(option)}>{option}</button>)}</div></fieldset><button className="primary-button full" type="submit" disabled={processing || saving}>{saving ? 'Saving…' : processing ? 'Preparing photo...' : item ? 'Save changes' : 'Save to my closet'}</button></form></div>
}

export function BorrowRequestModal({ item, requester, close, save }: { item: ClosetItem; requester: Identity; close: () => void; save: (request: BorrowRequest) => boolean }) {
  const [error, setError] = useState('')
  return <div className="modal-backdrop"><form className="request-modal add-modal" aria-label="Request to borrow" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const now = new Date().toISOString(); const startDate = String(data.get('startDate')); const endDate = String(data.get('endDate')); const saved = save({ id: Date.now(), itemId: item.id, ownerId: item.ownerId, requesterId: requester, requesterName: 'Alex', item: item.name, person: item.owner, dates: startDate && endDate ? `${startDate} to ${endDate}` : 'Dates flexible', direction: 'incoming', status: 'Pending', glyph: item.glyph, startDate, endDate, note: String(data.get('note')), createdAt: now, updatedAt: now }); if (!saved) setError('This request could not be saved locally. Free some browser storage and try again.') }}><button type="button" className="modal-close" onClick={close} aria-label="Close borrow request"><X /></button><p className="eyebrow">Ask Brian</p><h2>Borrow {item.name}?</h2><div className="request-item-preview"><ItemVisual item={item} compact /><p>Share your dates and a quick note. Brian can approve or decline from owner mode.</p></div><div className="form-grid"><label>Start date<input name="startDate" type="date" /></label><label>End date<input name="endDate" type="date" /></label></div><label>Note<textarea name="note" placeholder="I would love this for Saturday's dinner!" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button full" type="submit">Send borrow request</button></form></div>
}
