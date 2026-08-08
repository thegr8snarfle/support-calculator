import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end coverage of the live calculation: inputs drive the estimate, the
 * parenting-time credit is continuous (HB 25-1159 removed the 93-overnight cliff),
 * and the three steps agree on the same figures.
 *
 * Locators stay role/accessible-name based, matching flow.spec.ts — no test ids.
 */

/** The rail's headline figure, as a number. */
async function railAmount(page: Page): Promise<number> {
  const hero = page.getByRole('region', { name: 'Support estimate' })
  const text = await hero.innerText()
  const match = text.match(/\$([\d,]+)/)
  if (!match) throw new Error(`No amount found in: ${text}`)
  return Number(match[1].replace(/,/g, ''))
}

async function setField(page: Page, name: string, value: string) {
  const input = page.getByRole('textbox', { name })
  await input.fill(value)
  await input.blur()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /estimate monthly support/i })).toBeVisible()
})

test('shows a computed estimate on load', async ({ page }) => {
  expect(await railAmount(page)).toBeGreaterThan(0)
  await expect(page.getByText(/pays/).first()).toBeVisible()
})

test('changing income updates the estimate live', async ({ page }) => {
  const before = await railAmount(page)
  await setField(page, 'Gross monthly income — Blake', '12000')
  await expect.poll(() => railAmount(page)).not.toBe(before)
})

test('more overnights reduce what the payer owes, with no cliff at 93', async ({ page }) => {
  const at = async (nightsB: number) => {
    await setField(page, 'Overnights per year — Taylor', String(365 - nightsB))
    await setField(page, 'Overnights per year — Blake', String(nightsB))
    return railAmount(page)
  }

  const n60 = await at(60)
  const n92 = await at(92)
  const n93 = await at(93)
  const n94 = await at(94)

  // Monotonic decrease, and no discontinuity across the former threshold.
  expect(n92).toBeLessThan(n60)
  expect(n93).toBeLessThanOrEqual(n92)
  expect(n94).toBeLessThanOrEqual(n93)
  expect(Math.abs(n92 - n93)).toBeLessThan(30)
})

test('children count changes the basic obligation', async ({ page }) => {
  const before = await railAmount(page)
  await page.getByRole('button', { name: 'more' }).click()
  await expect.poll(() => railAmount(page)).toBeGreaterThan(before)
})

test('the children stepper respects its bounds', async ({ page }) => {
  const fewer = page.getByRole('button', { name: 'fewer' })
  for (let i = 0; i < 10; i += 1) {
    if (await fewer.isDisabled()) break
    await fewer.click()
  }
  await expect(fewer).toBeDisabled()

  const more = page.getByRole('button', { name: 'more' })
  for (let i = 0; i < 10; i += 1) {
    if (await more.isDisabled()) break
    await more.click()
  }
  await expect(more).toBeDisabled()
})

test('worksheet, review and results agree on the estimate', async ({ page }) => {
  await setField(page, 'Gross monthly income — Taylor', '5200')
  const onWorksheet = await railAmount(page)

  await page.getByRole('button', { name: 'Review full worksheet' }).click()
  await expect(page.getByRole('heading', { name: /review/i }).first()).toBeVisible()
  const reviewText = await page.locator('body').innerText()
  expect(reviewText).toContain(onWorksheet.toLocaleString('en-US'))

  await page.getByRole('button', { name: 'See full results' }).click()
  const resultsText = await page.locator('body').innerText()
  expect(resultsText).toContain(onWorksheet.toLocaleString('en-US'))
})

test('an edited value survives a trip through Review', async ({ page }) => {
  await setField(page, 'Gross monthly income — Blake', '7777')
  await page.getByRole('button', { name: 'Review full worksheet' }).click()
  await page.getByRole('button', { name: 'Edit monthly income' }).click()
  await expect(page.getByRole('textbox', { name: 'Gross monthly income — Blake' })).toHaveValue('7777')
})

test('non-numeric input is flagged rather than silently zeroed', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Gross monthly income — Taylor' })
  await input.fill('abc')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
})

test('an out-of-range overnight count is flagged, not silently corrected', async ({ page }) => {
  const nights = page.getByRole('textbox', { name: 'Overnights per year — Taylor' })
  await nights.fill('900')
  await nights.blur()

  // The entry survives: clamping it to 365 would make the field and the estimate disagree
  // with nothing on screen saying so.
  await expect(nights).toHaveValue('900')
  await expect(nights).toHaveAttribute('aria-invalid', 'true')

  // The message is reachable without hovering (it is always in the DOM for a11y).
  // Filtered by text because HelpTip uses role="tooltip" too.
  await expect(
    page.getByRole('tooltip').filter({ hasText: 'between 0 and 365' }),
  ).toBeAttached()

  // The estimate is frozen and progression is closed.
  await expect(page.getByText(/Waiting on a correction/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Review full worksheet' })).toBeDisabled()
})

test('overnights that do not total the year flag BOTH inputs', async ({ page }) => {
  // Each value is individually legal; only together are they impossible. This is the case
  // that previously produced a confident $0.
  const taylor = page.getByRole('textbox', { name: 'Overnights per year — Taylor' })
  const blake = page.getByRole('textbox', { name: 'Overnights per year — Blake' })

  await setField(page, 'Overnights per year — Taylor', '365')
  await setField(page, 'Overnights per year — Blake', '365')

  await expect(taylor).toHaveAttribute('aria-invalid', 'true')
  await expect(blake).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('alert')).toContainText('add up to 730')
  await expect(page.getByRole('button', { name: 'Review full worksheet' })).toBeDisabled()
})

test('correcting the overnights clears the errors and reopens the flow', async ({ page }) => {
  await setField(page, 'Overnights per year — Taylor', '365')
  await setField(page, 'Overnights per year — Blake', '365')
  await expect(page.getByRole('button', { name: 'Review full worksheet' })).toBeDisabled()

  await setField(page, 'Overnights per year — Taylor', '219')
  await setField(page, 'Overnights per year — Blake', '146')

  await expect(
    page.getByRole('textbox', { name: 'Overnights per year — Taylor' }),
  ).not.toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText(/Waiting on a correction/)).toBeHidden()

  const review = page.getByRole('button', { name: 'Review full worksheet' })
  await expect(review).toBeEnabled()
  await review.click()
  await expect(page.getByRole('heading', { name: /review/i }).first()).toBeVisible()
})
