/**
 * Mock-fixture repository for the family-support flow.
 *
 * Single source of the example data the static UI renders today (worksheet, review,
 * and results all read from here so their numbers can never drift), and the shared
 * fixtures the unit tests will import once the calculation / business-service layer
 * lands (see CLAUDE.md — Vitest + the `C.R.S. §14-10-115` engine).
 *
 * Shaped as domain-ish objects of plain numbers — NOT pre-formatted display strings —
 * so the future calc engine and its tests can consume the same values. Presentational
 * formatting stays at the component boundary (see `src/lib/format.ts`). When the real
 * domain types land in `src/types/support.ts` (per CLAUDE.md), move the shapes below
 * there in the same change; they intentionally stay lightweight for now.
 */
import type { Party } from '../types/common'

/** One income line for both parties (monthly, whole dollars). */
export type IncomeRow = {
  label: string
  hint?: string
  a: number
  b: number
}

/** One shared-cost line, split by income share (monthly, whole dollars). */
export type SharedCostRow = {
  label: string
  hint?: string
  amount: number
}

/** Everything the worksheet collects — the calc engine's future input. */
export type WorksheetFixture = {
  parties: Record<Party, { name: string }>
  childrenCount: number
  income: IncomeRow[]
  /** Overnights per year with each parent (out of 365). */
  parentingTime: { nightsA: number; nightsB: number }
  sharedCosts: SharedCostRow[]
}

/** The computed estimate — the calc engine's future output. */
export type EstimateFixture = {
  /** Net monthly support amount (whole dollars). */
  amount: number
  /** Who pays and who receives. */
  payer: Party
  recipient: Party
  combinedIncome: number
  /** Income-share percentages (sum to 100). */
  shareA: number
  shareB: number
  basicObligation: number
  /** Parenting-time credit — negative reduces the obligation. */
  parentingAdjustment: number
  /** Combined childcare + health + extraordinary-medical add-ons. */
  addOns: number
  netTotal: number
}

/** The controlling Colorado guideline, cited wherever an estimate is shown. */
export const SUPPORT_STATUTE = 'C.R.S. §14-10-115'

/** Example worksheet inputs (mirrors mockups/src/worksheet.html). */
export const SAMPLE_WORKSHEET: WorksheetFixture = {
  parties: { a: { name: 'Taylor' }, b: { name: 'Blake' } },
  childrenCount: 2,
  income: [
    { label: 'Gross monthly income', hint: 'Wages, salary, tips', a: 4800, b: 6500 },
    { label: 'Self-employment income', hint: 'Net of business expenses', a: 0, b: 0 },
    { label: 'Maintenance', hint: 'Alimony paid or received', a: 0, b: 0 },
    { label: 'Support for other children', hint: 'Existing orders', a: 0, b: 450 },
  ],
  parentingTime: { nightsA: 219, nightsB: 146 },
  sharedCosts: [
    { label: 'Work-related childcare', amount: 780 },
    { label: "Children's health insurance", hint: "Premium for the children's portion", amount: 240 },
    { label: 'Extraordinary medical', hint: 'Recurring, over $250/yr', amount: 60 },
  ],
}

/** Example estimate for {@link SAMPLE_WORKSHEET} (static — no calculation yet). */
export const SAMPLE_ESTIMATE: EstimateFixture = {
  amount: 842,
  payer: 'b',
  recipient: 'a',
  combinedIncome: 11300,
  shareA: 42.5,
  shareB: 57.5,
  basicObligation: 1986,
  parentingAdjustment: -612,
  addOns: 1080,
  netTotal: 842,
}
