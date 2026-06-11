export type Page = 'home' | 'closet' | 'friends' | 'requests' | 'style' | 'event'

export type Visibility = 'Private' | 'Friends' | 'Borrowable'

export type Identity = 'owner' | 'friend'

export type UserProfile = {
  id: Identity
  name: string
  initials: string
}

export type ClosetItem = {
  id: number
  ownerId: Identity | string
  name: string
  owner: string
  category: string
  size: string
  brand: string
  visibility: Visibility
  color: string
  glyph: string
  imageData?: string
  occasionTags: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type BorrowRequest = {
  id: number
  itemId: number
  ownerId: Identity | string
  requesterId: Identity | string
  requesterName: string
  item: string
  person: string
  dates: string
  direction: 'incoming' | 'outgoing'
  status: 'Pending' | 'Approved' | 'Declined'
  glyph: string
  startDate?: string
  endDate?: string
  note?: string
  createdAt: string
  updatedAt: string
}

export type Friend = {
  name: string
  initials: string
  count: number
  color: string
}
