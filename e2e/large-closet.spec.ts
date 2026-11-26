import { expect, test } from '@playwright/test'

test('a large closet loads in groups while search still finds pieces beyond the first group', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('large-closet-fixture')) return
    sessionStorage.setItem('large-closet-fixture', '1')
    const canvas = document.createElement('canvas')
    canvas.width = 12
    canvas.height = 12
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#715368'
    ctx.fillRect(0, 0, 12, 12)
    const photo = canvas.toDataURL('image/jpeg')
    localStorage.setItem('mfc-beta-items-v1', JSON.stringify(Array.from({ length: 30 }, (_, i) => ({
      id: 12000 + i, ownerId: 'owner', owner: 'Brian', name: `Gallery piece ${String(i + 1).padStart(2, '0')}`,
      category: 'Tops', size: '', brand: '', visibility: 'Private', color: 'Berry', glyph: 'PHOTO',
      imageData: photo, occasionTags: [], notes: '', createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    }))))
  })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
  await page.getByLabel('Sort by').selectOption('A–Z')
  await expect(page.getByText('Showing 24 of 30 pieces')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gallery piece 30' })).toHaveCount(0)

  await page.getByRole('searchbox', { name: 'Search clothes' }).fill('piece 30')
  await expect(page.getByRole('heading', { name: 'Gallery piece 30' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByText('Showing 24 of 30 pieces')).toBeVisible()

  const more = page.getByRole('button', { name: 'Show more clothes' })
  await more.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('30 pieces shown')).toBeVisible()
  const added = page.getByRole('button', { name: /Gallery piece 25/i })
  await expect(added).toBeFocused()
  await expect(added.locator('img')).toHaveAttribute('loading', 'lazy')
})
