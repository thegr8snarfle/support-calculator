/**
 * Domain types for the family-support calculation — the engine's input and output.
 *
 * These are plain numbers, framework-free and formatting-free (display formatting
 * stays at the component boundary, see `src/lib/format.ts`). Promoted here from the
 * original mock fixture shapes in `src/mocks/` per the note in that module.
 */
import type { Party } from './common'

/** An amount collected for each party, keyed by the rule set's line id. */
export type PartyAmounts = Record<Party, number>

/** Everything the worksheet collects — the calculation engine's input. */
export type WorksheetInput = {
  parties: Record<Party, { name: string }>
  childrenCount: number
  /** Income amounts keyed by `IncomeLineSpec.id`, then by party. */
  income: Record<string, PartyAmounts>
  /** Overnights per year with each parent (should total `yearNights`). */
  parentingTime: Record<Party, number>
  /** Shared costs keyed by `AddOnLineSpec.id` (monthly, whole dollars). */
  addOns: Record<string, number>
}

/** Which statutory path produced the obligation, so the UI can explain itself. */
export type CalculationBasis =
  | 'schedule'
  | 'interpolated'
  | 'minimumOrder'
  | 'lowIncomeReduced'
  | 'selfSupportReserve'
  | 'aboveScheduleCeiling'

/** A single labeled step in the "how this was calculated" breakdown. */
export type EstimateLine = {
  id: string
  label: string
  value: number
  citation?: string
}

/**
 * The computed estimate. Field names mirror what the results rail and results page
 * already render so the presentational layer needed no shape churn.
 */
export type SupportEstimate = {
  /** Net monthly support owed (whole dollars, always >= 0). */
  amount: number
  payer: Party
  recipient: Party
  combinedIncome: number
  /** Adjusted gross income per party. */
  adjustedIncome: PartyAmounts
  /** Income-share percentages (sum to 100, rounded for display). */
  shareA: number
  shareB: number
  /** Total basic obligation from the schedule for the combined income. */
  basicObligation: number
  /** Parenting-time credit applied — negative, reduces the obligation. */
  parentingAdjustment: number
  /** Combined add-on total (childcare + health + extraordinary medical). */
  addOns: number
  netTotal: number
  basis: CalculationBasis
  /** Per-party intermediate figures, for the detailed breakdown. */
  perParty: Record<
    Party,
    {
      sharePct: number
      shareOfBasic: number
      parentingTimeCreditPct: number
      parentingTimeCredit: number
      shareOfAddOns: number
      obligation: number
    }
  >
  /**
   * Non-fatal problems the UI surfaces alongside a usable figure — e.g. combined
   * income above the top of the schedule. Distinct from `ValidationError`, which is
   * blocking: anything in here still produced a meaningful estimate.
   */
  warnings: string[]
  /** True when required input is missing, so the UI can show a partial estimate. */
  incomplete: boolean
}

/**
 * A **blocking** problem with the worksheet input.
 *
 * There is deliberately no `severity` field: a `ValidationError` always blocks. The
 * informative-but-still-calculable cases live on `SupportEstimate.warnings`, so the two
 * concepts have exactly one home each and no consumer has to filter by severity.
 */
export type ValidationError = {
  /** Stable identity for the rule that failed, e.g. `'parentingTime.total'`. */
  id: string
  /** Plain language: what is wrong *and* how to fix it. */
  message: string
  /**
   * Ids of the inputs to highlight, from `fieldIds` in `domain/support/validate.ts`.
   * A list rather than a single id so one cross-field rule (overnights not totalling
   * the year) can light up *both* inputs. Empty means form-level only.
   */
  fields: string[]
}
