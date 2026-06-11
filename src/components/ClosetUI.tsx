import { useState, type ReactNode } from 'react'
import { Heart, Plus, X } from 'lucide-react'
import type { ClosetItem, Visibility } from '../types'

export function ItemVisual({ item, compact = false }: { item: ClosetItem; compact?: boolean }) {
  return <div className={`item-visual color-${item.color} ${compact ? 'compact' : ''}`}><span>{item.glyph}</span><div className={`garment garment-${item.category.toLowerCase()}`} /></div>
}

export function ItemCard({ item, onClick }: { item: ClosetItem; onClick: () => void }) {
  return <button className="item-card" onClick={onClick}>
    <div className="visual-wrap"><ItemVisual item={item} /><span className={`visibility-badge ${item.visibility.toLowerCase()}`}>{item.visibility === 'Borrowable' ? 'Available to borrow' : item.visibility}</span><Heart className="heart" size={20} /></div>
    <div className="item-info"><div><h3>{item.name}</h3><p>{item.brand} / Size {item.size}</p></div>{item.owner !== 'You' && <span className="owner">{item.owner.slice(0, 1)}</span>}</div>
  </button>
}

export function PageHeading({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{children}</div>
}

export function ItemModal({ item, own, close, updateVisibility, requestItem }: { item: ClosetItem; own: boolean; close: () => void; updateVisibility: (item: ClosetItem, visibility: Visibility) => void; requestItem: (item: ClosetItem) => void }) {
  return <div className="modal-backdrop" onMouseDown={close}><div className="item-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={close} aria-label="Close item details"><X /></button><ItemVisual item={item} /><div className="modal-content"><p className="eyebrow">{own ? 'From your closet' : `From ${item.owner}'s closet`}</p><h2>{item.name}</h2><p>{item.brand} / {item.category} / Size {item.size}</p>{own ? <><h4>Who can see this?</h4><div className="visibility-options">{(['Private', 'Friends', 'Borrowable'] as Visibility[]).map((option) => <button key={option} className={item.visibility === option ? 'selected' : ''} onClick={() => updateVisibility(item, option)}>{option}</button>)}</div></> : <><div className="lender-note"><span className="avatar">{item.owner.slice(0, 1)}</span><p><strong>{item.owner} says:</strong><br />"Happy for this one to have a night out."</p></div><button className="primary-button full" onClick={() => requestItem(item)}>Want to borrow this?</button></>}</div></div></div>
}

export function AddItemModal({ close, save }: { close: () => void; save: (item: ClosetItem) => void }) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('Friends')
  return <div className="modal-backdrop"><form className="add-modal" onSubmit={(event) => { event.preventDefault(); if (name.trim()) save({ id: Date.now(), name, owner: 'You', category: 'Dresses', size: 'S', brand: 'New find', visibility, color: 'lilac', glyph: 'NEW' }) }}><button type="button" className="modal-close" onClick={close} aria-label="Close add item"><X /></button><p className="eyebrow">A new closet favorite</p><h2>Add an item</h2><div className="upload-zone"><Plus /><strong>Add a photo</strong><span>Drag one here or choose from your camera roll</span></div><label>Item name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. The perfect black dress" required /></label><div className="form-grid"><label>Category<select><option>Dresses</option><option>Jackets</option><option>Shoes</option><option>Accessories</option></select></label><label>Size<input defaultValue="S" /></label><label>Brand<input placeholder="Optional" /></label><label>Color<input placeholder="Black" /></label></div><label>Who can see it?<div className="visibility-options">{(['Private', 'Friends', 'Borrowable'] as Visibility[]).map((option) => <button type="button" key={option} className={visibility === option ? 'selected' : ''} onClick={() => setVisibility(option)}>{option}</button>)}</div></label><button className="primary-button full" type="submit">Add to my closet</button></form></div>
}
