import { defineConfig, devices } from '@playwright/test'

const devCommand = process.platform === 'win32'
  ? 'npm.cmd run dev -- --host 127.0.0.1 --port 4173'
  : 'npm run dev -- --host 127.0.0.1 --port 4173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: devCommand,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
})
