import { expect, test } from '@playwright/test'

test('first-run pages pass the optional axe-core phone-width audit', async ({ page }) => {
  const axeScript = process.env.AXE_CORE_SCRIPT
  test.skip(!axeScript, 'Set AXE_CORE_SCRIPT to a local axe.min.js to run the optional audit.')
  await page.goto('/')
  await page.addScriptTag({ path: axeScript! })

  async function audit(state: string) {
    const violations = await page.evaluate(async () => {
      type Violation = { id: string; nodes: Array<{ target: string[] }> }
      const { axe } = window as unknown as {
        axe: { run: (config: { runOnly: { type: string; values: string[] } }) => Promise<{ violations: Violation[] }> }
      }
      const result = await axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
      return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.flatMap((node) => node.target) }))
    })
    expect(violations, state).toEqual([])
  }

  const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
  await audit('Home')
  await page.getByRole('button', { name: 'Add your first photos' }).click()
  await audit('Upload dialog')
  await page.getByRole('button', { name: 'Close photo batch' }).click()
  await audit('Empty closet')
  await nav.getByRole('button', { name: 'Style' }).click()
  await audit('Style')
  await page.getByRole('checkbox', { name: 'Include labeled sample pieces' }).check()
  await page.getByRole('button', { name: 'Build my looks' }).click()
  await audit('Sample outfits')
  await nav.getByRole('button', { name: 'Requests' }).click()
  await audit('Requests')
})
