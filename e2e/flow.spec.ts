import { test, expect } from '@playwright/test'

/**
 * Smoke tests for the Worksheet → Review → Results guided flow. These drive the app as a
 * user would and assert the view transitions — not exhaustive coverage.
 */

const worksheetHeading = /estimate monthly support/i
const reviewHeading = /Review your worksheet/i
const resultsHeading = /your estimated support/i

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('loads on the Worksheet step', async ({ page }) => {
  await expect(page.getByRole('heading', { name: worksheetHeading })).toBeVisible()
  await expect(page.locator('[aria-current="step"]')).toHaveText('Worksheet')
})

test('navigates Worksheet → Review and back', async ({ page }) => {
  await page.getByRole('button', { name: 'Review full worksheet' }).click()

  await expect(page.getByRole('heading', { name: reviewHeading })).toBeVisible()
  await expect(page.locator('[aria-current="step"]')).toHaveText('Review')

  await page.getByRole('button', { name: 'Back to worksheet' }).click()
  await expect(page.getByRole('heading', { name: worksheetHeading })).toBeVisible()
})

test('an Edit link jumps back to its worksheet section', async ({ page }) => {
  await page.getByRole('button', { name: 'Review full worksheet' }).click()
  await page.getByRole('button', { name: 'Edit monthly income' }).click()

  await expect(page.getByRole('heading', { name: worksheetHeading })).toBeVisible()
  const section = page.locator('#section-income')
  await expect(section).toBeFocused()
  await expect(section).toBeInViewport()
})

test('the stepper chips switch views', async ({ page }) => {
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await expect(page.getByRole('heading', { name: reviewHeading })).toBeVisible()

  await page.getByRole('button', { name: 'Worksheet', exact: true }).click()
  await expect(page.getByRole('heading', { name: worksheetHeading })).toBeVisible()
})

test('navigates Review → Results', async ({ page }) => {
  await page.getByRole('button', { name: 'Review full worksheet' }).click()
  await page.getByRole('button', { name: 'See full results' }).click()

  await expect(page.getByRole('heading', { name: resultsHeading })).toBeVisible()
  await expect(page.locator('[aria-current="step"]')).toHaveText('Results')

  // The Results header chip is now a real, navigable step.
  await page.getByRole('button', { name: 'Worksheet', exact: true }).click()
  await expect(page.getByRole('heading', { name: worksheetHeading })).toBeVisible()
  await page.getByRole('button', { name: 'Results', exact: true }).click()
  await expect(page.getByRole('heading', { name: resultsHeading })).toBeVisible()
})
