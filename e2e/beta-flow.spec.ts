import { expect, test } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

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
  expect(await page.evaluate(() => new Promise<boolean>((resolve, reject) => {
    const open = indexedDB.open('mfc-wardrobe-v2')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const read = db.transaction('wardrobe').objectStore('wardrobe').get('items')
      read.onerror = () => { db.close(); reject(read.error) }
      read.onsuccess = () => {
        const item = read.result.find((entry: { name: string }) => entry.name === 'E2E rooftop dress')
        db.close()
        resolve(item?.imageMeta?.width === 1600 && item?.imageMeta?.height === 1200 && item?.imageData?.startsWith('data:image/jpeg'))
      }
    }
  }))).toBe(true)
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
  await page.getByLabel('End date').fill('2026-07-09')
  await page.getByLabel('Note').fill('For the E2E rooftop party')
  await page.getByRole('button', { name: 'Send borrow request' }).click()
  await expect(page.getByText('The return date must be on or after pickup.')).toBeVisible()
  await page.getByLabel('End date').fill('2026-07-12')
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
  await page.getByRole('button', { name: 'Mark returned' }).click()
  await expect(page.getByText('Returned', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Alex', exact: true }).click()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Requests' }).click()
  await expect(page.getByText('Returned', { exact: true })).toBeVisible()
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
  await dialog.getByRole('button', { name: 'Use Navy for photo 2' }).click()
  await expect(dialog.getByLabel('Color for photo 2')).toHaveValue('Navy')
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await dialog.getByRole('button', { name: 'Save 2 private pieces' }).click()
  await expect(page.getByRole('heading', { name: 'Batch tee' })).toBeVisible()
  await page.reload()
  await nav.getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('searchbox', { name: 'Search clothes' }).fill('navy jeans')
  await expect(page.getByRole('heading', { name: 'Batch jeans' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Batch tee' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByRole('button', { name: /Batch tee/ }).click()
  await page.getByRole('button', { name: 'Style this piece' }).click()
  await expect(page.getByText('Every outfit will include this piece.')).toBeVisible()
  await page.getByRole('button', { name: 'Build my looks' }).click()
  await expect(page.getByRole('heading', { name: 'Batch tee + Batch jeans' })).toBeVisible()
  await page.getByRole('button', { name: 'Alex', exact: true }).click()
  await expect(page.getByText('Batch tee')).toHaveCount(0)
  await expect(page.getByText('Batch jeans')).toHaveCount(0)
})

test('downloads a private wardrobe and restores it to a fresh browser without sharing it', async ({ page, browser }, testInfo) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
  await nav.getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('button', { name: 'Add from camera' }).click()
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 80; canvas.height = 60
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#8b5c67'; ctx.fillRect(0, 0, 80, 60)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.getByLabel('Choose from photo library').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') })
  await expect(page.getByAltText('New item preview')).toBeVisible()
  await page.getByLabel('Item name').fill('Backup test jacket')
  await page.getByLabel('Category').selectOption('Jackets')
  await page.getByRole('button', { name: 'Borrowable' }).click()
  await page.getByRole('button', { name: 'Save to my closet' }).click()
  await page.getByRole('button', { name: 'Backup', exact: true }).click()
  const pendingDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download wardrobe' }).click()
  const downloaded = await pendingDownload
  const file = testInfo.outputPath('wardrobe.json')
  await downloaded.saveAs(file)

  const fresh = await browser.newPage({ viewport: { width: 390, height: 844 }, baseURL: testInfo.project.use.baseURL })
  try {
    await fresh.goto('/')
    await fresh.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
    await fresh.getByRole('button', { name: 'Backup', exact: true }).click()
    await fresh.getByLabel('Choose wardrobe backup file').setInputFiles(file)
    await fresh.getByRole('button', { name: 'Restore 1 private piece' }).click()
    await expect(fresh.getByRole('heading', { name: 'Backup test jacket' })).toBeVisible()
    await fresh.getByRole('button', { name: 'Backup', exact: true }).click()
    await fresh.getByLabel('Choose wardrobe backup file').setInputFiles(file)
    await expect(fresh.getByText(/already in your closet/)).toBeVisible()
    await fresh.getByRole('button', { name: 'Close wardrobe backup' }).click()
    await fresh.getByRole('button', { name: 'Alex', exact: true }).click()
    await expect(fresh.getByText('Backup test jacket')).toHaveCount(0)
  } finally { await fresh.close() }
})

test('migrates an existing wardrobe before dropping its old browser copy', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded-v1')) return
    sessionStorage.setItem('seeded-v1', 'true')
    localStorage.setItem('mfc-beta-items-v1', JSON.stringify([{
      id: 143, ownerId: 'owner', owner: 'Brian', glyph: 'PHOTO', name: 'Before-update jacket',
      category: 'Jackets', color: 'Black', size: '', brand: '', visibility: 'Private', notes: 'Keep this', occasionTags: [],
      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==',
      createdAt: '2026-11-24T00:00:00.000Z', updatedAt: '2026-11-24T00:00:00.000Z',
    }]))
  })
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
  await nav.getByRole('button', { name: 'Closet' }).click()
  await expect(page.getByRole('button', { name: 'Backup', exact: true })).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'Before-update jacket' })).toBeVisible()
  expect(await page.evaluate(() => [
    localStorage.getItem('mfc-beta-items-v1'), localStorage.getItem('mfc-wardrobe-migrated-v2'),
  ])).toEqual([null, '1'])
  await page.reload()
  await nav.getByRole('button', { name: 'Closet' }).click()
  await expect(page.getByRole('heading', { name: 'Before-update jacket' })).toBeVisible()
  await page.getByRole('button', { name: /Before-update jacket/ }).click()
  await expect(page.getByText('Keep this')).toBeVisible()
  await page.getByRole('button', { name: 'Delete item' }).click()
  await expect(page.getByRole('button', { name: 'Keep item' })).toBeFocused()
  await page.getByRole('button', { name: 'Keep item' }).click()
  await expect(page.getByRole('heading', { name: 'Before-update jacket' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Delete item' }).click()
  await page.getByRole('button', { name: 'Delete this piece' }).click()
  await expect(page.getByRole('heading', { name: 'Before-update jacket' })).toHaveCount(0)
  await page.reload()
  await nav.getByRole('button', { name: 'Closet' }).click()
  await expect(page.getByRole('button', { name: 'Backup', exact: true })).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'Before-update jacket' })).toHaveCount(0)
})

test('saves a wardrobe larger than the usual localStorage quota', async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('button', { name: 'Add multiple photos' }).click()
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000; canvas.height = 1000
    const ctx = canvas.getContext('2d')!
    const data = ctx.createImageData(1000, 1000)
    let noise = 1729
    for (let i = 0; i < data.data.length; i += 4) {
      noise ^= noise << 13; noise ^= noise >>> 17; noise ^= noise << 5
      data.data[i] = noise & 255; data.data[i + 1] = (noise >>> 8) & 255
      data.data[i + 2] = (noise >>> 16) & 255; data.data[i + 3] = 255
    }
    ctx.putImageData(data, 0, 0)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  const buffer = Buffer.from(photo, 'base64')
  const dialog = page.getByRole('dialog', { name: 'Add photos in bulk' })
  await mkdir(testInfo.outputDir, { recursive: true })
  const paths = await Promise.all(Array.from({ length: 12 }, async (_, i) => {
    const path = testInfo.outputPath(`capacity-${i}.png`)
    await writeFile(path, buffer)
    return path
  }))
  await dialog.getByLabel('Choose multiple clothing photos').setInputFiles(paths)
  await expect(dialog.getByAltText('Clothing photo 12')).toBeVisible({ timeout: 20_000 })
  for (let i = 1; i <= 12; i++) await dialog.getByLabel(`Category for photo ${i}`, { exact: true }).selectOption('Tops')
  await dialog.getByRole('button', { name: 'Save 12 private pieces' }).click()
  await expect(page.getByText('Saved 12 private pieces')).toBeVisible()
  const bytes = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const open = indexedDB.open('mfc-wardrobe-v2')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const read = db.transaction('wardrobe').objectStore('wardrobe').get('items')
      read.onerror = () => { db.close(); reject(read.error) }
      read.onsuccess = () => { db.close(); resolve(JSON.stringify(read.result).length) }
    }
  }))
  expect(bytes).toBeGreaterThan(5_242_880)
  await page.reload()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
  await expect(page.getByRole('heading', { name: /^Top [1-9][0-9]*$/ })).toHaveCount(12)
})

test('reviews a text-only AI prompt and safely imports a response with real closet pieces', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded-ai')) return
    sessionStorage.setItem('seeded-ai', '1')
    const photos = ['Office top', 'Work trousers'].map((name, index) => ({
      id: index + 111, name, ownerId: 'owner', owner: 'Test', category: index ? 'Bottoms' : 'Tops', color: index ? 'Navy' : 'Cream',
      visibility: 'Private', size: 'SECRET_SIZE', brand: '', glyph: 'PHOTO', occasionTags: [], notes: 'SECRET_NOTE',
      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==',
      createdAt: '2026-11-25T00:00:00.000Z', updatedAt: '2026-11-25T00:00:00.000Z',
    }))
    localStorage.setItem('mfc-beta-items-v1', JSON.stringify(photos))
  })
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
  await nav.getByRole('button', { name: 'Style' }).click()
  await page.getByLabel('Occasion').fill('Work meeting')
  await page.getByRole('button', { name: 'Try a ChatGPT look' }).click()
  const prompt = await page.getByLabel('1. Review and copy the prompt').inputValue()
  expect(prompt).not.toMatch(/SECRET|iVBOR|localId/)
  const { requestId, clothes } = JSON.parse(prompt.split('WARDROBE DATA:\n\n')[1])
  const input = page.getByLabel('2. Paste the ChatGPT reply')
  const importButton = page.getByRole('button', { name: 'Import AI looks' })
  await input.fill(JSON.stringify({ requestId, looks: [{ pieces: ['P1', 'P99'], why: 'Invalid item' }] }))
  await importButton.click()
  await expect(page.getByText(/not in the shared list/)).toBeVisible()
  await input.fill(JSON.stringify({ requestId, looks: [{ pieces: clothes.map((item: { code: string }) => item.code), why: 'A neutral work palette.' }] }))
  await importButton.click()
  await expect(page.getByRole('heading', { name: 'Your imported looks are ready' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Office top + Work trousers' })).toBeVisible()
  await page.getByRole('button', { name: 'Save this look' }).click()
  await page.reload()
  await nav.getByRole('button', { name: 'Style' }).click()
  await page.getByRole('button', { name: 'Saved looks (1)' }).click()
  await expect(page.getByText(/IMPORTED AI/)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('swaps one photographed garment without changing the anchor and saves the edited look', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded-swap')) return
    sessionStorage.setItem('seeded-swap', '1')
    const clothes = [['Anchor tee','Tops'], ['Blue jeans','Bottoms'], ['Black chinos','Bottoms'], ['Other tee','Tops']]
    localStorage.setItem('mfc-beta-items-v1', JSON.stringify(clothes.map(([name, category], i) => ({
      id: 201 + i, name, category, ownerId: 'owner', owner: 'Test', color: 'Navy',
      visibility: 'Private', size: '', brand: '', glyph: 'PHOTO', occasionTags: [], notes: '',
      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==',
      createdAt: '2026-11-25T00:00:00.000Z', updatedAt: '2026-11-25T00:00:00.000Z',
    }))))
  })
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
  await nav.getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('button', { name: /Anchor tee/ }).click()
  await page.getByRole('button', { name: 'Style this piece' }).click()
  await page.getByRole('button', { name: 'Build my looks' }).click()
  const target = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Anchor tee + Blue jeans' }) })
  await target.getByText('Swap a piece', { exact: true }).click()
  await expect(target.getByLabel('Piece to swap').locator('option')).toHaveCount(2)
  await target.getByLabel('Piece to swap').selectOption({ label: 'Blue jeans' })
  await target.getByLabel('Replacement').selectOption({ label: 'Black chinos' })
  await target.getByRole('button', { name: 'Use replacement' }).click()
  const custom = page.getByRole('article').filter({ has: page.getByText(/You swapped Blue jeans for Black chinos/) })
  await expect(custom.getByRole('heading', { name: 'Anchor tee + Black chinos' })).toBeVisible()
  await custom.getByRole('button', { name: 'Save this look' }).click()
  await page.reload()
  await nav.getByRole('button', { name: 'Style' }).click()
  await page.getByRole('button', { name: 'Saved looks (1)' }).click()
  await expect(page.getByRole('heading', { name: 'Anchor tee + Black chinos' })).toBeVisible()
  await page.getByRole('button', { name: 'Mark worn today' }).click()
  await expect(page.getByRole('button', { name: 'Wore it today' })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await nav.getByRole('button', { name: 'Style' }).click()
  await page.getByRole('button', { name: 'Saved looks (1)' }).click()
  await expect(page.getByText('Last worn today · 1 day logged')).toBeVisible()
  await page.getByRole('button', { name: 'Wore it today' }).click()
  await expect(page.getByRole('button', { name: 'Mark worn today' })).toHaveAttribute('aria-pressed', 'false')
})

test('home and quick intake fit small phones through desktop, with keyboard focus contained', async ({ page }) => {
  await page.goto('/')
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 820 })
    await expect(page.getByRole('heading', { name: /Your clothes.*New outfits/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }

  await page.setViewportSize({ width: 320, height: 740 })
  const start = page.getByRole('button', { name: 'Add your first photos' })
  await start.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Add photos in bulk' })
  await expect(dialog).toBeVisible()
  const close = dialog.getByRole('button', { name: 'Close photo batch' })
  const picker = dialog.getByLabel('Choose multiple clothing photos')
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(picker).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  expect(await dialog.evaluate((box) => box.scrollWidth <= box.clientWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)

  await expect(page.getByRole('heading', { name: 'Your closet is empty' })).toBeVisible()
  await expect(page.getByText('0 saved pieces, 0 ready to borrow.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ivory linen set' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Include sample pieces' }).click()
  await expect(page.getByRole('heading', { name: 'Ivory linen set' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('heading', { name: 'Your closet is empty' })).toBeVisible()

  const bulk = page.getByRole('button', { name: 'Add multiple photos' })
  await bulk.focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(bulk).toBeFocused()
})

test('new user can style six owned photos for an occasion and download a local outfit card', async ({ page, browser }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add your first photos' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add photos in bulk' })
  const colors = ['#ead0bc', '#536d7f', '#7d4f56', '#2f4d54', '#b3926e', '#a8ab9c']
  const photos = await page.evaluate((palette) => {
    const c = document.createElement('canvas')
    c.width = 240; c.height = 180
    const ctx = c.getContext('2d')!
    return palette.map((color, i) => {
      ctx.fillStyle = '#ebe0d6'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.fillStyle = color
      ctx.fillRect(50 + i, 24, 132, 140)
      return c.toDataURL('image/png').split(',')[1]
    })
  }, colors)
  await dialog.getByLabel('Choose multiple clothing photos').setInputFiles(photos.map((data, i) => ({
    name: `pilot-${i}.png`, mimeType: 'image/png', buffer: Buffer.from(data, 'base64'),
  })))
  await expect(dialog.getByAltText('Clothing photo 6')).toBeVisible()
  for (const [i, category] of ['Tops', 'Tops', 'Bottoms', 'Bottoms', 'Shoes', 'Jackets'].entries()) {
    await dialog.getByLabel(`Category for photo ${i + 1}`).selectOption(category)
  }
  await expect(dialog.getByText('6 of 6 ready to save')).toBeVisible()
  await expect(dialog.getByLabel('Name for photo 1')).toHaveAttribute('placeholder', 'Top 1')
  await expect(dialog.getByLabel('Name for photo 2')).toHaveAttribute('placeholder', 'Top 2')
  await dialog.getByLabel('Color for photo 1').fill('My custom color')
  await dialog.getByRole('button', { name: 'Use 5 suggested colors' }).click()
  await expect(dialog.getByLabel('Color for photo 1')).toHaveValue('My custom color')
  await expect(dialog.getByLabel('Color for photo 2')).toHaveValue('Blue')
  await dialog.getByRole('button', { name: 'Save 6 private pieces' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Your photos are ready to style')).toBeVisible()
  await page.getByRole('button', { name: 'Style my photos' }).click()
  await page.getByLabel('Occasion').fill('Dinner on the patio')
  await expect(page.getByText('6 photographed pieces')).toBeVisible()
  await page.getByRole('button', { name: 'Build my looks' }).click()
  await expect(page.getByRole('heading', { name: 'Your looks are ready' })).toBeVisible()
  await page.getByRole('button', { name: 'Save this look' }).first().click()
  await page.getByRole('button', { name: 'Saved looks (1)' }).click()
  await expect(page.getByText(/\d+ of your photos/)).toBeVisible()
  await expect(page.getByText(/sample pieces/).filter({ hasText: /\d+ sample piece/ })).toHaveCount(0)
  await page.getByText('Ask a friend', { exact: true }).click()
  await expect(page.getByText(/it saves to your device/i)).toBeVisible()
  const outgoing: string[] = []
  page.on('request', (request) => outgoing.push(request.url()))
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download outfit card' }).click()
  const download = await pending
  expect(download.suggestedFilename()).toBe('my-friends-closet-outfit.png')
  const cardPath = testInfo.outputPath('outfit-card.png')
  await download.saveAs(cardPath)
  const png = await readFile(cardPath)
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  expect(png.readUInt32BE(16)).toBe(1000)
  expect(png.readUInt32BE(20)).toBeGreaterThan(600)
  expect(outgoing.filter((url) => url.startsWith('http'))).toEqual([])

  await page.getByRole('button', { name: 'Mark worn today' }).click()
  const originalPhotos = await page.getByRole('article').first().getByRole('button', { name: /^View / }).allTextContents()
  await page.getByRole('checkbox', { name: /Prefer outfits I haven’t worn/i }).check()
  await page.getByRole('button', { name: 'Build my looks' }).click()
  await expect(page.getByRole('heading', { name: 'Your looks are ready' })).toBeVisible()
  const freshPhotos = await page.getByRole('article').first().getByRole('button', { name: /^View / }).allTextContents()
  expect(freshPhotos.length).toBeGreaterThan(1)
  expect(freshPhotos).not.toEqual(originalPhotos)
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('button', { name: 'Backup', exact: true }).click()
  const pendingBackup = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download wardrobe' }).click()
  const backupFile = testInfo.outputPath('six-photos-and-looks.json')
  await (await pendingBackup).saveAs(backupFile)

  const fresh = await browser.newPage({ viewport: { width: 390, height: 844 }, baseURL: testInfo.project.use.baseURL })
  try {
    await fresh.addInitScript(() => {
      const set = Storage.prototype.setItem
      Storage.prototype.setItem = function(key, value) {
        if (key === 'mfc-beta-saved-looks-v1' && sessionStorage.getItem('test-block-look-save') === '1') {
          throw new DOMException('Test storage limit', 'QuotaExceededError')
        }
        return set.call(this, key, value)
      }
    })
    await fresh.goto('/')
    await fresh.evaluate(() => sessionStorage.setItem('test-block-look-save', '1'))
    const freshNav = fresh.getByRole('navigation', { name: 'Mobile navigation' })
    await freshNav.getByRole('button', { name: 'Closet' }).click()
    await fresh.getByRole('button', { name: 'Backup', exact: true }).click()
    await fresh.getByLabel('Choose wardrobe backup file').setInputFiles(backupFile)
    await expect(fresh.getByText('1 new saved look, 0 existing looks with wear history to merge.')).toBeVisible()
    await fresh.getByRole('button', { name: 'Restore backup' }).click()
    await expect(fresh.getByRole('alert')).toContainText('Your photos are safe, but the outfits could not be saved.')
    await expect(fresh.getByText('These pieces are already in your closet.', { exact: false })).toBeVisible()
    await fresh.evaluate(() => sessionStorage.removeItem('test-block-look-save'))
    await fresh.getByRole('button', { name: 'Restore backup' }).click()
    await expect(fresh.getByRole('status').filter({ hasText: 'Wardrobe and looks restored' })).toBeVisible()
    await freshNav.getByRole('button', { name: 'Style' }).click()
    await expect(fresh.getByText('6 photographed pieces')).toBeVisible()
    await fresh.getByRole('button', { name: 'Saved looks (1)' }).click()
    await expect(fresh.getByText('Last worn today · 1 day logged')).toBeVisible()
  } finally {
    await fresh.close()
  }
})
