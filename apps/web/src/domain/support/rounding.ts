/** Money/percentage rounding, driven by the rule set's `rounding` block. */
import type { SupportRuleSet } from '../../types/rules'

/** Round to the rule set's money unit (whole dollars for Colorado). */
export function roundMoney(amount: number, rules: SupportRuleSet): number {
  const unit = rules.rounding.unit || 1
  const rounded = Math.round(amount / unit) * unit
  // Avoid returning -0, which formats as "−$0".
  return Object.is(rounded, -0) ? 0 : rounded
}

/** Percentages are displayed to one decimal place. */
export function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}
