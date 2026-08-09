import { test, expect } from '@playwright/test'

/**
 * Smoke tests for the statute document library — a screen outside the guided
 * Worksheet → Review → Results flow (see `App.tsx`'s sibling `AppView` state).
 *
 * Deliberately avoid asserting on party names or dollar figures here: those live in
 * `apps/web/src/mocks/supportFixtures.ts` and are unrelated to this feature.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('opens the Statute Library from the header and lists both documents', async ({ page }) => {
  await page.getByRole('button', { name: 'View statute source documents' }).click()

  await expect(page.getByRole('heading', { name: /statutes behind your estimate/i })).toBeVisible()
  await expect(page.getByText('C.R.S. Title 14 — Domestic Matters (2024)')).toBeVisible()
  await expect(page.getByText('HB 25-1159 — Final Act')).toBeVisible()
})

test('the worksheet shows the active statute version on load', async ({ page }) => {
  // Scoped to the "Colorado — …" prefix unique to the badge — SupportCitation's
  // disclaimer footnote also mentions the same effective date, phrased differently.
  const badge = page.getByText(/^Colorado — /i)
  await expect(badge).toBeVisible()
  await expect(badge).toContainText('March 1, 2026')
  await expect(badge).toContainText('HB 25-1159')
})

test('downloads a statute document as a PDF', async ({ page }) => {
  await page.getByRole('button', { name: 'View statute source documents' }).click()

  // The download service (`src/services/downloads`) fetches the file and clicks a
  // script-created `<a download>` on a blob URL rather than a plain anchor — Tauri's
  // webview treats a plain `download` attribute as a silent no-op, so this must work the
  // same way in a real browser too. See `browserDownloadService.ts`.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PDF' }).first().click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.pdf$/)
})

test('returning to the flow preserves an edited field', async ({ page }) => {
  const income = page.getByRole('textbox', { name: /Gross monthly income/i }).first()
  await income.fill('9999')
  await income.blur()

  await page.getByRole('button', { name: 'View statute source documents' }).click()
  await expect(page.getByRole('heading', { name: /statutes behind your estimate/i })).toBeVisible()

  await page.getByRole('button', { name: 'Back to worksheet' }).click()
  await expect(income).toHaveValue('9999')
})

test('returning to the flow does not reset an in-progress Review step', async ({ page }) => {
  await page.getByRole('button', { name: 'Review full worksheet' }).click()
  await expect(page.getByRole('heading', { name: /review your worksheet/i })).toBeVisible()

  await page.getByRole('button', { name: 'View statute source documents' }).click()
  await page.getByRole('button', { name: 'Back to worksheet' }).click()

  await expect(page.getByRole('heading', { name: /review your worksheet/i })).toBeVisible()
})

test('the header does not overflow a 390px viewport with the new entry point', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'View statute source documents' }).waitFor()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})
