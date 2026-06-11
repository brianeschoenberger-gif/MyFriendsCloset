import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

function primaryNav() {
  return within(screen.getByRole('navigation', { name: 'Primary navigation' }))
}

describe('My Friends Closet prototype', () => {
  it('adds an item to the closet with the selected visibility', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(primaryNav().getByRole('button', { name: 'My closet' }))
    await user.click(screen.getByRole('button', { name: 'Add an item' }))
    await user.type(screen.getByPlaceholderText('e.g. The perfect black dress'), 'Sunset midi dress')
    await user.click(screen.getByRole('button', { name: 'Borrowable' }))
    await user.click(screen.getByRole('button', { name: 'Add to my closet' }))

    expect(screen.getByRole('heading', { name: 'Sunset midi dress' })).toBeInTheDocument()
    expect(screen.getByText('Added to your closet')).toBeInTheDocument()
    expect(screen.getByText('7 pieces, 4 ready to share.')).toBeInTheDocument()
  })

  it('updates an existing item visibility from its detail view', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(primaryNav().getByRole('button', { name: 'My closet' }))
    await user.click(screen.getByRole('button', { name: /Sunday sunglasses/ }))
    await user.click(screen.getByRole('button', { name: 'Borrowable' }))
    await user.click(screen.getByRole('button', { name: 'Close item details' }))

    expect(screen.getByRole('button', { name: /Available to borrow Sunday sunglasses/ })).toBeInTheDocument()
    expect(screen.getByText('6 pieces, 4 ready to share.')).toBeInTheDocument()
  })

  it('creates a borrow request and shows it in outgoing requests', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(primaryNav().getByRole('button', { name: 'Friends' }))
    await user.click(screen.getByRole('button', { name: /Woven mini bag/ }))
    await user.click(screen.getByRole('button', { name: 'Want to borrow this?' }))
    await user.click(primaryNav().getByRole('button', { name: /Requests/ }))

    const outgoing = screen.getByRole('heading', { name: 'Outgoing' }).parentElement?.parentElement
    expect(outgoing).not.toBeNull()
    expect(within(outgoing as HTMLElement).getByRole('heading', { name: 'Woven mini bag' })).toBeInTheDocument()
    expect(within(outgoing as HTMLElement).getByText('Pending')).toBeInTheDocument()
  })

  it('approves an incoming request and generates three styled looks', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(primaryNav().getByRole('button', { name: /Requests/ }))
    const linenRequest = screen.getByRole('heading', { name: 'Ivory linen set' }).closest('article')
    expect(linenRequest).not.toBeNull()
    await user.click(within(linenRequest as HTMLElement).getByRole('button', { name: 'Approve' }))
    expect(within(linenRequest as HTMLElement).getByText('Approved')).toBeInTheDocument()

    await user.click(primaryNav().getByRole('button', { name: 'Home' }))
    await user.click(screen.getByRole('button', { name: 'Style me for Saturday' }))
    await user.click(screen.getByRole('button', { name: 'Build my looks' }))

    expect(screen.getByRole('heading', { name: 'Your looks are ready' })).toBeInTheDocument()
    expect(screen.getAllByText(/LOOK 0/)).toHaveLength(3)
  })
})
