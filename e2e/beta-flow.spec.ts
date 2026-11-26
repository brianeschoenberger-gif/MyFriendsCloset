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
  await page.locator('input[name="photo"]').setInputFiles({ name: 'phone-photo.png', mimeType: 'image/png', buffer: Buffer.from(phonePhoto, 'base64') })
  await expect(page.getByText(/Photo optimized for your closet/)).toBeVisible()
  await page.getByLabel('Item name').fill('E2E rooftop dress')
  await page.getByLabel('Category').selectOption('Dresses')
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

  await page.getByRole('button', { name: 'Alex', exact: true }).click()
  await expect(page.getByText('Friend mode', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'E2E rooftop dress' })).toBeVisible()
  await page.getByRole('button', { name: /E2E rooftop dress/ }).click()
  await page.getByRole('button', { name: 'Request to borrow' }).click()
  await page.getByLabel('Start date').fill('2026-07-10')
  await page.getByLabel('End date').fill('2026-07-12')
  await page.getByLabel('Note').fill('For the E2E rooftop party')
  await page.getByRole('button', { name: 'Send borrow request' }).click()

  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Requests' }).click()
  await expect(page.getByText('For the E2E rooftop party')).toBeVisible()
  await page.getByRole('button', { name: 'Brian', exact: true }).click()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Requests' }).click()
  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('Approved', { exact: true })).toBeVisible()

  await page.reload()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Requests' }).click()
  await expect(page.getByText('Approved', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'E2E rooftop dress' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('save clothing photos, match an outfit, and reopen the saved look at phone width', async ({ page, browser }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 120
    const context = canvas.getContext('2d')!
    context.fillStyle = '#72534c'
    context.fillRect(0, 0, 160, 120)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await nav.getByRole('button', { name: 'Closet' }).click()
  for (const [name, category, color] of [['Test linen top', 'Tops', 'Ivory'], ['Test weekend jeans', 'Bottoms', 'Navy'], ['Test walking shoes', 'Shoes', 'Tan']]) {
    await page.getByRole('button', { name: 'Add from camera' }).click()
    await page.getByLabel('Choose from photo library').setInputFiles({ name: 'piece.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
    await expect(page.getByAltText('New item preview')).toBeVisible()
    await page.getByLabel('Item name').fill(name)
    await page.getByLabel('Category').selectOption(category)
    await page.getByLabel('Color').fill(color)
    await page.getByLabel('Occasion tags').fill('weekend')
    await page.getByRole('button', { name: 'Save to my closet' }).click()
  }
  await nav.getByRole('button', { name: 'Style' }).click()
  await expect(page.getByText('3 photographed pieces')).toBeVisible()
  await page.getByLabel('Occasion').fill('Weekend trip')
  await page.getByRole('button', { name: 'Build my looks' }).click()
  await expect(page.getByRole('heading', { name: 'Your looks are ready' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'View Test linen top' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'View Test weekend jeans' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'View Test walking shoes' })).toBeVisible()
  await expect(page.getByText('3 of your photos')).toBeVisible()
  await page.getByRole('button', { name: 'Save this look' }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.reload()
  await nav.getByRole('button', { name: 'Style' }).click()
  await page.getByRole('button', { name: 'Saved looks (1)' }).click()
  await expect(page.getByRole('heading', { name: 'Test linen top + Test weekend jeans' })).toBeVisible()
  await page.getByRole('button', { name: 'Alex', exact: true }).click()
  await expect(nav.getByRole('button', { name: 'Style' })).toHaveCount(0)
  await expect(page.getByText('Test linen top')).toHaveCount(0)

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 850 }, baseURL: test.info().project.use.baseURL })
  await desktop.goto('/')
  await desktop.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Style' }).click()
  await desktop.getByRole('button', { name: 'Build my looks' }).click()
  await expect(desktop.getByRole('heading', { name: 'Your closet needs a base outfit' })).toBeVisible()
  await desktop.getByRole('checkbox', { name: 'Include labeled sample pieces' }).check()
  await desktop.getByRole('button', { name: 'Build my looks' }).click()
  await expect(desktop.getByRole('heading', { name: 'Your looks are ready' })).toBeVisible()
  await expect(desktop.getByRole('button', { name: 'Save this look' })).toHaveCount(3)
  await desktop.close()
})

test('batch adds mobile photos, keeps them private, and feeds the outfit builder', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
  await nav.getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('button', { name: 'Add multiple photos' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add photos in bulk' })
  const fixtures = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 900
    const ctx = canvas.getContext('2d')!
    return ['#f2d4c9', '#324968'].map((color) => {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png').split(',')[1]
    })
  })
  await dialog.getByLabel('Choose multiple clothing photos').setInputFiles(fixtures.map((data, i) => ({
    name: `sample-${i}.png`, mimeType: 'image/png', buffer: Buffer.from(data, 'base64'),
  })))
  await expect(dialog.getByAltText('Clothing photo 2')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Save 2 private pieces' })).toBeDisabled()
  await dialog.getByLabel('Category for photo 1').selectOption('Tops')
  await dialog.getByLabel('Name for photo 1').fill('Batch tee')
  await dialog.getByLabel('Category for photo 2').selectOption('Bottoms')
  await dialog.getByLabel('Name for photo 2').fill('Batch jeans')
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await dialog.getByRole('button', { name: 'Save 2 private pieces' }).click()
  await expect(page.getByRole('heading', { name: 'Batch tee' })).toBeVisible()
  await page.reload()
  await nav.getByRole('button', { name: 'Style' }).click()
  await page.getByRole('button', { name: 'Build my looks' }).click()
  await expect(page.getByRole('heading', { name: 'Batch tee + Batch jeans' })).toBeVisible()
  await page.getByRole('button', { name: 'Alex', exact: true }).click()
  await expect(page.getByText('Batch tee')).toHaveCount(0)
  await expect(page.getByText('Batch jeans')).toHaveCount(0)
})
