import { test, expect, type Page } from '@playwright/test'

/**
 * Theme persistence, end to end.
 *
 * This is the suite that actually proves the feature: unit tests can verify the store and
 * the provider, but only a real browser can show that a preference survives a reload and
 * that the boot script applies it before the app renders.
 *
 * Locators stay role/accessible-name based, matching the other specs — no test ids.
 */

/** The theme toggle, found by its stable accessible-name prefix. */
function themeButton(page: Page) {
  return page.getByRole('button', { name: /^Theme:/ })
}

/** Whatever is currently painted, per the attribute the CSS keys off. */
function currentTheme(page: Page) {
  return page.locator('html')
}

/** Click the toggle until the preference reads `want`, or fail after a full cycle. */
async function selectTheme(page: Page, want: 'System' | 'Light' | 'Dark') {
  const button = themeButton(page)
  for (let i = 0; i < 3; i += 1) {
    if ((await button.textContent())?.trim() === want) return
    await button.click()
  }
  throw new Error(`Could not reach the ${want} theme within one full cycle`)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /estimate monthly support/i })).toBeVisible()
})

test('defaults to following the OS colour scheme', async ({ page }) => {
  // First run, nothing stored: the app should already match the machine rather than
  // starting light and making a dark-mode user fix it by hand.
  await expect(themeButton(page)).toHaveText('System')
  await expect(currentTheme(page)).toHaveAttribute('data-theme', 'light')
})

test('cycles System → Light → Dark → System', async ({ page }) => {
  const button = themeButton(page)

  await expect(button).toHaveText('System')
  await button.click()
  await expect(button).toHaveText('Light')
  await button.click()
  await expect(button).toHaveText('Dark')
  await expect(currentTheme(page)).toHaveAttribute('data-theme', 'dark')

  // Returning to System matters: it is how a user hands control back to the OS.
  await button.click()
  await expect(button).toHaveText('System')
})

test('remembers the theme across a reload', async ({ page }) => {
  await selectTheme(page, 'Dark')
  await expect(currentTheme(page)).toHaveAttribute('data-theme', 'dark')

  await page.reload()

  // The whole point of the feature.
  await expect(currentTheme(page)).toHaveAttribute('data-theme', 'dark')
  await expect(themeButton(page)).toHaveText('Dark')
})

test('applies the stored theme before the app renders', async ({ page }) => {
  await selectTheme(page, 'Dark')

  // Reload and read `data-theme` at `domcontentloaded`, before React has mounted. The boot
  // script is render-blocking, so the attribute must already be correct here — if it were
  // only set by the provider, this would be null and the user would see a light flash.
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(currentTheme(page)).toHaveAttribute('data-theme', 'dark')
})

test.describe('with a dark OS preference', () => {
  test.use({ colorScheme: 'dark' })

  test('follows the system scheme when set to System', async ({ page }) => {
    await expect(themeButton(page)).toHaveText('System')
    await expect(currentTheme(page)).toHaveAttribute('data-theme', 'dark')
  })

  test('an explicit Light choice outranks the OS and survives a reload', async ({ page }) => {
    await selectTheme(page, 'Light')
    await expect(currentTheme(page)).toHaveAttribute('data-theme', 'light')

    await page.reload()

    // Otherwise "light" would be unusable on a dark-mode machine.
    await expect(currentTheme(page)).toHaveAttribute('data-theme', 'light')
    await expect(themeButton(page)).toHaveText('Light')
  })
})

test('the theme survives navigating the guided flow', async ({ page }) => {
  await selectTheme(page, 'Dark')
  await page.getByRole('button', { name: 'Review full worksheet' }).click()

  await expect(page.getByRole('heading', { name: /Review your worksheet/i })).toBeVisible()
  await expect(currentTheme(page)).toHaveAttribute('data-theme', 'dark')
})
