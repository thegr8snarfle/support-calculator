import { defineConfig, devices } from '@playwright/test'

const PORT = 5190
const baseURL = `http://localhost:${PORT}`

/**
 * Basic e2e smoke suite for the guided flow. Playwright owns the dev server, and uses
 * the installed Google Chrome (channel: 'chrome') so no Chromium binary download is
 * needed. For a hermetic CI run, drop the channel and `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
