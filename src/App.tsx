import { useMemo, useState, type ReactNode } from 'react'
import { Check, CircleUserRound, Home, Plus, Search, Shirt, Sparkles, Users } from 'lucide-react'
import { AddItemModal, ItemCard, ItemModal, PageHeading } from './components/ClosetUI'
import { Dashboard, EventPage, RequestsPage, StylePage } from './components/Pages'
import { friendItems, friends, initialItems, initialRequests } from './data/mockData'
import type { BorrowRequest, ClosetItem, Page, Visibility } from './types'
import './App.css'

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

  const visibleOwnItems = useMemo(() => items.filter((item) => category === 'All' || item.category === category), [items, category])
  const visibleFriendItems = borrowableOnly ? friendItems.filter((item) => item.visibility === 'Borrowable') : friendItems

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
      const request: BorrowRequest = { id: Date.now(), item: item.name, person: item.owner, dates: 'Jun 27 - 29', direction: 'outgoing', status: 'Pending', glyph: item.glyph }
      setRequests((current) => [...current, request])
    }
    setSelectedItem(null)
    notify(`Request sent to ${item.owner}`)
  }

  function resolveRequest(id: number, status: 'Approved' | 'Declined') {
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request))
    notify(status === 'Approved' ? 'Borrow request approved' : 'Request declined')
  }

  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => navigate('home')} aria-label="Go home"><span className="brand-mark">M</span><span>my friends closet</span></button><nav className="desktop-nav" aria-label="Primary navigation"><NavButton active={page === 'home'} onClick={() => navigate('home')} label="Home" /><NavButton active={page === 'closet'} onClick={() => navigate('closet')} label="My closet" /><NavButton active={page === 'friends'} onClick={() => navigate('friends')} label="Friends" /><NavButton active={page === 'requests'} onClick={() => navigate('requests')} label="Requests" count={requests.filter((request) => request.status === 'Pending').length} /></nav><div className="header-actions"><button className="icon-button" aria-label="Search"><Search size={19} /></button><button className="avatar self" aria-label="Open profile">BK</button></div></header>
    <main>
      {page === 'home' && <Dashboard navigate={navigate} items={items} requests={requests} onItem={setSelectedItem} />}
      {page === 'closet' && <section className="page-container"><PageHeading eyebrow="Your wardrobe" title="My closet" subtitle={`${items.length} pieces, ${items.filter((item) => item.visibility === 'Borrowable').length} ready to share.`}><button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> Add an item</button></PageHeading><div className="filter-row">{['All', 'Dresses', 'Jackets', 'Shoes', 'Accessories'].map((filter) => <button key={filter} className={category === filter ? 'filter active' : 'filter'} onClick={() => setCategory(filter)}>{filter}</button>)}</div><div className="item-grid">{visibleOwnItems.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}</div></section>}
      {page === 'friends' && <section className="page-container"><PageHeading eyebrow="The good stuff" title="Friends' closets" subtitle="Borrow something with a story, not another shopping bag." /><div className="friend-strip">{friends.map((friend) => <button className="friend-pill" key={friend.name}><span className="avatar" style={{ background: friend.color }}>{friend.initials}</span><span><b>{friend.name}</b><small>{friend.count} pieces</small></span></button>)}</div><div className="section-heading inline"><div><p className="eyebrow">Palm Springs picks</p><h2>Shared with you</h2></div><label className="toggle-label">Borrowable only <button aria-pressed={borrowableOnly} aria-label="Borrowable only" className={borrowableOnly ? 'switch on' : 'switch'} onClick={() => setBorrowableOnly(!borrowableOnly)}><span /></button></label></div><div className="item-grid">{visibleFriendItems.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}</div></section>}
      {page === 'requests' && <RequestsPage requests={requests} resolveRequest={resolveRequest} />}
      {page === 'style' && <StylePage visible={outfitsVisible} generate={() => setOutfitsVisible(true)} onItem={setSelectedItem} />}
      {page === 'event' && <EventPage onItem={setSelectedItem} />}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation"><MobileNav icon={<Home />} label="Home" active={page === 'home'} onClick={() => navigate('home')} /><MobileNav icon={<Shirt />} label="Closet" active={page === 'closet'} onClick={() => navigate('closet')} /><MobileNav icon={<Users />} label="Friends" active={page === 'friends'} onClick={() => navigate('friends')} /><MobileNav icon={<Sparkles />} label="Style" active={page === 'style'} onClick={() => navigate('style')} /><MobileNav icon={<CircleUserRound />} label="Requests" active={page === 'requests'} onClick={() => navigate('requests')} /></nav>
    {selectedItem && <ItemModal item={selectedItem} own={selectedItem.owner === 'You'} close={() => setSelectedItem(null)} updateVisibility={updateVisibility} requestItem={requestItem} />}
    {showAdd && <AddItemModal close={() => setShowAdd(false)} save={(item) => { setItems((current) => [...current, item]); setShowAdd(false); notify('Added to your closet') }} />}
    {toast && <div className="toast"><Check size={17} /> {toast}</div>}
  </div>
}

function NavButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return <button className={active ? 'nav-link active' : 'nav-link'} onClick={onClick}>{label}{count ? <span>{count}</span> : null}</button>
}

function MobileNav({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span></button>
}

export default App
