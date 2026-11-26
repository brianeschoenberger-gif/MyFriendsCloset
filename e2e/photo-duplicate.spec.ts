import { expect, test } from '@playwright/test'

test('exact duplicate photo hints preserve the choice to save or remove each copy', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add your first photos' }).click()
  const pixels = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 120; c.height = 80
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#6b9b7c'; ctx.fillRect(0, 0, c.width, c.height)
    return c.toDataURL('image/png').split(',')[1]
  })
  const dialog = page.getByRole('dialog', { name: 'Add photos in bulk' })
  const photo = (name: string) => ({ name, mimeType: 'image/png', buffer: Buffer.from(pixels, 'base64') })
  await dialog.getByLabel('Choose multiple clothing photos').setInputFiles([photo('a.png'), photo('b.png')])
  await expect(dialog.getByText('Same image as photo 1')).toBeVisible()
  await dialog.getByRole('button', { name: 'Remove photo 2' }).click()
  await expect(dialog.getByText('Same image as photo 1')).toHaveCount(0)
  await dialog.getByLabel('Category for photo 1').selectOption('Tops')
  await dialog.getByRole('button', { name: 'Save 1 private piece' }).click()
  await expect(page.getByRole('heading', { name: 'Top', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Add multiple photos' }).click()
  await dialog.getByLabel('Choose multiple clothing photos').setInputFiles(photo('renamed.png'))
  await expect(dialog.getByText('Already in your closet')).toBeVisible()
  await dialog.getByLabel('Category for photo 1').selectOption('Bottoms')
  await dialog.getByRole('button', { name: 'Save 1 private piece' }).click()
  await expect(page.getByRole('heading', { name: 'Top', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bottoms', exact: true })).toBeVisible()
})
