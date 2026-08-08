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
export const SAMPLE_WORKSHEET: WorksheetInput = {
  parties: { a: { name: 'Taylor' }, b: { name: 'Blake' } },
  childrenCount: 2,
  income: {
    gross: { a: 4800, b: 6500 },
    selfEmployment: { a: 0, b: 0 },
    maintenance: { a: 0, b: 0 },
    otherChildren: { a: 0, b: 450 },
  },
  parentingTime: { a: 219, b: 146 },
  addOns: {
    childcare: 780,
    healthInsurance: 240,
    extraordinaryMedical: 60,
  },
}

/** A minimal blank worksheet — used by "start over" and by tests needing a clean slate. */
export const EMPTY_WORKSHEET: WorksheetInput = {
  parties: { a: { name: 'Parent A' }, b: { name: 'Parent B' } },
  childrenCount: 1,
  income: {},
  parentingTime: { a: 182, b: 183 },
  addOns: {},
}
