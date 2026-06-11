export type Page = 'home' | 'closet' | 'friends' | 'requests' | 'style' | 'event'

export type Visibility = 'Private' | 'Friends' | 'Borrowable'

export type ClosetItem = {
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

export type BorrowRequest = {
  id: number
  item: string
  person: string
  dates: string
  direction: 'incoming' | 'outgoing'
  status: 'Pending' | 'Approved' | 'Declined'
  glyph: string
}

export type Friend = {
  name: string
  initials: string
  count: number
  color: string
}
