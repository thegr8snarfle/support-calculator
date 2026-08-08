/**
 * Parenting-time credit.
 *
 * Colorado's HB 25-1159 (effective 2026-03-01) replaced the former 93-overnight
 * threshold — and the 1.50 shared-care multiplier — with a continuous credit table
 * (`C.R.S. §14-10-115(8)(h)`): *every* overnight now earns credit, so there is no
 * cliff to special-case. This module just reads that table.
 */
import type { SupportRuleSet } from '../../types/rules'

/**
 * Credit percentage (0–100) for a number of overnights, interpolating between table
 * entries so fractional/averaged overnights (the statute averages across children)
 * behave sensibly. Values outside the table clamp to its ends.
 */
export function parentingTimeCreditPct(overnights: number, rules: SupportRuleSet): number {
  const table = rules.parentingTimeCredit.table
  if (table.length === 0) return 0

  const first = table[0]
  const last = table[table.length - 1]
  if (overnights <= first.overnights) return first.creditPct
  if (overnights >= last.overnights) return last.creditPct

  // Table is sorted (enforced by the schema) but not uniformly spaced — it carries a
  // fractional 182.5 midpoint — so locate the bracket by binary search.
  let lo = 0
  let hi = table.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (table[mid].overnights <= overnights) lo = mid
    else hi = mid
  }

  const lower = table[lo]
  const upper = table[hi]
  if (overnights === lower.overnights) return lower.creditPct

  const span = upper.overnights - lower.overnights
  const ratio = span === 0 ? 0 : (overnights - lower.overnights) / span
  return lower.creditPct + ratio * (upper.creditPct - lower.creditPct)
}

/**
 * The parenting-time credit in dollars: a percentage of the **total** basic
 * obligation, per `C.R.S. §14-10-115(8)(b)` ("THE PARENTING TIME CREDIT IS THE TOTAL
 * BASIC CHILD SUPPORT OBLIGATION MULTIPLIED BY THAT PARENT'S PARENTING TIME CREDIT
 * PERCENTAGE") — not a percentage of that parent's own share.
 */
export function parentingTimeCredit(
  totalBasicObligation: number,
  overnights: number,
  rules: SupportRuleSet,
): number {
  return (totalBasicObligation * parentingTimeCreditPct(overnights, rules)) / 100
}
