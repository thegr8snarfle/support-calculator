/**
 * Income aggregation — pure, no statutory constants (which lines exist and how each
 * one moves income both come from the rule set).
 */
import type { Party } from '../../types/common'
import type { SupportRuleSet } from '../../types/rules'
import type { PartyAmounts, WorksheetInput } from '../../types/support'

const PARTIES: Party[] = ['a', 'b']

/**
 * Each party's monthly adjusted gross income: every income line applied according to
 * its declared `effect`. Never negative — a party whose deductions exceed their
 * income has an AGI of 0, not a negative one that would invert the income shares.
 */
export function adjustedGrossIncome(
  input: WorksheetInput,
  rules: SupportRuleSet,
): PartyAmounts {
  const out = { a: 0, b: 0 } as PartyAmounts
  for (const party of PARTIES) {
    let total = 0
    for (const line of rules.incomeLines) {
      const amount = input.income[line.id]?.[party] ?? 0
      total += line.effect === 'subtract' ? -amount : amount
    }
    out[party] = Math.max(0, total)
  }
  return out
}

/** Combined monthly adjusted gross income of both parties. */
export function combinedIncome(agi: PartyAmounts): number {
  return agi.a + agi.b
}

/**
 * Each party's fractional share of combined income (0–1). When combined income is 0
 * the shares split evenly, so downstream math stays finite instead of dividing by 0.
 */
export function incomeShares(agi: PartyAmounts): PartyAmounts {
  const combined = combinedIncome(agi)
  if (combined <= 0) return { a: 0.5, b: 0.5 }
  return { a: agi.a / combined, b: agi.b / combined }
}
