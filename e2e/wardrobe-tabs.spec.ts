import { expect, test } from '@playwright/test'

test('two tabs in one browser share photos, saved looks and wear history without reloading', async ({ page, context }) => {
  const peer = await context.newPage()
  await page.goto('/')
  await peer.goto('/')
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 30; canvas.height = 30
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#bd8d70'; ctx.fillRect(0, 0, 30, 30)
    return canvas.toDataURL('image/png').split(',')[1]
  })

  for (const tab of [page, peer]) {
    await tab.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
    await expect(tab.getByRole('heading', { name: 'Your closet is empty' })).toBeVisible()
  }

  async function add(tab: typeof page, name: string, category = 'Tops') {
    await tab.getByRole('button', { name: 'Add from camera' }).click()
    await tab.getByLabel('Choose from photo library').setInputFiles({
      name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64'),
    })
    await expect(tab.getByAltText('New item preview')).toBeVisible()
    await tab.getByLabel('Item name').fill(name)
    await tab.getByLabel('Category').selectOption(category)
    await tab.getByRole('button', { name: 'Save to my closet' }).click()
    await expect(tab.getByRole('heading', { name })).toBeVisible()
  }

  await add(page, 'Piece created in first tab')
  await expect(peer.getByRole('heading', { name: 'Piece created in first tab' })).toBeVisible()
  await add(peer, 'Piece created in second tab', 'Bottoms')
  for (const tab of [page, peer]) {
    await expect(tab.getByRole('heading', { name: 'Piece created in first tab' })).toBeVisible()
    await expect(tab.getByRole('heading', { name: 'Piece created in second tab' })).toBeVisible()
  }
  await add(page, 'Another top from first tab')
  for (const tab of [page, peer]) {
    await expect(tab.getByRole('heading', { name: 'Another top from first tab' })).toBeVisible()
    await tab.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Style' }).click()
    await tab.getByRole('button', { name: 'Build my looks' }).click()
    await expect(tab.getByRole('button', { name: 'Save this look' })).toHaveCount(2)
  }
  await page.getByRole('button', { name: 'Save this look' }).first().click()
  await expect(peer.getByRole('button', { name: 'Saved looks (1)' })).toBeVisible()
  await peer.getByRole('button', { name: 'Save this look' }).click()
  await expect(page.getByRole('button', { name: 'Saved looks (2)' })).toBeVisible()
  await page.getByRole('button', { name: 'Saved looks (2)' }).click()
  await peer.getByRole('button', { name: 'Saved looks (2)' }).click()
  await peer.getByRole('button', { name: 'Mark worn today' }).first().click()
  await expect(page.getByText('Last worn today · 1 day logged')).toBeVisible()
  for (const tab of [page, peer]) {
    await tab.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
    await tab.getByRole('button', { name: /Piece created in first tab/i }).click()
    await tab.getByRole('button', { name: 'Edit item' }).click()
  }
  const form = (tab: typeof page) => tab.getByRole('dialog', { name: 'Edit clothing item' })
  await form(page).getByLabel('Item name').fill('Newest label')
  await form(page).getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('heading', { name: 'Newest label' })).toBeVisible()
  await form(peer).getByLabel('Item name').fill('Stale label that must not overwrite')
  await form(peer).getByRole('button', { name: 'Save changes' }).click()
  await expect(form(peer).getByRole('alert')).toHaveText('This piece changed in another tab. Reopen it before saving your changes.')
  await form(peer).getByRole('button', { name: 'Close edit item' }).click()
  await expect(peer.getByRole('heading', { name: 'Newest label' })).toBeVisible()
  await expect(peer.getByRole('heading', { name: 'Stale label that must not overwrite' })).toHaveCount(0)
  await peer.close()
})
