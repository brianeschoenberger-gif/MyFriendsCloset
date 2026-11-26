import { expect, test } from '@playwright/test'

test('validates unusual camera files and displays an upright JPEG even with no MIME type', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
  await nav.getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('button', { name: 'Add from camera' }).click()
  const picker = page.getByLabel('Choose from photo library')
  await picker.setInputFiles({ name: 'Broken.HEIC', mimeType: 'application/octet-stream', buffer: Buffer.from('not an image') })
  await expect(page.getByRole('alert')).toHaveText(/couldn’t open the HEIC\/HEIF photo.*JPEG copy/i)
  const raster = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 60; c.height = 90
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#df9337'; ctx.fillRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#43274e'; ctx.fillRect(0, 0, c.width, 20)
    return c.toDataURL('image/jpeg').split(',')[1]
  })
  const jpeg = Buffer.from(raster, 'base64')
  // EXIF says rotate this portrait raster 90° right for upright display.
  const orientation = Buffer.from('ffe1002245786966000049492a0008000000010012010300010000000600000000000000', 'hex')
  const oriented = Buffer.concat([jpeg.subarray(0, 2), orientation, jpeg.subarray(2)])
  await picker.setInputFiles({ name: 'Camera.JPG', mimeType: 'application/octet-stream', buffer: oriented })
  const preview = page.getByAltText('New item preview')
  await expect(preview).toBeVisible()
  await expect.poll(() => preview.evaluate((img) => {
    const image = img as HTMLImageElement
    return [image.naturalWidth, image.naturalHeight]
  })).toEqual([90, 60])
  await page.getByLabel('Item name').fill('Upright camera piece')
  await page.getByRole('button', { name: 'Save to my closet' }).click()
  await expect(page.getByRole('heading', { name: 'Upright camera piece' })).toBeVisible()
  await page.reload()
  await nav.getByRole('button', { name: 'Closet' }).click()
  const photo = page.getByRole('button', { name: /Upright camera piece/i }).locator('img')
  await expect.poll(() => photo.evaluate((img) => {
    const image = img as HTMLImageElement
    return [image.naturalWidth, image.naturalHeight]
  })).toEqual([90, 60])
})
