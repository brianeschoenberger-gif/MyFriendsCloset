import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_TEST_PORT) || 4173
const url = `http://127.0.0.1:${port}`
const devCommand = `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run dev -- --host 127.0.0.1 --port ${port} --strictPort`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: url,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: devCommand,
    url,
    reuseExistingServer: false,
  },
})
