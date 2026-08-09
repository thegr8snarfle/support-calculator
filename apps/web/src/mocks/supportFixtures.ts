/**
 * Shared fixtures for the family-support flow.
 *
 * Seeds the worksheet's default state and gives the unit tests a realistic input to
 * calculate against, so the UI and the tests can never drift apart.
 *
 * The domain types these use now live in `src/types/support.ts` (promoted from here
 * when the calculation engine landed, as this module's original note called for).
 * Line ids match the ids declared by the Colorado rule set in
 * `src/services/rules/data/co/`, which is what drives the worksheet's rows.
 */
import type { WorksheetInput } from '../types/support'

/** The controlling Colorado guideline, cited wherever an estimate is shown. */
export const SUPPORT_STATUTE = 'C.R.S. §14-10-115'

/** Example worksheet inputs (mirrors mockups/src/worksheet.html). */
export const DEFAULT_INPUT: WorksheetInput = {
  parties: { a: { name: 'Asshole' }, b: { name: 'Austin' } },
  childrenCount: 1,
  income: {
    gross: { a: 8300, b: 15000 },
    selfEmployment: { a: 0, b: 0 },
    maintenance: { a: 0, b: 0 },
    otherChildren: { a: 0, b: 0 },
  },
  parentingTime: { a: 182, b: 183 },
  // Left unattributed: the sample is the app's first impression, and pre-marking a parent
  // as carrying a bill would put an unearned legal assertion (and its advisory warning) on
  // screen before the user has entered anything.
  addOns: {
    childcare: { amount: 750 },
    healthInsurance: { amount: 200 },
    extraordinaryMedical: { amount: 0 },
  },
}

/** A minimal blank worksheet — used by "start over" and by tests needing a clean slate. */
export const EMPTY_WORKSHEET: WorksheetInput = {
  parties: { a: { name: 'Asshole' }, b: { name: 'Austin' } },
  childrenCount: 1,
  income: {},
  parentingTime: { a: 182, b: 183 },
  addOns: {},
}
