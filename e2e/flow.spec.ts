import { test, expect } from '@playwright/test'

/**
 * Smoke tests for the Worksheet ⇄ Review guided flow. These drive the app as a user
 * would and assert the view transitions — not exhaustive coverage.
 */

const worksheetHeading = /estimate monthly support/i
const reviewHeading = /Review your worksheet/i

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

test('the Results step is not navigable yet', async ({ page }) => {
  await page.getByRole('button', { name: 'Review full worksheet' }).click()

  await expect(page.getByRole('button', { name: 'See full results' })).toBeDisabled()
  await expect(page.locator('nav [aria-disabled="true"]')).toContainText('Results')
})
