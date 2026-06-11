import { expect, test } from '@playwright/test'

test('owner upload to persisted friend request and approval', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('button', { name: 'Add from camera' }).click()
  const phonePhoto = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2400
    canvas.height = 1800
    const context = canvas.getContext('2d')!
    const gradient = context.createLinearGradient(0, 0, 2400, 1800)
    gradient.addColorStop(0, '#e7c7b8')
    gradient.addColorStop(1, '#7f3f53')
    context.fillStyle = gradient
    context.fillRect(0, 0, 2400, 1800)
    context.fillStyle = '#fffaf0'
    context.fillRect(850, 300, 700, 1200)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.locator('input[type="file"]').setInputFiles({ name: 'phone-photo.png', mimeType: 'image/png', buffer: Buffer.from(phonePhoto, 'base64') })
  await expect(page.getByText(/Photo optimized for your closet/)).toBeVisible()
  await page.getByLabel('Item name').fill('E2E rooftop dress')
  await page.getByLabel('Size').fill('M')
  await page.getByLabel('Color').fill('Berry')
  await page.getByLabel('Notes').fill('Created by the mobile beta smoke test')
  await page.getByRole('button', { name: 'Save to my closet' }).click()

  await expect(page.getByRole('heading', { name: 'E2E rooftop dress' })).toBeVisible()
  expect(await page.evaluate(() => {
    const item = JSON.parse(localStorage.getItem('mfc-beta-items-v1') ?? '[]').find((entry: { name: string }) => entry.name === 'E2E rooftop dress')
    return item?.imageMeta?.width === 1600 && item?.imageMeta?.height === 1200 && item?.imageData?.startsWith('data:image/jpeg')
  })).toBe(true)
  await page.reload()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
  await expect(page.getByRole('heading', { name: 'E2E rooftop dress' })).toBeVisible()

  await page.getByRole('button', { name: /E2E rooftop dress/ }).click()
  await page.getByRole('button', { name: 'Borrowable' }).click()
  await page.getByRole('button', { name: 'Close item details' }).click()

  await page.getByRole('button', { name: 'Alex' }).click()
  await expect(page.getByText('Friend mode')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'E2E rooftop dress' })).toBeVisible()
  await page.getByRole('button', { name: /E2E rooftop dress/ }).click()
  await page.getByRole('button', { name: 'Request to borrow' }).click()
  await page.getByLabel('Start date').fill('2026-07-10')
  await page.getByLabel('End date').fill('2026-07-12')
  await page.getByLabel('Note').fill('For the E2E rooftop party')
  await page.getByRole('button', { name: 'Send borrow request' }).click()

  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Requests' }).click()
  await expect(page.getByText('For the E2E rooftop party')).toBeVisible()
  await page.getByRole('button', { name: 'Brian' }).click()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Requests' }).click()
  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('Approved', { exact: true })).toBeVisible()

  await page.reload()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Requests' }).click()
  await expect(page.getByText('Approved', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'E2E rooftop dress' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
