import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

function primaryNav() {
  return within(screen.getByRole('navigation', { name: 'Primary navigation' }))
}

async function addPhotoItem(name = 'Sunset midi dress') {
  const user = userEvent.setup()
  await user.click(primaryNav().getByRole('button', { name: 'My closet' }))
  await user.click(screen.getByRole('button', { name: 'Add from camera' }))
  const photo = new File(['photo'], 'dress.png', { type: 'image/png' })
  await user.upload(screen.getByLabelText(/Take or choose a photo/), photo)
  await user.type(screen.getByPlaceholderText('e.g. The perfect black dress'), name)
  await user.clear(screen.getByLabelText('Size'))
  await user.type(screen.getByLabelText('Size'), 'M')
  await user.type(screen.getByLabelText('Color'), 'Coral')
  await user.click(screen.getByRole('button', { name: 'Borrowable' }))
  await user.click(screen.getByRole('button', { name: 'Save to my closet' }))
  return user
}

describe('My Friends Closet playable beta', () => {
  beforeEach(() => window.localStorage.clear())

  it('uploads a photo item and restores it from persistent storage', async () => {
    const first = render(<App />)
    await addPhotoItem()

    expect(screen.getByRole('heading', { name: 'Sunset midi dress' })).toBeInTheDocument()
    expect(screen.getByText('Saved to your closet')).toBeInTheDocument()
    expect(window.localStorage.getItem('mfc-beta-items-v1')).toContain('Sunset midi dress')

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
    await user.click(screen.getByRole('button', { name: 'Build my looks' }))
    expect(screen.getByRole('heading', { name: 'Your looks are ready' })).toBeInTheDocument()
    expect(screen.getAllByText(/LOOK 0/)).toHaveLength(3)
  })
})
