import { useMemo, useState, type ReactNode } from 'react'
import { Check, CircleUserRound, Home, Plus, Search, Shirt, Sparkles, Users } from 'lucide-react'
import { AddItemModal, BorrowRequestModal, ItemCard, ItemModal, PageHeading } from './components/ClosetUI'
import { Dashboard, EventPage, RequestsPage, StylePage } from './components/Pages'
import { friendItems, friends, initialItems, initialRequests, profiles } from './data/mockData'
import { storageKeys, usePersistentState } from './lib/storage'
import type { BorrowRequest, ClosetItem, Identity, Page, Visibility } from './types'
import './App.css'

function App() {
  const [identity, setIdentity] = usePersistentState<Identity>(storageKeys.identity, 'owner')
  const [items, setItems, itemStorageFailure, clearItemStorageFailure] = usePersistentState<ClosetItem[]>(storageKeys.items, initialItems)
  const [requests, setRequests, requestStorageFailure, clearRequestStorageFailure] = usePersistentState<BorrowRequest[]>(storageKeys.requests, initialRequests)
  const [page, setPage] = useState<Page>('home')
  const [selectedItem, setSelectedItem] = useState<ClosetItem | null>(null)
  const [requestingItem, setRequestingItem] = useState<ClosetItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [borrowableOnly, setBorrowableOnly] = useState(false)
  const [category, setCategory] = useState('All')
  const [toast, setToast] = useState('')
  const [outfitsVisible, setOutfitsVisible] = useState(false)
  const profile = profiles[identity]

  const ownerItems = items.filter((item) => item.ownerId === 'owner')
  const visibleOwnItems = useMemo(() => ownerItems.filter((item) => category === 'All' || item.category === category), [ownerItems, category])
  const friendViewItems = ownerItems.filter((item) => item.visibility !== 'Private' && (!borrowableOnly || item.visibility === 'Borrowable'))
  const ownerFriendItems = borrowableOnly ? friendItems.filter((item) => item.visibility === 'Borrowable') : friendItems

  function navigate(next: Page) { setPage(next); setSelectedItem(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  function switchIdentity(next: Identity) { setIdentity(next); setPage(next === 'friend' ? 'friends' : 'home'); setSelectedItem(null); notify(`Continuing as ${profiles[next].name}`) }

  function updateVisibility(item: ClosetItem, visibility: Visibility) {
    const updatedAt = new Date().toISOString()
    if (setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, visibility, updatedAt } : entry))) {
      setSelectedItem({ ...item, visibility, updatedAt })
      notify(`Now ${visibility.toLowerCase()}`)
    }
  }

  function deleteItem(item: ClosetItem) {
    if (setItems((current) => current.filter((entry) => entry.id !== item.id))) {
      setRequests((current) => current.filter((request) => request.itemId !== item.id))
      setSelectedItem(null)
      notify('Item deleted')
    }
  }

  function saveRequest(request: BorrowRequest) {
    const saved = setRequests((current) => [...current.filter((entry) => !(entry.itemId === request.itemId && entry.requesterId === request.requesterId && entry.status === 'Pending')), request])
    if (saved) {
      setRequestingItem(null)
      setSelectedItem(null)
      notify('Borrow request sent')
    }
    return saved
  }

  function resolveRequest(id: number, status: 'Approved' | 'Declined') {
    if (setRequests((current) => current.map((request) => request.id === id ? { ...request, status, updatedAt: new Date().toISOString() } : request))) {
      notify(status === 'Approved' ? 'Borrow request approved' : 'Request declined')
    }
  }

  const pendingCount = requests.filter((request) => identity === 'owner' ? request.ownerId === 'owner' && request.status === 'Pending' : request.requesterId === identity && request.status === 'Pending').length

  return <div className="app-shell" data-identity={identity}>
    <header className="topbar"><button className="brand" onClick={() => navigate('home')} aria-label="Go home"><span className="brand-mark">M</span><span>my friends closet</span></button><nav className="desktop-nav" aria-label="Primary navigation"><NavButton active={page === 'home'} onClick={() => navigate('home')} label="Home" />{identity === 'owner' && <NavButton active={page === 'closet'} onClick={() => navigate('closet')} label="My closet" />}<NavButton active={page === 'friends'} onClick={() => navigate('friends')} label={identity === 'friend' ? "Brian's closet" : 'Friends'} /><NavButton active={page === 'requests'} onClick={() => navigate('requests')} label="Requests" count={pendingCount} /></nav><div className="header-actions"><button className="icon-button" aria-label="Search"><Search size={19} /></button><div className="identity-switcher" aria-label="Demo identity"><button className={identity === 'owner' ? 'active' : ''} onClick={() => switchIdentity('owner')}>Brian</button><button className={identity === 'friend' ? 'active' : ''} onClick={() => switchIdentity('friend')}>Alex</button></div><span className="avatar self" aria-label={`Current identity: ${profile.name}`}>{profile.initials}</span></div></header>
    <div className={`identity-banner ${identity}`}><strong>{identity === 'owner' ? 'Owner mode' : 'Friend mode'}</strong><span>{identity === 'owner' ? 'Add clothes and respond to requests.' : "You are viewing Brian's shared closet."}</span></div>
    {(itemStorageFailure || requestStorageFailure) && <div className="storage-alert" role="alert"><div><strong>Not saved</strong><span>{itemStorageFailure?.message ?? requestStorageFailure?.message}</span></div><div><button onClick={() => { setIdentity('owner'); setPage('closet'); setSelectedItem(null) }}>Manage closet</button><button aria-label="Dismiss storage warning" onClick={() => { clearItemStorageFailure(); clearRequestStorageFailure() }}>Dismiss</button></div></div>}
    <main>
      {page === 'home' && (identity === 'owner' ? <Dashboard navigate={navigate} items={ownerItems} requests={requests.filter((request) => request.ownerId === 'owner')} onItem={setSelectedItem} /> : <FriendCloset items={friendViewItems} borrowableOnly={borrowableOnly} setBorrowableOnly={setBorrowableOnly} onItem={setSelectedItem} />)}
      {page === 'closet' && identity === 'owner' && <section className="page-container"><PageHeading eyebrow="Your real wardrobe" title="My closet" subtitle={`${ownerItems.length} saved pieces, ${ownerItems.filter((item) => item.visibility === 'Borrowable').length} ready to borrow.`}><button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> Add from camera</button></PageHeading><div className="filter-row">{['All', 'Dresses', 'Jackets', 'Shoes', 'Accessories', 'Tops', 'Bottoms'].map((filter) => <button key={filter} className={category === filter ? 'filter active' : 'filter'} onClick={() => setCategory(filter)}>{filter}</button>)}</div><div className="item-grid">{visibleOwnItems.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}</div></section>}
      {page === 'friends' && (identity === 'friend' ? <FriendCloset items={friendViewItems} borrowableOnly={borrowableOnly} setBorrowableOnly={setBorrowableOnly} onItem={setSelectedItem} /> : <section className="page-container"><PageHeading eyebrow="The good stuff" title="Friends' closets" subtitle="Borrow something with a story, not another shopping bag." /><div className="friend-strip">{friends.map((friend) => <button className="friend-pill" key={friend.name}><span className="avatar" style={{ background: friend.color }}>{friend.initials}</span><span><b>{friend.name}</b><small>{friend.count} pieces</small></span></button>)}</div><div className="section-heading inline"><div><p className="eyebrow">Palm Springs picks</p><h2>Shared with you</h2></div><BorrowableToggle value={borrowableOnly} setValue={setBorrowableOnly} /></div><div className="item-grid">{ownerFriendItems.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}</div></section>)}
      {page === 'requests' && <RequestsPage requests={requests} identity={identity} resolveRequest={resolveRequest} />}
      {page === 'style' && <StylePage visible={outfitsVisible} generate={() => setOutfitsVisible(true)} onItem={setSelectedItem} items={ownerItems} />}
      {page === 'event' && <EventPage onItem={setSelectedItem} />}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation"><MobileNav icon={<Home />} label="Home" active={page === 'home'} onClick={() => navigate('home')} />{identity === 'owner' && <MobileNav icon={<Shirt />} label="Closet" active={page === 'closet'} onClick={() => navigate('closet')} />}<MobileNav icon={<Users />} label="Share" active={page === 'friends'} onClick={() => navigate('friends')} /><MobileNav icon={<Sparkles />} label="Style" active={page === 'style'} onClick={() => navigate('style')} /><MobileNav icon={<CircleUserRound />} label="Requests" active={page === 'requests'} onClick={() => navigate('requests')} /></nav>
    {selectedItem && <ItemModal item={selectedItem} own={identity === 'owner' && selectedItem.ownerId === 'owner'} close={() => setSelectedItem(null)} updateVisibility={updateVisibility} requestItem={(item) => setRequestingItem(item)} deleteItem={deleteItem} />}
    {showAdd && <AddItemModal close={() => setShowAdd(false)} save={(item) => { const saved = setItems((current) => [...current, item]); if (saved) { setShowAdd(false); notify('Saved to your closet') } return saved }} />}
    {requestingItem && <BorrowRequestModal item={requestingItem} requester={identity} close={() => setRequestingItem(null)} save={saveRequest} />}
    {toast && <div className="toast"><Check size={17} /> {toast}</div>}
  </div>
}

function FriendCloset({ items, borrowableOnly, setBorrowableOnly, onItem }: { items: ClosetItem[]; borrowableOnly: boolean; setBorrowableOnly: (value: boolean) => void; onItem: (item: ClosetItem) => void }) {
  return <section className="page-container"><PageHeading eyebrow="Shared with Alex" title="Brian's closet" subtitle="Only pieces Brian chose to share appear here. Borrowable pieces can be requested." /><div className="share-code"><span>Demo invite</span><strong>MFC-BRIAN</strong><small>Switch between Brian and Alex above to test both sides.</small></div><div className="section-heading inline"><div><p className="eyebrow">Friend view</p><h2>{items.length ? 'Available from Brian' : 'Nothing shared yet'}</h2></div><BorrowableToggle value={borrowableOnly} setValue={setBorrowableOnly} /></div>{items.length ? <div className="item-grid">{items.map((item) => <ItemCard key={item.id} item={item} onClick={() => onItem(item)} />)}</div> : <div className="empty-state"><Shirt /><h3>Brian's shared rack is empty</h3><p>Switch to Brian, add an item, and mark it Friends or Borrowable.</p></div>}</section>
}

function BorrowableToggle({ value, setValue }: { value: boolean; setValue: (value: boolean) => void }) { return <label className="toggle-label">Borrowable only <button aria-pressed={value} aria-label="Borrowable only" className={value ? 'switch on' : 'switch'} onClick={() => setValue(!value)}><span /></button></label> }
function NavButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) { return <button className={active ? 'nav-link active' : 'nav-link'} onClick={onClick}>{label}{count ? <span>{count}</span> : null}</button> }
function MobileNav({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) { return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span></button> }

export default App
