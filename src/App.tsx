import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Heart,
  Home,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import './App.css'

type Page = 'home' | 'closet' | 'friends' | 'requests' | 'style' | 'event'
type Visibility = 'Private' | 'Friends' | 'Borrowable'

type ClosetItem = {
  id: number
  name: string
  owner: string
  category: string
  size: string
  brand: string
  visibility: Visibility
  color: string
  glyph: string
}

type BorrowRequest = {
  id: number
  item: string
  person: string
  dates: string
  direction: 'incoming' | 'outgoing'
  status: 'Pending' | 'Approved' | 'Declined'
  glyph: string
}

const initialItems: ClosetItem[] = [
  { id: 1, name: 'Ivory linen set', owner: 'You', category: 'Sets', size: 'S', brand: 'Faithfull', visibility: 'Borrowable', color: 'sand', glyph: 'LINEN' },
  { id: 2, name: 'Silk slip dress', owner: 'You', category: 'Dresses', size: 'S', brand: 'Reformation', visibility: 'Friends', color: 'rose', glyph: 'SILK' },
  { id: 3, name: 'Oversized blazer', owner: 'You', category: 'Jackets', size: 'M', brand: 'Aritzia', visibility: 'Borrowable', color: 'ink', glyph: 'BLAZER' },
  { id: 4, name: 'Sunday sunglasses', owner: 'You', category: 'Accessories', size: 'OS', brand: 'Le Specs', visibility: 'Private', color: 'honey', glyph: 'SHADES' },
  { id: 5, name: 'Gold knot hoops', owner: 'You', category: 'Accessories', size: 'OS', brand: 'Mejuri', visibility: 'Borrowable', color: 'gold', glyph: 'HOOPS' },
  { id: 6, name: 'White court sneakers', owner: 'You', category: 'Shoes', size: '7', brand: 'Veja', visibility: 'Friends', color: 'cream', glyph: 'SNEAKERS' },
]

const friendItems: ClosetItem[] = [
  { id: 11, name: 'Chocolate satin dress', owner: 'Maya', category: 'Dresses', size: 'S', brand: 'Dissh', visibility: 'Borrowable', color: 'cocoa', glyph: 'SATIN' },
  { id: 12, name: 'Woven mini bag', owner: 'Liv', category: 'Accessories', size: 'OS', brand: 'Staud', visibility: 'Borrowable', color: 'lime', glyph: 'BAG' },
  { id: 13, name: 'Cowboy boots', owner: 'Sam', category: 'Shoes', size: '7.5', brand: 'Tecovas', visibility: 'Borrowable', color: 'tan', glyph: 'BOOTS' },
  { id: 14, name: 'Cropped leather jacket', owner: 'Nina', category: 'Jackets', size: 'S', brand: 'AllSaints', visibility: 'Borrowable', color: 'black', glyph: 'LEATHER' },
  { id: 15, name: 'Poolside sarong', owner: 'Maya', category: 'Sets', size: 'OS', brand: 'Monday Swim', visibility: 'Friends', color: 'coral', glyph: 'SARONG' },
  { id: 16, name: 'Neutral kitten heels', owner: 'Liv', category: 'Shoes', size: '7', brand: 'Aeyde', visibility: 'Borrowable', color: 'blush', glyph: 'HEELS' },
]

const initialRequests: BorrowRequest[] = [
  { id: 1, item: 'Ivory linen set', person: 'Maya', dates: 'Jun 19 - 22', direction: 'incoming', status: 'Pending', glyph: 'LINEN' },
  { id: 2, item: 'Oversized blazer', person: 'Nina', dates: 'Jun 14', direction: 'incoming', status: 'Pending', glyph: 'BLAZER' },
  { id: 3, item: 'Chocolate satin dress', person: 'Maya', dates: 'Jun 27 - 29', direction: 'outgoing', status: 'Approved', glyph: 'SATIN' },
]

const friends = [
  { name: 'Maya', initials: 'MA', count: 42, color: '#e8a48f' },
  { name: 'Liv', initials: 'LI', count: 31, color: '#a9be91' },
  { name: 'Sam', initials: 'SA', count: 28, color: '#d5ab69' },
  { name: 'Nina', initials: 'NI', count: 37, color: '#9a9ebd' },
]

function ItemVisual({ item, compact = false }: { item: ClosetItem; compact?: boolean }) {
  return (
    <div className={`item-visual color-${item.color} ${compact ? 'compact' : ''}`}>
      <span>{item.glyph}</span>
      <div className={`garment garment-${item.category.toLowerCase()}`} />
    </div>
  )
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [items, setItems] = useState(initialItems)
  const [requests, setRequests] = useState(initialRequests)
  const [selectedItem, setSelectedItem] = useState<ClosetItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [borrowableOnly, setBorrowableOnly] = useState(false)
  const [category, setCategory] = useState('All')
  const [toast, setToast] = useState('')
  const [outfitsVisible, setOutfitsVisible] = useState(false)

  const visibleOwnItems = useMemo(
    () => items.filter((item) => category === 'All' || item.category === category),
    [items, category],
  )
  const visibleFriendItems = borrowableOnly
    ? friendItems.filter((item) => item.visibility === 'Borrowable')
    : friendItems

  function navigate(next: Page) {
    setPage(next)
    setSelectedItem(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  function updateVisibility(item: ClosetItem, visibility: Visibility) {
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, visibility } : entry))
    setSelectedItem({ ...item, visibility })
    notify(`Now ${visibility.toLowerCase()}`)
  }

  function requestItem(item: ClosetItem) {
    if (!requests.some((request) => request.item === item.name)) {
      setRequests((current) => [...current, {
        id: Date.now(), item: item.name, person: item.owner, dates: 'Jun 27 - 29', direction: 'outgoing', status: 'Pending', glyph: item.glyph,
      }])
    }
    setSelectedItem(null)
    notify(`Request sent to ${item.owner}`)
  }

  function resolveRequest(id: number, status: 'Approved' | 'Declined') {
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request))
    notify(status === 'Approved' ? 'Borrow request approved' : 'Request declined')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('home')} aria-label="Go home">
          <span className="brand-mark">M</span>
          <span>my friends closet</span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <NavButton active={page === 'home'} onClick={() => navigate('home')} label="Home" />
          <NavButton active={page === 'closet'} onClick={() => navigate('closet')} label="My closet" />
          <NavButton active={page === 'friends'} onClick={() => navigate('friends')} label="Friends" />
          <NavButton active={page === 'requests'} onClick={() => navigate('requests')} label="Requests" count={requests.filter((r) => r.status === 'Pending').length} />
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Search"><Search size={19} /></button>
          <button className="avatar self">BK</button>
        </div>
      </header>

      <main>
        {page === 'home' && <Dashboard navigate={navigate} items={items} requests={requests} onItem={setSelectedItem} />}
        {page === 'closet' && (
          <section className="page-container">
            <PageHeading eyebrow="Your wardrobe" title="My closet" subtitle={`${items.length} pieces, ${items.filter((item) => item.visibility === 'Borrowable').length} ready to share.`}>
              <button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> Add an item</button>
            </PageHeading>
            <div className="filter-row">
              {['All', 'Dresses', 'Jackets', 'Shoes', 'Accessories'].map((filter) => (
                <button key={filter} className={category === filter ? 'filter active' : 'filter'} onClick={() => setCategory(filter)}>{filter}</button>
              ))}
            </div>
            <div className="item-grid">
              {visibleOwnItems.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
            </div>
          </section>
        )}
        {page === 'friends' && (
          <section className="page-container">
            <PageHeading eyebrow="The good stuff" title="Friends' closets" subtitle="Borrow something with a story, not another shopping bag." />
            <div className="friend-strip">
              {friends.map((friend) => <button className="friend-pill" key={friend.name}><span className="avatar" style={{ background: friend.color }}>{friend.initials}</span><span><b>{friend.name}</b><small>{friend.count} pieces</small></span></button>)}
            </div>
            <div className="section-heading inline">
              <div><p className="eyebrow">Palm Springs picks</p><h2>Shared with you</h2></div>
              <label className="toggle-label">Borrowable only <button className={borrowableOnly ? 'switch on' : 'switch'} onClick={() => setBorrowableOnly(!borrowableOnly)}><span /></button></label>
            </div>
            <div className="item-grid">
              {visibleFriendItems.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
            </div>
          </section>
        )}
        {page === 'requests' && <RequestsPage requests={requests} resolveRequest={resolveRequest} />}
        {page === 'style' && <StylePage visible={outfitsVisible} generate={() => setOutfitsVisible(true)} onItem={setSelectedItem} />}
        {page === 'event' && <EventPage onItem={setSelectedItem} />}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <MobileNav icon={<Home />} label="Home" active={page === 'home'} onClick={() => navigate('home')} />
        <MobileNav icon={<Shirt />} label="Closet" active={page === 'closet'} onClick={() => navigate('closet')} />
        <MobileNav icon={<Users />} label="Friends" active={page === 'friends'} onClick={() => navigate('friends')} />
        <MobileNav icon={<Sparkles />} label="Style" active={page === 'style'} onClick={() => navigate('style')} />
        <MobileNav icon={<CircleUserRound />} label="Requests" active={page === 'requests'} onClick={() => navigate('requests')} />
      </nav>

      {selectedItem && <ItemModal item={selectedItem} own={selectedItem.owner === 'You'} close={() => setSelectedItem(null)} updateVisibility={updateVisibility} requestItem={requestItem} />}
      {showAdd && <AddItemModal close={() => setShowAdd(false)} save={(item) => { setItems((current) => [...current, item]); setShowAdd(false); notify('Added to your closet') }} />}
      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
    </div>
  )
}

function NavButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return <button className={active ? 'nav-link active' : 'nav-link'} onClick={onClick}>{label}{count ? <span>{count}</span> : null}</button>
}

function MobileNav({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span></button>
}

function PageHeading({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children?: React.ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{children}</div>
}

function Dashboard({ navigate, items, requests, onItem }: { navigate: (page: Page) => void; items: ClosetItem[]; requests: BorrowRequest[]; onItem: (item: ClosetItem) => void }) {
  return <>
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Wednesday, June 10</p>
        <h1>Your closet,<br /><em>but social.</em></h1>
        <p>Share what you love. Borrow what you don't own. Get dressed with a little help from your friends.</p>
        <div className="hero-actions"><button className="primary-button" onClick={() => navigate('style')}><Sparkles size={18} /> Style me for Saturday</button><button className="text-button" onClick={() => navigate('friends')}>Browse friends' closets <ArrowRight size={16} /></button></div>
      </div>
      <div className="hero-collage" aria-label="Featured closet items">
        <div className="collage-card one"><ItemVisual item={friendItems[0]} /><span>Maya's satin dress</span></div>
        <div className="collage-card two"><ItemVisual item={items[0]} /><span>Your linen set</span></div>
        <div className="scribble">borrow<br />before<br />you buy</div>
      </div>
    </section>

    <section className="stats-row page-container tight">
      <button onClick={() => navigate('closet')}><strong>{items.length}</strong><span>pieces in your closet</span><ChevronRight /></button>
      <button onClick={() => navigate('closet')}><strong>{items.filter((item) => item.visibility === 'Borrowable').length}</strong><span>ready to borrow</span><ChevronRight /></button>
      <button onClick={() => navigate('requests')}><strong>{requests.filter((request) => request.status === 'Pending').length}</strong><span>open requests</span><ChevronRight /></button>
    </section>

    <section className="page-container dashboard-section">
      <div className="section-heading inline"><div><p className="eyebrow">Fresh from the group</p><h2>Just shared</h2></div><button className="text-button" onClick={() => navigate('friends')}>See all <ArrowRight size={16} /></button></div>
      <div className="item-grid feature-grid">{friendItems.slice(0, 4).map((item) => <ItemCard key={item.id} item={item} onClick={() => onItem(item)} />)}</div>
    </section>

    <section className="page-container event-banner">
      <div className="event-date"><span>JUN</span><strong>27</strong></div>
      <div><p className="eyebrow">Upcoming event closet</p><h2>Palm Springs weekend</h2><p>4 friends · 18 shared pieces · 3 outfits waiting</p></div>
      <div className="mini-avatars">{friends.map((friend) => <span key={friend.name} style={{ background: friend.color }}>{friend.initials}</span>)}</div>
      <button className="secondary-button" onClick={() => navigate('event')}>Open event closet <ArrowRight size={16} /></button>
    </section>
  </>
}

function ItemCard({ item, onClick }: { item: ClosetItem; onClick: () => void }) {
  return <button className="item-card" onClick={onClick}>
    <div className="visual-wrap"><ItemVisual item={item} /><span className={`visibility-badge ${item.visibility.toLowerCase()}`}>{item.visibility === 'Borrowable' ? 'Available to borrow' : item.visibility}</span><Heart className="heart" size={20} /></div>
    <div className="item-info"><div><h3>{item.name}</h3><p>{item.brand} · Size {item.size}</p></div>{item.owner !== 'You' && <span className="owner">{item.owner.slice(0, 1)}</span>}</div>
  </button>
}

function RequestsPage({ requests, resolveRequest }: { requests: BorrowRequest[]; resolveRequest: (id: number, status: 'Approved' | 'Declined') => void }) {
  const incoming = requests.filter((request) => request.direction === 'incoming')
  const outgoing = requests.filter((request) => request.direction === 'outgoing')
  return <section className="page-container">
    <PageHeading eyebrow="Closet karma" title="Borrow requests" subtitle="A good closet is meant to get out sometimes." />
    <div className="requests-layout">
      <div><div className="section-heading"><p className="eyebrow">Needs your answer</p><h2>Incoming</h2></div>{incoming.map((request) => <RequestCard key={request.id} request={request} actions={request.status === 'Pending'} resolve={resolveRequest} />)}</div>
      <div><div className="section-heading"><p className="eyebrow">Things you've got your eye on</p><h2>Outgoing</h2></div>{outgoing.map((request) => <RequestCard key={request.id} request={request} resolve={resolveRequest} />)}</div>
    </div>
  </section>
}

function RequestCard({ request, actions, resolve }: { request: BorrowRequest; actions?: boolean; resolve: (id: number, status: 'Approved' | 'Declined') => void }) {
  return <article className="request-card"><div className="request-thumb">{request.glyph}</div><div className="request-copy"><span className={`status ${request.status.toLowerCase()}`}>{request.status}</span><h3>{request.item}</h3><p>{request.direction === 'incoming' ? `${request.person} wants to borrow it` : `Requested from ${request.person}`}</p><small><CalendarDays size={14} /> {request.dates}</small></div>{actions && <div className="request-actions"><button className="approve" onClick={() => resolve(request.id, 'Approved')}><Check /> Approve</button><button className="decline" onClick={() => resolve(request.id, 'Declined')}><X /> Decline</button></div>}</article>
}

function StylePage({ visible, generate, onItem }: { visible: boolean; generate: () => void; onItem: (item: ClosetItem) => void }) {
  return <section className="style-page">
    <div className="style-intro page-container"><p className="eyebrow">Your AI stylist + your real-life closet</p><h1>What are we<br /><em>dressing for?</em></h1><p>Tell us the plan. We'll pull from your closet and the pieces your friends are happy to share.</p></div>
    <div className="style-form page-container">
      <label>Occasion<input defaultValue="Rooftop birthday dinner" /></label>
      <label>Vibe<div className="choice-row"><button className="choice selected">Effortless</button><button className="choice">A little bold</button><button className="choice">Romantic</button></div></label>
      <label>Where?<input defaultValue="Palm Springs · Warm evening" /></label>
      <label className="closet-source">Pull from<div className="choice-row"><button className="choice">My closet only</button><button className="choice selected">Mine + friends'</button></div></label>
      <button className="primary-button generate" onClick={generate}><Sparkles size={19} /> Build my looks</button>
    </div>
    {visible && <div className="outfits page-container"><div className="section-heading"><p className="eyebrow">Three ways to wear the night</p><h2>Your looks are ready</h2></div><div className="outfit-grid">
      <OutfitCard number="01" title="Desert after dark" description="The satin dress does the talking. Your blazer keeps it relaxed after sunset." items={[friendItems[0], initialItems[2], initialItems[4]]} onItem={onItem} borrowed="Maya's dress" />
      <OutfitCard number="02" title="Cool without trying" description="Linen, a tiny bag, and the right boots. Easy enough for dinner, memorable enough for photos." items={[initialItems[0], friendItems[1], friendItems[2]]} onItem={onItem} borrowed="Liv's bag + Sam's boots" />
      <OutfitCard number="03" title="Soft power" description="A clean tonal base with just enough shine. Polished, never overdone." items={[initialItems[1], friendItems[5], initialItems[4]]} onItem={onItem} borrowed="Liv's heels" />
    </div></div>}
  </section>
}

function OutfitCard({ number, title, description, items, borrowed, onItem }: { number: string; title: string; description: string; items: ClosetItem[]; borrowed: string; onItem: (item: ClosetItem) => void }) {
  return <article className="outfit-card"><span className="outfit-number">LOOK {number}</span><div className="outfit-items">{items.map((item) => <button key={item.id} onClick={() => onItem(item)}><ItemVisual item={item} compact /></button>)}</div><h3>{title}</h3><p>{description}</p><small><Users size={14} /> Borrowing {borrowed}</small><button className="secondary-button"><Heart size={16} /> Save this look</button></article>
}

function EventPage({ onItem }: { onItem: (item: ClosetItem) => void }) {
  return <section className="page-container">
    <div className="event-hero"><div><p className="eyebrow">Jun 27 - 29 · Palm Springs, CA</p><h1>Palm Springs<br /><em>weekend</em></h1><p>Pool days, one birthday dinner, and absolutely no panic-shopping.</p></div><div className="sun">PS<br /><span>27</span></div></div>
    <div className="event-members"><div className="mini-avatars large">{friends.map((friend) => <span key={friend.name} style={{ background: friend.color }}>{friend.initials}</span>)}</div><p><strong>You, Maya, Liv, Sam + Nina</strong><br />18 pieces shared for this trip</p><button className="secondary-button"><Plus size={16} /> Invite a friend</button></div>
    <div className="section-heading inline"><div><p className="eyebrow">The shared rack</p><h2>Pack less. Share more.</h2></div><span className="event-note">Everyone can see these</span></div>
    <div className="item-grid">{friendItems.slice(0, 4).map((item) => <ItemCard key={item.id} item={item} onClick={() => onItem(item)} />)}</div>
  </section>
}

function ItemModal({ item, own, close, updateVisibility, requestItem }: { item: ClosetItem; own: boolean; close: () => void; updateVisibility: (item: ClosetItem, visibility: Visibility) => void; requestItem: (item: ClosetItem) => void }) {
  return <div className="modal-backdrop" onMouseDown={close}><div className="item-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={close}><X /></button><ItemVisual item={item} /><div className="modal-content"><p className="eyebrow">{own ? 'From your closet' : `From ${item.owner}'s closet`}</p><h2>{item.name}</h2><p>{item.brand} · {item.category} · Size {item.size}</p>{own ? <><h4>Who can see this?</h4><div className="visibility-options">{(['Private', 'Friends', 'Borrowable'] as Visibility[]).map((option) => <button key={option} className={item.visibility === option ? 'selected' : ''} onClick={() => updateVisibility(item, option)}>{option}</button>)}</div></> : <><div className="lender-note"><span className="avatar">{item.owner.slice(0, 1)}</span><p><strong>{item.owner} says:</strong><br />“Happy for this one to have a night out.”</p></div><button className="primary-button full" onClick={() => requestItem(item)}>Want to borrow this?</button></>}</div></div></div>
}

function AddItemModal({ close, save }: { close: () => void; save: (item: ClosetItem) => void }) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('Friends')
  return <div className="modal-backdrop"><form className="add-modal" onSubmit={(event) => { event.preventDefault(); if (name.trim()) save({ id: Date.now(), name, owner: 'You', category: 'Dresses', size: 'S', brand: 'New find', visibility, color: 'lilac', glyph: 'NEW' }) }}><button type="button" className="modal-close" onClick={close}><X /></button><p className="eyebrow">A new closet favorite</p><h2>Add an item</h2><div className="upload-zone"><Plus /><strong>Add a photo</strong><span>Drag one here or choose from your camera roll</span></div><label>Item name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. The perfect black dress" required /></label><div className="form-grid"><label>Category<select><option>Dresses</option><option>Jackets</option><option>Shoes</option><option>Accessories</option></select></label><label>Size<input defaultValue="S" /></label><label>Brand<input placeholder="Optional" /></label><label>Color<input placeholder="Black" /></label></div><label>Who can see it?<div className="visibility-options">{(['Private', 'Friends', 'Borrowable'] as Visibility[]).map((option) => <button type="button" key={option} className={visibility === option ? 'selected' : ''} onClick={() => setVisibility(option)}>{option}</button>)}</div></label><button className="primary-button full" type="submit">Add to my closet</button></form></div>
}

export default App
