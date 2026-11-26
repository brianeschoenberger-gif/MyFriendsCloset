import { ArrowRight, CalendarDays, Check, ChevronRight, Images, Plus, Sparkles, Users, X } from 'lucide-react'
import { friendItems, friends, initialItems } from '../data/mockData'
import type { BorrowRequest, ClosetItem, Identity, Page } from '../types'
import { ItemCard, ItemVisual, PageHeading } from './ClosetUI'
import { hasOutfitBase } from '../lib/aiLookExchange'
import { photographedPieces } from '../lib/stylist'

export function Dashboard({ navigate, items, requests, onItem, addPhotos }: { navigate: (page: Page) => void; items: ClosetItem[]; requests: BorrowRequest[]; onItem: (item: ClosetItem) => void; addPhotos: () => void }) {
  const real = photographedPieces(items)
  const isReady = hasOutfitBase(real)
  const heroItem = real.at(-1) ?? initialItems[0]
  return <>
    <section className="hero-section wardrobe-hero">
      <div className="hero-copy"><p className="eyebrow">Your private wardrobe</p><h1>Your clothes.<br /><em>New outfits.</em></h1>
        <p>{isReady ? 'Find a fresh combination from pieces you already have, or start with the one thing you know you want to wear.' : 'Start with a top and bottom, or a dress. Add shoes and a layer when you’re ready to see more combinations.'}</p>
        <div className="hero-actions">
          {isReady
            ? <><button className="primary-button" onClick={() => navigate('style')}><Sparkles size={18} /> Build an outfit</button><button className="text-button" onClick={addPhotos}><Images size={16} /> Add more photos</button></>
            : <><button className="primary-button" onClick={addPhotos}><Images size={18} /> Add your first photos</button><button className="text-button" onClick={() => navigate('style')}>Try the stylist</button></>}
        </div>
      </div>
      <div className="hero-collage" aria-label={real.length ? 'Your latest and sample garments' : 'Example garments'}>
        <div className="collage-card one"><ItemVisual item={friendItems[0]} /><span>Sample · Satin dress</span></div>
        <div className="collage-card two"><ItemVisual item={heroItem} /><span>{real.length ? heroItem.name : 'Sample · Linen set'}</span></div>
        <div className="scribble">wear<br />what<br />you own</div>
      </div>
    </section>
    <section className="stats-row page-container tight">
      <button aria-label={`${real.length} photographed ${real.length === 1 ? "piece" : "pieces"}`} onClick={() => navigate('closet')}><strong>{real.length}</strong><span>photographed {real.length === 1 ? 'piece' : 'pieces'}</span><ChevronRight /></button>
      <button aria-label={isReady ? "Ready to build an outfit" : "Start with what you own"} onClick={() => navigate('style')}><strong>{isReady ? 'Ready' : 'Start'}</strong><span>{isReady ? 'to build an outfit' : 'with what you own'}</span><ChevronRight /></button>
      <button onClick={() => navigate('requests')}><strong>{requests.filter((request) => request.status === 'Pending').length}</strong><span>local demo requests</span><ChevronRight /></button>
    </section>
    <section className="page-container dashboard-section"><div className="section-heading inline"><div><p className="eyebrow">Sample wardrobe</p><h2>Explore the friend demo</h2></div><button className="text-button" onClick={() => navigate('friends')}>See all <ArrowRight size={16} /></button></div><div className="item-grid feature-grid">{friendItems.slice(0, 4).map((item) => <ItemCard key={item.id} item={item} onClick={() => onItem(item)} />)}</div></section>
    <section className="page-container event-banner"><div className="event-date"><span>JUN</span><strong>27</strong></div><div><p className="eyebrow">Sample event closet</p><h2>Palm Springs weekend</h2><p>4 friends / 18 shared pieces / 3 outfits waiting</p></div><div className="mini-avatars">{friends.map((friend) => <span key={friend.name} style={{ background: friend.color }}>{friend.initials}</span>)}</div><button className="secondary-button" onClick={() => navigate('event')}>Open event closet <ArrowRight size={16} /></button></section>
  </>
}

export function RequestsPage({ requests, identity, resolveRequest }: { requests: BorrowRequest[]; identity: Identity; resolveRequest: (id: number, status: 'Approved' | 'Declined') => void }) {
  const visible = requests.filter((request) => identity === 'owner' ? request.ownerId === 'owner' : request.requesterId === identity)
  return <section className="page-container"><PageHeading eyebrow="Closet karma" title="Borrow requests" subtitle={identity === 'owner' ? 'Review requests for your shared pieces.' : 'Track everything you asked Brian to borrow.'} />{visible.length ? <div className="requests-layout single"><div><div className="section-heading"><p className="eyebrow">{identity === 'owner' ? 'Needs your answer' : 'Your requests'}</p><h2>{identity === 'owner' ? 'Incoming' : 'Sent to Brian'}</h2></div>{visible.map((request) => <RequestCard key={request.id} request={request} actions={identity === 'owner' && request.status === 'Pending'} resolve={resolveRequest} />)}</div></div> : <div className="empty-state"><Users /><h3>No requests yet</h3><p>{identity === 'owner' ? 'Requests from Alex will appear here.' : "Open a borrowable item in Brian's closet to send one."}</p></div>}</section>
}

function RequestCard({ request, actions, resolve }: { request: BorrowRequest; actions?: boolean; resolve: (id: number, status: 'Approved' | 'Declined') => void }) {
  return <article className="request-card"><div className="request-thumb">{request.glyph}</div><div className="request-copy"><span className={`status ${request.status.toLowerCase()}`}>{request.status}</span><h3>{request.item}</h3><p>{request.requesterName} requested this from {request.person}</p><small><CalendarDays size={14} /> {request.dates}</small>{request.note && <blockquote>“{request.note}”</blockquote>}</div>{actions && <div className="request-actions"><button className="approve" onClick={() => resolve(request.id, 'Approved')}><Check /> Approve</button><button className="decline" onClick={() => resolve(request.id, 'Declined')}><X /> Decline</button></div>}</article>
}

export function EventPage({ onItem }: { onItem: (item: ClosetItem) => void }) {
  return <section className="page-container"><div className="event-hero"><div><p className="eyebrow">Jun 27 - 29 / Palm Springs, CA</p><h1>Palm Springs<br /><em>weekend</em></h1><p>Pool days, one birthday dinner, and absolutely no panic-shopping.</p></div><div className="sun">PS<br /><span>27</span></div></div><div className="event-members"><div className="mini-avatars large">{friends.map((friend) => <span key={friend.name} style={{ background: friend.color }}>{friend.initials}</span>)}</div><p><strong>You, Maya, Liv, Sam + Nina</strong><br />18 pieces shared for this trip</p><button className="secondary-button"><Plus size={16} /> Invite a friend</button></div><div className="section-heading inline"><div><p className="eyebrow">The shared rack</p><h2>Pack less. Share more.</h2></div><span className="event-note">Everyone can see these</span></div><div className="item-grid">{friendItems.slice(0, 4).map((item) => <ItemCard key={item.id} item={item} onClick={() => onItem(item)} />)}</div></section>
}
