import { expect, test } from '@playwright/test'

test('two tabs in one browser see each wardrobe save without reloading or losing another tab’s piece', async ({ page, context }) => {
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

  async function add(tab: typeof page, name: string) {
    await tab.getByRole('button', { name: 'Add from camera' }).click()
    await tab.getByLabel('Choose from photo library').setInputFiles({
      name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64'),
    })
    await expect(tab.getByAltText('New item preview')).toBeVisible()
    await tab.getByLabel('Item name').fill(name)
    await tab.getByRole('button', { name: 'Save to my closet' }).click()
    await expect(tab.getByRole('heading', { name })).toBeVisible()
  }

  await add(page, 'Piece created in first tab')
  await expect(peer.getByRole('heading', { name: 'Piece created in first tab' })).toBeVisible()
  await add(peer, 'Piece created in second tab')
  for (const tab of [page, peer]) {
    await expect(tab.getByRole('heading', { name: 'Piece created in first tab' })).toBeVisible()
    await expect(tab.getByRole('heading', { name: 'Piece created in second tab' })).toBeVisible()
  }
  await peer.close()
})
