/**
 * The statute data contract — "how to calculate support" as *data*, not code.
 *
 * Everything in here is jurisdiction- and vintage-specific and is supplied by the
 * rules API layer (`src/services/rules/`). The calculation engine
 * (`src/domain/support/`) reads these values and contains no statutory constants of
 * its own, so a changed statute or a new state is a data change, not a code change.
 *
 * The shipped Colorado set reflects **HB 25-1159, effective 2026-03-01**, which
 * replaced the former 93-overnight "cliff" and the 1.50 shared-care multiplier with
 * a continuous parenting-time credit table.
 */

/** Which way an income line moves a party's adjusted gross income. */
export type IncomeEffect = 'add' | 'subtract'

/**
 * What changed in this rule set relative to the previous vintage — plain-language
 * notes for the reader, not something the engine calculates from.
 */
export type Changes = {
  /** Summary of the amendment; may contain newlines and bullet lines. */
  comments: string
}

/** A jurisdiction the rules belong to. */
export type Jurisdiction = {
  /** Postal-style code, e.g. `"CO"`. */
  code: string
  name: string
  /** Absent on a jurisdiction's first rule set (nothing to compare against). */
  changes?: Changes
}

/** One collected income line, declared by the rule set rather than hardcoded in the UI. */
export type IncomeLineSpec = {
  id: string
  label: string
  hint?: string
  effect: IncomeEffect
  citation?: string
}

/** One shared-cost / add-on line, apportioned between parents by income share. */
export type AddOnLineSpec = {
  id: string
  label: string
  hint?: string
  citation?: string
}

/** One row of the schedule of basic child support obligations. */
export type ScheduleRow = {
  /** Combined monthly adjusted gross income for this row. */
  combinedIncome: number
  /** Basic obligation for 1..6 children, in order. */
  obligations: number[]
}

export type ObligationSchedule = {
  maxChildren: number
  /** Uniform income increment between rows (used to validate + speed up lookup). */
  incomeStep: number
  /** Whether combined incomes between rows are interpolated. */
  interpolate: boolean
  rows: ScheduleRow[]
}

/** One entry of the parenting-time credit table. `overnights` may be fractional (182.5). */
export type ParentingTimeCreditRow = {
  overnights: number
  /** Credit as a percentage (0–100) of the total basic obligation. */
  creditPct: number
}

export type ParentingTimeCredit = {
  table: ParentingTimeCreditRow[]
}

/** Self-support reserve is a formula keyed to the state minimum wage, not a constant. */
export type SelfSupportReserve = {
  formula: { hoursPerWeek: number; weeksPerYear: number; monthsPerYear: number }
  stateMinimumWageHourly: number
  /** Full-time equivalent used for the upper low-income cap band. */
  fullTimeFormula: { hoursPerWeek: number; weeksPerYear: number; monthsPerYear: number }
}

export type LowIncomeRules = {
  /** At or below this adjusted gross income the minimum order applies. */
  minimumOrderIncomeCeiling: number
  minimumOrderAmount: number
  /** Reduced basic obligation by child count (index 0 = one child). */
  reducedObligationByChildren: number[]
  capPctOfObligorIncomeLowBand: number
  capPctOfObligorIncomeFullTimeBand: number
  /** Percentage of (AGI − reserve) applied by child count (index 0 = one child). */
  reserveDifferencePctByChildren: number[]
}

export type RoundingRule = {
  mode: 'nearest'
  unit: number
}

/** Provenance for the transcribed data, surfaced so figures can be audited. */
export type RuleSetSource = {
  document: string
  url?: string
  retrieved?: string
  note?: string
}

/** The complete, validated statute data set for one jurisdiction and vintage. */
export type SupportRuleSet = {
  schemaVersion: number
  jurisdiction: Jurisdiction
  effective: { from: string; enactedBy?: string }
  citations: Record<string, string>
  source?: RuleSetSource
  period: 'monthly'
  currency: string
  /** Nights in a parenting-time year (365). */
  yearNights: number
  incomeLines: IncomeLineSpec[]
  addOnLines: AddOnLineSpec[]
  schedule: ObligationSchedule
  parentingTimeCredit: ParentingTimeCredit
  selfSupportReserve: SelfSupportReserve
  lowIncome: LowIncomeRules
  rounding: RoundingRule
}
