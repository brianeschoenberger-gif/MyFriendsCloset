import path from 'node:path'
import { expect, test } from '@playwright/test'

test('owner upload to persisted friend request and approval', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Closet' }).click()
  await page.getByRole('button', { name: 'Add from camera' }).click()
  await page.locator('input[type="file"]').setInputFiles(path.join(import.meta.dirname, 'fixtures', 'closet-item.svg'))
  await page.getByLabel('Item name').fill('E2E rooftop dress')
  await page.getByLabel('Size').fill('M')
  await page.getByLabel('Color').fill('Berry')
  await page.getByLabel('Notes').fill('Created by the mobile beta smoke test')
  await page.getByRole('button', { name: 'Save to my closet' }).click()

  await expect(page.getByRole('heading', { name: 'E2E rooftop dress' })).toBeVisible()
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
