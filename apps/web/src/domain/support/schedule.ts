/**
 * Schedule of basic child support obligations — table lookup with interpolation.
 *
 * All values come from the rule set (`C.R.S. §14-10-115(7)(b)` for Colorado); this
 * module knows only how to *read* a schedule, never what is in one.
 */
import type { ObligationSchedule, SupportRuleSet } from '../../types/rules'

export type BasicObligationResult = {
  amount: number
  /** How the figure was reached — surfaced in the UI's explanation. */
  basis: 'schedule' | 'interpolated' | 'aboveScheduleCeiling'
}

function columnFor(schedule: ObligationSchedule, childrenCount: number): number {
  // Column index is 0-based; counts above the table's max use the last column
  // ("six or more children").
  const clamped = Math.min(Math.max(childrenCount, 1), schedule.maxChildren)
  return clamped - 1
}

/**
 * Basic obligation for a combined income and child count.
 *
 * - Between rows, amounts are interpolated when the rule set says to
 *   (`C.R.S. §14-10-115(7)(a)(II)(A)`).
 * - Above the top row, the statute leaves the amount to judicial discretion but sets
 *   the top row as a floor, so we return the top row and flag it.
 */
export function basicObligation(
  combinedIncome: number,
  childrenCount: number,
  rules: SupportRuleSet,
): BasicObligationResult {
  const { schedule } = rules
  const rows = schedule.rows
  const col = columnFor(schedule, childrenCount)

  if (childrenCount <= 0 || combinedIncome <= 0) {
    return { amount: 0, basis: 'schedule' }
  }

  const first = rows[0]
  if (combinedIncome <= first.combinedIncome) {
    return { amount: first.obligations[col], basis: 'schedule' }
  }

  const last = rows[rows.length - 1]
  if (combinedIncome >= last.combinedIncome) {
    return {
      amount: last.obligations[col],
      basis: combinedIncome > last.combinedIncome ? 'aboveScheduleCeiling' : 'schedule',
    }
  }

  // Rows are uniformly spaced and sorted (both enforced by the schema), so the
  // bracket index is arithmetic rather than a scan.
  const step = schedule.incomeStep
  const idx = Math.min(
    rows.length - 2,
    Math.floor((combinedIncome - first.combinedIncome) / step),
  )
  const lower = rows[idx]
  const upper = rows[idx + 1]

  if (combinedIncome === lower.combinedIncome) {
    return { amount: lower.obligations[col], basis: 'schedule' }
  }
  if (!schedule.interpolate) {
    return { amount: lower.obligations[col], basis: 'schedule' }
  }

  const span = upper.combinedIncome - lower.combinedIncome
  const ratio = span === 0 ? 0 : (combinedIncome - lower.combinedIncome) / span
  const amount =
    lower.obligations[col] + ratio * (upper.obligations[col] - lower.obligations[col])
  return { amount, basis: 'interpolated' }
}
