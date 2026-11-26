import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, CircleUserRound, Copy, Download, Home, Images, Plus, Search, Shirt, Share2, Sparkles, Users, X } from 'lucide-react'
import { AddItemModal, BorrowRequestModal, ItemCard, ItemModal, PageHeading } from './components/ClosetUI'
import { Dashboard, EventPage, RequestsPage } from './components/Pages'
import { BulkAddModal } from './components/BulkAddModal'
import { WardrobeBackupModal } from './components/WardrobeBackupModal'
import { StylePage } from './components/StylePage'
import { friendItems, friends, initialItems, initialRequests, profiles } from './data/mockData'
import { storageKeys, usePersistentState } from './lib/storage'
import { conflictingApproval } from './lib/borrowDates'
import { requireCurrentPiece } from './lib/wardrobeStore'
import { useWardrobe } from './lib/useWardrobe'
import { hasOutfitBase } from './lib/aiLookExchange'
import { closetGaps } from './lib/stylist'
import { filterCloset, type ClosetFilters } from './lib/closetSearch'
import { mergeLookBackup, planWardrobeRestore } from './lib/wardrobeBackup'
import type { BorrowRequest, BorrowStatus, ClosetItem, Identity, OutfitLook, Page, Visibility } from './types'
import './App.css'

const exampleIds = new Set(initialItems.map((item) => item.id))
const galleryBatch = 24

function App() {
  const inviteParams = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
  const inviteFriendMode = inviteParams?.get('invite') === 'MFC-BRIAN' && inviteParams.get('mode') === 'friend'
  const [identity, setIdentity] = usePersistentState<Identity>(storageKeys.identity, inviteFriendMode ? 'friend' : 'owner')
  const [items, setItems, itemStorageFailure, clearItemStorageFailure, wardrobeLoading] = useWardrobe(initialItems)
  const [savedLooks, setSavedLooks, looksStorageFailure] = usePersistentState<OutfitLook[]>(storageKeys.savedLooks, [], true)
  const [requests, setRequests, requestStorageFailure, clearRequestStorageFailure] = usePersistentState<BorrowRequest[]>(storageKeys.requests, initialRequests)
  const [onboardingDismissed, setOnboardingDismissed] = usePersistentState(storageKeys.onboardingDismissed, inviteFriendMode)
  const [stylingAnchorId, setStylingAnchorId] = useState<number>()
  const [page, setPage] = useState<Page>(inviteFriendMode ? 'friends' : 'home')
  const [selectedItem, setSelectedItem] = useState<ClosetItem | null>(null)
  const [requestingItem, setRequestingItem] = useState<ClosetItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [editingItem, setEditingItem] = useState<ClosetItem | null>(null)
  const [photoOnly, setPhotoOnly] = useState(false)
  const [showSamples, setShowSamples] = useState(false)
  const [borrowableOnly, setBorrowableOnly] = useState(false)
  const [category, setCategory] = useState('All')
  const [closetQuery, setClosetQuery] = useState('')
  const [closetVisibility, setClosetVisibility] = useState<ClosetFilters['visibility']>('Any')
  const [closetOrder, setClosetOrder] = useState<ClosetFilters['order']>('Recent')
  const closetSearchRef = useRef<HTMLInputElement>(null)
  const closetGridRef = useRef<HTMLDivElement>(null)
  const [galleryLimit, setGalleryLimit] = useState<{ key: string; count: number }>({ key: '', count: galleryBatch })
  const [toast, setToast] = useState('')
  const profile = profiles[identity]

  const ownerItems = useMemo(() => items.filter((item) => item.ownerId === 'owner'), [items])
  const personalItems = useMemo(() => ownerItems.filter((item) => item.imageData || !exampleIds.has(item.id)), [ownerItems])
  const personalPhotos = useMemo(() => personalItems.filter((item) => item.imageData), [personalItems])
  const readyToStyle = hasOutfitBase(personalPhotos)
  const existingPhotos = useMemo(() => new Set(personalPhotos.map((item) => item.imageData!)), [personalPhotos])
  const visibleOwnItems = useMemo(() => filterCloset(showSamples ? ownerItems : personalItems, {
    category, photoOnly, query: closetQuery, visibility: closetVisibility, order: closetOrder,
  }), [ownerItems, personalItems, showSamples, category, photoOnly, closetQuery, closetVisibility, closetOrder])
  const galleryKey = JSON.stringify([showSamples, category, photoOnly, closetQuery, closetVisibility, closetOrder])
  const resultLimit = galleryLimit.key === galleryKey ? galleryLimit.count : galleryBatch
  const gallery = visibleOwnItems.slice(0, resultLimit)
  function showMoreClothes(keyboard: boolean) {
    const firstNew = gallery.length
    setGalleryLimit({ key: galleryKey, count: resultLimit + galleryBatch })
    if (keyboard) window.requestAnimationFrame(() => closetGridRef.current?.querySelectorAll<HTMLButtonElement>(':scope > button')[firstNew]?.focus())
  }
  const activeFilters = category !== 'All' || photoOnly || showSamples || Boolean(closetQuery.trim()) || closetVisibility !== 'Any'
  function resetClosetFilters() { setCategory('All'); setPhotoOnly(false); setShowSamples(false); setClosetQuery(''); setClosetVisibility('Any') }
  function showPersonalPhotos() { resetClosetFilters(); setPhotoOnly(true) }
  const friendViewItems = ownerItems.filter((item) => item.visibility !== 'Private' && (!borrowableOnly || item.visibility === 'Borrowable'))
  const ownerFriendItems = borrowableOnly ? friendItems.filter((item) => item.visibility === 'Borrowable') : friendItems
  const inviteLink = typeof window === 'undefined'
    ? 'https://example.com/?invite=MFC-BRIAN&mode=friend'
    : `${window.location.origin}${window.location.pathname}?invite=MFC-BRIAN&mode=friend`

  function navigate(next: Page) { if (next === 'style' && page !== 'style') setStylingAnchorId(undefined); setPage(next); setSelectedItem(null); window.scrollTo({ top: 0, behavior: 'instant' }) }
  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  function switchIdentity(next: Identity) { setIdentity(next); setPage(next === 'friend' ? 'friends' : 'home'); setSelectedItem(null); setEditingItem(null); setShowAdd(false); setShowBulkAdd(false); setShowBackup(false); setRequestingItem(null); notify(`Continuing as ${profiles[next].name}`) }
  function dismissOnboarding() { setOnboardingDismissed(true) }
  function startPhotoBatch() { navigate('closet'); setShowBulkAdd(true) }

  const inviteShareData = {
    title: 'My Friends Closet demo',
    text: 'Try friend mode with example clothes. Personal photos are not included.',
    url: inviteLink,
  }

  async function copyInviteLink() {
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(inviteLink)
      notify('Invite link copied')
      return
    }

    notify('Invite code: MFC-BRIAN')
  }

  async function shareInviteLink() {
    if ('share' in navigator) {
      try {
        await navigator.share(inviteShareData)
        notify('Invite link shared')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    await copyInviteLink()
  }

  async function updateVisibility(item: ClosetItem, visibility: Visibility) {
    let updated: ClosetItem | undefined
    if (await setItems((current) => {
      updated = { ...requireCurrentPiece(current, item, false), visibility, updatedAt: new Date().toISOString() }
      return current.map((entry) => entry.id === item.id ? updated! : entry)
    })) {
      setSelectedItem(updated ?? null)
      notify(`Now ${visibility.toLowerCase()}`)
    }
  }

  async function deleteItem(item: ClosetItem) {
    if (await setItems((current) => {
      requireCurrentPiece(current, item)
      return current.filter((entry) => entry.id !== item.id)
    })) {
      setRequests((current) => current.filter((request) => request.itemId !== item.id))
      setSelectedItem(null)
      notify('Item deleted')
    }
  }

  function saveRequest(request: BorrowRequest): string | undefined {
    if (identity !== 'friend' || !items.some((item) => item.id === request.itemId && item.visibility === 'Borrowable')) {
      return 'This piece is no longer borrowable in the demo.'
    }
    if (conflictingApproval(request, requests)) return 'This piece has an approved loan for those dates. Pick different dates.'
    const saved = setRequests((current) => {
      const id = current.reduce((max, entry) => Math.max(max, entry.id + 1), request.id)
      return [...current.filter((entry) => !(entry.itemId === request.itemId && entry.requesterId === request.requesterId && entry.status === 'Pending')), { ...request, id }]
    })
    if (!saved) return 'This request could not be saved in this browser.'
    setRequestingItem(null)
    setSelectedItem(null)
    notify('Demo borrow request saved')
  }

  function resolveRequest(id: number, status: Exclude<BorrowStatus, 'Pending'>) {
    const request = requests.find((entry) => entry.id === id && entry.ownerId === 'owner')
    if (identity !== 'owner' || !request || request.status !== (status === 'Returned' ? 'Approved' : 'Pending')) return
    if (status === 'Approved' && !items.some((item) => item.id === request.itemId && item.visibility === 'Borrowable')) {
      notify('Make the item borrowable again before approving.')
      return
    }
    if (status === 'Approved' && conflictingApproval(request, requests)) {
      notify('Cannot approve: dates overlap an existing loan.')
      return
    }
    const now = new Date().toISOString()
    if (setRequests((current) => current.map((entry) => entry.id === id ? {
      ...entry, status, updatedAt: now, returnedAt: status === 'Returned' ? now : undefined,
    } : entry))) {
      notify(status === 'Approved' ? 'Borrow request approved' : status === 'Returned' ? 'Marked returned' : 'Request declined')
    }
  }

  const pendingCount = requests.filter((request) => identity === 'owner' ? request.ownerId === 'owner' && request.status === 'Pending' : request.requesterId === identity && request.status === 'Pending').length

  return <div className="app-shell" data-identity={identity}>
    <header className="topbar"><button className="brand" onClick={() => navigate('home')} aria-label="Go home"><span className="brand-mark">M</span><span>my friends closet</span></button><nav className="desktop-nav" aria-label="Primary navigation"><NavButton active={page === 'home'} onClick={() => navigate('home')} label="Home" />{identity === 'owner' && <NavButton active={page === 'closet'} onClick={() => navigate('closet')} label="My closet" />}<NavButton active={page === 'friends'} onClick={() => navigate('friends')} label={identity === 'friend' ? "Brian's closet" : 'Friends'} />{identity === 'owner' && <NavButton active={page === 'style'} onClick={() => navigate('style')} label="Style" />}<NavButton active={page === 'requests'} onClick={() => navigate('requests')} label="Requests" count={pendingCount} /></nav><div className="header-actions">{identity === 'owner' && <button className="icon-button" aria-label="Search my closet" onClick={() => {
      navigate('closet')
      window.requestAnimationFrame(() => closetSearchRef.current?.focus())
    }}><Search size={19} /></button>}<div className="identity-switcher" aria-label="Demo identity"><button className={identity === 'owner' ? 'active' : ''} onClick={() => switchIdentity('owner')}>Brian</button><button className={identity === 'friend' ? 'active' : ''} onClick={() => switchIdentity('friend')}>Alex</button></div><span className="avatar self" aria-label={`Current identity: ${profile.name}`}>{profile.initials}</span></div></header>
    <div className={`identity-banner ${identity}`}><strong>{identity === 'owner' ? 'Owner mode' : 'Friend mode'}</strong><span>{identity === 'owner' ? 'Your photos stay in this browser. Sharing and requests are simulated.' : 'Demo friend view. No photos are shared to another device.'}</span></div>
    {!onboardingDismissed && page === 'home' && <OnboardingCard
      identity={identity}
      switchIdentity={switchIdentity}
      dismiss={dismissOnboarding}
      startPhotoBatch={startPhotoBatch}
    />}
    {(itemStorageFailure || requestStorageFailure) && <div className="storage-alert" role="alert"><div><strong>Not saved</strong><span>{itemStorageFailure?.message ?? requestStorageFailure?.message}</span></div><div><button onClick={() => { setIdentity('owner'); setPage('closet'); setSelectedItem(null) }}>Manage closet</button><button aria-label="Dismiss storage warning" onClick={() => { clearItemStorageFailure(); clearRequestStorageFailure() }}>Dismiss</button></div></div>}
    <main aria-busy={wardrobeLoading}>
      {wardrobeLoading && <p className="photo-local-note wardrobe-loading" role="status">Opening your wardrobe…</p>}
      {page === 'home' && (identity === 'owner' ? <Dashboard addPhotos={startPhotoBatch} navigate={navigate} items={ownerItems} requests={requests.filter((request) => request.ownerId === 'owner')} onItem={setSelectedItem} /> : <FriendCloset items={friendViewItems} borrowableOnly={borrowableOnly} setBorrowableOnly={setBorrowableOnly} onItem={setSelectedItem} copyInviteLink={copyInviteLink} shareInviteLink={shareInviteLink} />)}
      {page === 'closet' && identity === 'owner' && <section className="page-container"><PageHeading eyebrow="Your real wardrobe" title="My closet" subtitle={`${personalItems.length} saved ${personalItems.length === 1 ? 'piece' : 'pieces'}, ${personalItems.filter((item) => item.visibility === 'Borrowable').length} ready to borrow.`}><div className="closet-add-actions"><button className="secondary-button" disabled={wardrobeLoading} onClick={() => setShowBackup(true)}><Download size={17} /> Backup</button><button className="secondary-button" disabled={wardrobeLoading} onClick={() => setShowBulkAdd(true)}><Images size={18} /> Add multiple photos</button><button className="primary-button" disabled={wardrobeLoading} onClick={() => setShowAdd(true)}><Plus size={18} /> Add from camera</button></div></PageHeading>
      {photoOnly && personalPhotos.length > 0 && !wardrobeLoading && <section className="closet-style-next" aria-label="Next step for your photos">
        <div><strong>{readyToStyle ? 'Your photos are ready to style' : 'One step closer to an outfit'}</strong>
          <p>{readyToStyle ? 'Pick a real occasion and see what you can make from these clothes.' : closetGaps(personalPhotos)}</p></div>
        <button className="secondary-button" onClick={readyToStyle ? () => navigate('style') : () => setShowBulkAdd(true)}>
          {readyToStyle ? <Sparkles size={16} /> : <Images size={16} />}{readyToStyle ? 'Style my photos' : 'Add more photos'}
        </button>
      </section>}
      <div className="closet-search-controls">
        <label className="closet-search-field"><span>Search clothes</span><div><Search size={18} /><input type="search" ref={closetSearchRef} value={closetQuery} maxLength={100} placeholder="Try navy, linen, or dinner" onChange={(event) => setClosetQuery(event.target.value)} /></div></label>
        <label>Visibility<select value={closetVisibility} onChange={(event) => setClosetVisibility(event.target.value as ClosetFilters['visibility'])}><option value="Any">All visibility</option><option>Private</option><option>Friends</option><option>Borrowable</option></select></label>
        <label>Sort by<select value={closetOrder} onChange={(event) => setClosetOrder(event.target.value as ClosetFilters['order'])}><option>Recent</option><option>A–Z</option></select></label>
      </div><div className="filter-row">{['All', 'Dresses', 'Sets', 'Jackets', 'Shoes', 'Accessories', 'Tops', 'Bottoms'].map((filter) => <button key={filter} className={category === filter ? 'filter active' : 'filter'} aria-pressed={category === filter} onClick={() => setCategory(filter)}>{filter}</button>)}<button className={photoOnly ? 'filter active' : 'filter'} aria-pressed={photoOnly} onClick={() => setPhotoOnly(!photoOnly)}>My photos only</button>{personalItems.length < ownerItems.length && <button className={showSamples ? 'filter active' : 'filter'} aria-pressed={showSamples} onClick={() => { if (!showSamples) setPhotoOnly(false); setShowSamples(!showSamples) }}>Include sample pieces</button>}</div><div className="closet-results-line"><span role="status">{visibleOwnItems.length > gallery.length ? `Showing ${gallery.length} of ${visibleOwnItems.length} pieces` : `${gallery.length} ${gallery.length === 1 ? 'piece' : 'pieces'} shown`}</span>{activeFilters && <button className="text-button" onClick={resetClosetFilters}>Clear filters</button>}</div>{gallery.length ? <><div className="item-grid" id="closet-grid" ref={closetGridRef}>{gallery.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}</div>
        {visibleOwnItems.length > gallery.length && <div className="closet-more"><button type="button" className="secondary-button" aria-controls="closet-grid" onClick={(event) => showMoreClothes(event.detail === 0)}>Show more clothes</button></div>}
      </> : <div className="empty-state"><Shirt /><h3>{!personalItems.length && !activeFilters ? 'Your closet is empty' : 'No matching pieces'}</h3><p>{!personalItems.length && !activeFilters ? 'Start with a top and bottom, or a dress. The app will build from clothes you actually own.' : 'Change the filters, or photograph a piece to add it here.'}</p></div>}</section>}
      {page === 'friends' && (identity === 'friend' ? <FriendCloset items={friendViewItems} borrowableOnly={borrowableOnly} setBorrowableOnly={setBorrowableOnly} onItem={setSelectedItem} copyInviteLink={copyInviteLink} shareInviteLink={shareInviteLink} /> : <section className="page-container"><PageHeading eyebrow="The good stuff" title="Friends' closets" subtitle="Borrow something with a story, not another shopping bag." /><div className="friend-strip">{friends.map((friend) => <button className="friend-pill" key={friend.name}><span className="avatar" style={{ background: friend.color }}>{friend.initials}</span><span><b>{friend.name}</b><small>{friend.count} pieces</small></span></button>)}</div><div className="section-heading inline"><div><p className="eyebrow">Palm Springs picks</p><h2>Shared with you</h2></div><BorrowableToggle value={borrowableOnly} setValue={setBorrowableOnly} /></div><div className="item-grid">{ownerFriendItems.map((item) => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}</div></section>)}
      {page === 'requests' && <RequestsPage requests={requests} identity={identity} resolveRequest={resolveRequest} />}
      {identity === 'owner' && page === 'style' && <StylePage key={stylingAnchorId ?? "any"} initialAnchorId={stylingAnchorId} onItem={setSelectedItem} onAdd={() => setShowAdd(true)} items={ownerItems} saved={savedLooks} setSaved={setSavedLooks} storageError={looksStorageFailure} />}
      {page === 'event' && <EventPage onItem={setSelectedItem} />}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation"><MobileNav icon={<Home />} label="Home" active={page === 'home'} onClick={() => navigate('home')} />{identity === 'owner' && <MobileNav icon={<Shirt />} label="Closet" active={page === 'closet'} onClick={() => navigate('closet')} />}<MobileNav icon={<Users />} label="Share" active={page === 'friends'} onClick={() => navigate('friends')} />{identity === 'owner' && <MobileNav icon={<Sparkles />} label="Style" active={page === 'style'} onClick={() => navigate('style')} />}<MobileNav icon={<CircleUserRound />} label="Requests" active={page === 'requests'} onClick={() => navigate('requests')} /></nav>
    {selectedItem && <ItemModal item={selectedItem} own={identity === 'owner' && selectedItem.ownerId === 'owner'} canRequest={identity === 'friend' && selectedItem.ownerId === 'owner'} styleItem={identity === 'owner' ? (item) => { navigate('style'); setStylingAnchorId(item.id) } : undefined} editItem={(item) => { clearItemStorageFailure(); setSelectedItem(null); setEditingItem(item) }} close={() => { clearItemStorageFailure(); setSelectedItem(null) }} updateVisibility={updateVisibility} requestItem={(item) => { setSelectedItem(null); setRequestingItem(item) }} deleteItem={deleteItem} writeConflict={itemStorageFailure?.kind === 'edit-conflict' ? itemStorageFailure.message : undefined} />}
    {showAdd && <AddItemModal close={() => setShowAdd(false)} save={async (item) => { const saved = await setItems((current) => [...current, { ...item, id: current.reduce((max, entry) => Math.max(max, entry.id + 1), item.id) }]); if (saved) { setShowAdd(false); if (page === 'closet') showPersonalPhotos(); notify('Saved to your closet') } return saved }} />}
    {showBulkAdd && identity === 'owner' && <BulkAddModal existingPhotos={existingPhotos} close={() => setShowBulkAdd(false)} save={async (drafts) => {
      const saved = await setItems((current) => {
        const next = current.reduce((max, item) => Math.max(max, item.id + 1), Date.now())
        return [...current, ...drafts.map((draft, index) => ({ ...draft, id: next + index }))]
      })
      if (saved) { setShowBulkAdd(false); showPersonalPhotos(); notify(`Saved ${drafts.length} private ${drafts.length === 1 ? 'piece' : 'pieces'}`) }
      return saved
    }} />}
    {showBackup && identity === 'owner' && <WardrobeBackupModal items={items} looks={savedLooks} close={() => setShowBackup(false)} restore={async (archive) => {
      let plan = planWardrobeRestore(items, archive.items)
      const saved = await setItems((current) => {
        plan = planWardrobeRestore(current, archive.items)
        return plan.items.length === current.length ? current : plan.items
      })
      if (!saved) return 'not-saved'
      const outfitPlan = mergeLookBackup(savedLooks, archive.looks, plan.ids, plan.items)
      const looksChanged = outfitPlan.added + outfitPlan.historyEdits > 0
      if (looksChanged && !setSavedLooks((latest) => mergeLookBackup(latest, archive.looks, plan.ids, plan.items).looks)) return 'photos-only'
      if (outfitPlan.skipped) return 'some-skipped'
      setShowBackup(false)
      showPersonalPhotos()
      notify(looksChanged ? 'Wardrobe and looks restored' : 'Wardrobe restored')
      return 'complete'
    }} />}
    {editingItem && identity === 'owner' && <AddItemModal item={editingItem} writeConflict={itemStorageFailure?.kind === 'edit-conflict' ? itemStorageFailure.message : undefined} close={() => { clearItemStorageFailure(); setEditingItem(null) }} save={async (updated) => {
      const saved = await setItems((current) => {
        requireCurrentPiece(current, editingItem)
        return current.map((item) => item.id === updated.id ? updated : item)
      })
      if (saved) { setEditingItem(null); notify('Closet item updated') }
      return saved
    }} />}
    {requestingItem && <BorrowRequestModal item={requestingItem} requester={identity} close={() => setRequestingItem(null)} save={saveRequest} />}
    {toast && <div className="toast" role="status"><Check size={17} /> {toast}</div>}
  </div>
}

function FriendCloset({ items, borrowableOnly, setBorrowableOnly, onItem, copyInviteLink, shareInviteLink }: { items: ClosetItem[]; borrowableOnly: boolean; setBorrowableOnly: (value: boolean) => void; onItem: (item: ClosetItem) => void; copyInviteLink: () => Promise<void>; shareInviteLink: () => Promise<void> }) {
  return <section className="page-container"><PageHeading eyebrow="Shared with Alex" title="Brian's closet" subtitle="Only pieces Brian chose to share appear here. Borrowable pieces can be requested." /><div className="share-code"><div><span>Demo invite</span><strong>MFC-BRIAN</strong><small>Opens friend mode, not a live shared wardrobe. It never sends your photos.</small></div><div className="share-actions"><button className="secondary-button" onClick={() => void copyInviteLink()}><Copy size={16} /> Copy invite link</button><button className="secondary-button" onClick={() => void shareInviteLink()}><Share2 size={16} /> Share</button></div></div><div className="section-heading inline"><div><p className="eyebrow">Friend view</p><h2>{items.length ? 'Available from Brian' : 'Nothing shared yet'}</h2></div><BorrowableToggle value={borrowableOnly} setValue={setBorrowableOnly} /></div>{items.length ? <div className="item-grid">{items.map((item) => <ItemCard key={item.id} item={item} onClick={() => onItem(item)} />)}</div> : <div className="empty-state"><Shirt /><h3>Brian's shared rack is empty</h3><p>Switch to Brian, add an item, and mark it Friends or Borrowable.</p></div>}</section>
}

function OnboardingCard({ identity, switchIdentity, dismiss, startPhotoBatch }: { identity: Identity; switchIdentity: (identity: Identity) => void; dismiss: () => void; startPhotoBatch: () => void }) {
  const isOwner = identity === 'owner'
  return <section className="onboarding-card" aria-label="Beta onboarding">
    <div>
      <p className="eyebrow">{isOwner ? 'Quick start' : 'Borrowing demo'}</p>
      <h2>{isOwner ? 'Start with six pieces' : 'Test the owner-to-friend loop'}</h2>
      <p>{isOwner
        ? 'Pick two tops, two bottoms, a pair of shoes, and a layer. Save their photos, then build a look for one real occasion.'
        : 'In this browser only, open a borrowable item, send a request, then go back to owner mode to approve it.'}</p>
    </div>
    <div className="onboarding-actions">
      <button className="primary-button" onClick={isOwner ? startPhotoBatch : () => switchIdentity('owner')}>
        {isOwner ? 'Set up my closet' : 'Back to Brian mode'}
      </button>
      {isOwner && <button className="secondary-button" onClick={() => switchIdentity('friend')}>Preview Alex mode</button>}
      <button className="secondary-button" onClick={dismiss}>
        <X size={16} /> Dismiss guide
      </button>
    </div>
  </section>
}

function BorrowableToggle({ value, setValue }: { value: boolean; setValue: (value: boolean) => void }) { return <label className="toggle-label">Borrowable only <button aria-pressed={value} aria-label="Borrowable only" className={value ? 'switch on' : 'switch'} onClick={() => setValue(!value)}><span /></button></label> }
function NavButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) { return <button className={active ? 'nav-link active' : 'nav-link'} onClick={onClick}>{label}{count ? <span>{count}</span> : null}</button> }
function MobileNav({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) { return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span></button> }

export default App
