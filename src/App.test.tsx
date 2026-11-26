import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { StylePage } from './components/StylePage'

function primaryNav() {
  return within(screen.getByRole('navigation', { name: 'Primary navigation' }))
}

async function addPhotoItem(name = 'Sunset midi dress', category = 'Dresses', share = true) {
  const user = userEvent.setup()
  await user.click(primaryNav().getByRole('button', { name: 'My closet' }))
  await user.click(screen.getByRole('button', { name: 'Add from camera' }))
  const photo = new File(['photo'], 'dress.png', { type: 'image/png' })
  await user.upload(screen.getByLabelText(/Take or choose a photo/), photo)
  await user.type(screen.getByPlaceholderText('e.g. The perfect black dress'), name)
  await user.selectOptions(screen.getByLabelText('Category'), category)
  await user.clear(screen.getByLabelText('Size'))
  await user.type(screen.getByLabelText('Size'), 'M')
  await user.type(screen.getByLabelText('Color'), 'Coral')
  if (share) await user.click(screen.getByRole('button', { name: 'Borrowable' }))
  await user.click(screen.getByRole('button', { name: 'Save to my closet' }))
  return user
}

describe('My Friends Closet playable beta', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })
  afterEach(() => vi.restoreAllMocks())

  it('uploads a photo item and restores it from persistent storage', async () => {
    const first = render(<App />)
    await addPhotoItem()

    expect(screen.getByRole('heading', { name: 'Sunset midi dress' })).toBeInTheDocument()
    expect(screen.getByText('Saved to your closet')).toBeInTheDocument()
    expect(window.localStorage.getItem('mfc-beta-items-v1')).toContain('Sunset midi dress')
    expect(window.localStorage.getItem('mfc-beta-items-v1')).toContain('imageMeta')

    first.unmount()
    render(<App />)
    await userEvent.setup().click(primaryNav().getByRole('button', { name: 'My closet' }))
    expect(screen.getByRole('heading', { name: 'Sunset midi dress' })).toBeInTheDocument()
  })

  it('keeps private items out of friend view and shows shared items', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Alex' }))
    expect(screen.queryByRole('heading', { name: 'Sunday sunglasses' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ivory linen set' })).toBeInTheDocument()
    expect(screen.getByText('Friend mode')).toBeInTheDocument()
  })

  it('shows a first-run onboarding guide and remembers when it is dismissed', async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    expect(screen.getByRole('heading', { name: 'Test the full owner-to-friend loop' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dismiss guide' }))
    expect(screen.queryByRole('heading', { name: 'Test the full owner-to-friend loop' })).not.toBeInTheDocument()
    expect(window.localStorage.getItem('mfc-beta-onboarding-dismissed-v1')).toBe('true')

    first.unmount()
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'Test the full owner-to-friend loop' })).not.toBeInTheDocument()
  })

  it('copies an invite link for friend mode and honors the invite URL on load', async () => {
    const user = userEvent.setup()
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: clipboard })

    const first = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Preview Alex mode' }))
    await user.click(screen.getByRole('button', { name: 'Copy invite link' }))

    expect(clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/?invite=MFC-BRIAN&mode=friend`)
    expect(screen.getByText('Invite link copied')).toBeInTheDocument()

    first.unmount()
    window.localStorage.clear()
    window.history.replaceState({}, '', '/?invite=MFC-BRIAN&mode=friend')
    render(<App />)
    expect(screen.getByText('Friend mode')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Brian's closet" })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Test the full owner-to-friend loop' })).not.toBeInTheDocument()
  })

  it('persists the full friend request and owner approval flow', async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    await user.click(screen.getByRole('button', { name: 'Alex' }))
    await user.click(screen.getByRole('button', { name: /Ivory linen set/ }))
    await user.click(screen.getByRole('button', { name: 'Request to borrow' }))
    await user.type(screen.getByLabelText('Start date'), '2026-06-27')
    await user.type(screen.getByLabelText('End date'), '2026-06-29')
    await user.type(screen.getByLabelText('Note'), 'For the rooftop birthday dinner')
    await user.click(screen.getByRole('button', { name: 'Send borrow request' }))
    await user.click(primaryNav().getByRole('button', { name: /Requests/ }))
    expect(screen.getByText(/For the rooftop birthday dinner/)).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Brian' }))
    await user.click(primaryNav().getByRole('button', { name: /Requests/ }))
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(screen.getByText('Approved')).toBeInTheDocument()

    first.unmount()
    render(<App />)
    await userEvent.setup().click(primaryNav().getByRole('button', { name: /Requests/ }))
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('uses saved closet items when generating styled looks', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Style me for Saturday' }))
    await user.click(screen.getByRole('button', { name: 'Romantic' }))
    await user.click(screen.getByRole('checkbox', { name: 'Include labeled sample pieces' }))
    await user.click(screen.getByRole('button', { name: 'Build my looks' }))
    expect(screen.getByRole('heading', { name: 'Your looks are ready' })).toBeInTheDocument()
    expect(screen.getByText(/Romantic ideas for Everyday/)).toBeInTheDocument()
    expect(screen.getAllByText(/LOOK 0/)).toHaveLength(3)
  })

  it('does not invent outfits when the saved closet is too small', async () => {
    const user = userEvent.setup()
    render(<StylePage onAdd={vi.fn()} onItem={vi.fn()} items={[]} />)
    await user.click(screen.getByRole('button', { name: 'Build my looks' }))
    expect(screen.getByRole('heading', { name: 'Your closet needs a base outfit' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your looks are ready' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'A little bold' }))
    expect(screen.getByRole('button', { name: 'A little bold' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('builds and saves an outfit from exactly the owner photos and keeps Style out of Alex mode', async () => {
    const first = render(<App />)
    await addPhotoItem('Ivory tee', 'Tops', false)
    const user = await addPhotoItem('Weekend jeans', 'Bottoms', false)
    await user.click(primaryNav().getByRole('button', { name: 'Style' }))
    await user.click(screen.getByRole('button', { name: 'Build my looks' }))
    expect(screen.getByRole('heading', { name: 'Ivory tee + Weekend jeans' })).toBeInTheDocument()
    expect(screen.getByText('2 of your photos')).toBeInTheDocument()
    expect(screen.queryByText(/sample piece[s]? including/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save this look' }))
    expect(screen.getByRole('button', { name: 'Saved looks (1)' })).toBeInTheDocument()
    expect(window.localStorage.getItem('mfc-beta-saved-looks-v1')).toContain('Ivory tee')

    first.unmount()
    render(<App />)
    await user.click(primaryNav().getByRole('button', { name: 'Style' }))
    await user.click(screen.getByRole('button', { name: 'Saved looks (1)' }))
    expect(screen.getByRole('heading', { name: 'Ivory tee + Weekend jeans' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Alex' }))
    expect(screen.queryByRole('button', { name: /^Style$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ivory tee + Weekend jeans' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ivory tee' })).not.toBeInTheDocument()
  })

  it('edits metadata without replacing the stored photo', async () => {
    render(<App />)
    const user = await addPhotoItem('Weekend shirt', 'Tops', false)
    const original = JSON.parse(window.localStorage.getItem('mfc-beta-items-v1') ?? '[]').find((item: { name: string }) => item.name === 'Weekend shirt')
    await user.click(screen.getByRole('button', { name: /Weekend shirt/ }))
    await user.click(screen.getByRole('button', { name: 'Edit item' }))
    await user.clear(screen.getByLabelText('Item name'))
    await user.type(screen.getByLabelText('Item name'), 'Weekend tee')
    await user.type(screen.getByLabelText('Occasion tags'), 'travel, casual')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    const updated = JSON.parse(window.localStorage.getItem('mfc-beta-items-v1') ?? '[]').find((item: { name: string }) => item.name === 'Weekend tee')
    expect(updated.id).toEqual(original.id)
    expect(updated.imageData).toEqual(original.imageData)
    expect(updated.occasionTags).toEqual(['travel', 'casual'])
  })

  it('imports two categorized photos together, keeps them private, and restores them after remount', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.click(primaryNav().getByRole('button', { name: 'My closet' }))
    await user.click(screen.getByRole('button', { name: 'Add multiple photos' }))
    const dialog = screen.getByRole('dialog', { name: 'Add photos in bulk' })
    await user.upload(within(dialog).getByLabelText('Choose multiple clothing photos'), [
      new File(['shirt'], 'shirt.png', { type: 'image/png' }),
      new File(['jeans'], 'jeans.png', { type: 'image/png' }),
    ])
    await within(dialog).findByAltText('Clothing photo 2')
    expect(within(dialog).getByRole('button', { name: 'Save 2 private pieces' })).toBeDisabled()
    await user.selectOptions(within(dialog).getByLabelText('Category for photo 1'), 'Tops')
    await user.type(within(dialog).getByLabelText('Name for photo 1'), 'Striped tee')
    await user.selectOptions(within(dialog).getByLabelText('Category for photo 2'), 'Bottoms')
    await user.type(within(dialog).getByLabelText('Color for photo 2'), 'Indigo')
    await user.click(within(dialog).getByRole('button', { name: 'Save 2 private pieces' }))
    expect(screen.getByRole('heading', { name: 'Striped tee' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Indigo Bottoms' })).toBeInTheDocument()
    const stored = JSON.parse(window.localStorage.getItem('mfc-beta-items-v1') ?? '[]').filter((item: { imageData?: string }) => item.imageData)
    expect(stored.map(({ visibility }: { visibility: string }) => visibility)).toEqual(['Private', 'Private'])
    expect(new Set(stored.map(({ id }: { id: number }) => id)).size).toBe(2)

    await user.click(screen.getByRole('button', { name: 'Alex' }))
    expect(screen.queryByRole('heading', { name: 'Striped tee' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Brian' }))
    first.unmount()
    render(<App />)
    await user.click(primaryNav().getByRole('button', { name: 'My closet' }))
    expect(screen.getByRole('heading', { name: 'Striped tee' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Indigo Bottoms' })).toBeInTheDocument()
  })

  it('previews a backup and adds the imported garment privately without replacing the existing closet', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(primaryNav().getByRole('button', { name: 'My closet' }))
    await user.click(screen.getByRole('button', { name: /^Backup$/ }))
    const dialog = screen.getByRole('dialog', { name: 'Wardrobe backup' })
    const text = JSON.stringify({ format: 'my-friends-closet/wardrobe-v1', items: [{
      id: 1, name: 'Weekend backup jacket', category: 'Jackets', size: '', color: 'Navy', brand: '', notes: '',
      visibility: 'Borrowable', occasionTags: ['Weekend'], imageData: 'data:image/png;base64,QUJD',
      createdAt: '2026-11-26T00:00:00.000Z', updatedAt: '2026-11-26T00:00:00.000Z',
    }] })
    const backup = new File([text], 'wardrobe.json', { type: 'application/json' })
    await user.upload(within(dialog).getByLabelText('Choose wardrobe backup file'), backup)
    const restore = await within(dialog).findByRole('button', { name: 'Restore 1 private piece' })
    expect(screen.queryByRole('heading', { name: 'Weekend backup jacket' })).not.toBeInTheDocument()
    await user.click(restore)
    expect(screen.getByRole('heading', { name: 'Weekend backup jacket' })).toBeInTheDocument()
    const items = JSON.parse(window.localStorage.getItem('mfc-beta-items-v1') ?? '[]')
    const imported = items.find((item: { name: string }) => item.name === 'Weekend backup jacket')
    expect(imported.visibility).toBe('Private')
    expect(items.length).toBeGreaterThan(1)

    await user.click(screen.getByRole('button', { name: /^Backup$/ }))
    await user.upload(screen.getByLabelText('Choose wardrobe backup file'), backup)
    expect(await screen.findByText(/already in your closet/)).toBeInTheDocument()
  })

  it('keeps the add form open and explains how to recover from storage quota failure', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(primaryNav().getByRole('button', { name: 'My closet' }))
    await user.click(screen.getByRole('button', { name: 'Add from camera' }))
    await user.upload(screen.getByLabelText(/Take or choose a photo/), new File(['photo'], 'dress.png', { type: 'image/png' }))
    await user.type(screen.getByLabelText('Item name'), 'Quota test dress')
    await user.type(screen.getByLabelText('Color'), 'Blue')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })

    await user.click(screen.getByRole('button', { name: 'Save to my closet' }))

    expect(screen.getByRole('heading', { name: 'Add an item' })).toBeInTheDocument()
    expect(screen.getByText(/Your closet is out of local space/)).toBeInTheDocument()
    expect(screen.getByText('Not saved')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Quota test dress' })).not.toBeInTheDocument()
  })
})
