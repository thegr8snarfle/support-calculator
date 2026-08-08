/**
 * Low-income protections and the self-support reserve
 * (`C.R.S. §14-10-115(3)(g.5)`, `(7)(a)(III)`, `(7)(a)(IV)–(V)`).
 *
 * The reserve is a *formula* keyed to the state minimum wage, not a fixed dollar
 * amount, so it moves whenever the wage does — another reason it lives in data.
 */
import type { SupportRuleSet } from '../../types/rules'
import type { CalculationBasis } from '../../types/support'

/** Monthly self-support reserve: minimum wage x hours/week x weeks/year / months. */
export function selfSupportReserve(rules: SupportRuleSet): number {
  const { stateMinimumWageHourly, formula } = rules.selfSupportReserve
  return (
    (stateMinimumWageHourly * formula.hoursPerWeek * formula.weeksPerYear) /
    formula.monthsPerYear
  )
}

/** Monthly full-time minimum-wage income — the ceiling of the 20% cap band. */
export function fullTimeMinimumWageIncome(rules: SupportRuleSet): number {
  const { stateMinimumWageHourly, fullTimeFormula } = rules.selfSupportReserve
  return (
    (stateMinimumWageHourly * fullTimeFormula.hoursPerWeek * fullTimeFormula.weeksPerYear) /
    fullTimeFormula.monthsPerYear
  )
}

function byChildren(values: number[], childrenCount: number): number {
  const idx = Math.min(Math.max(childrenCount, 1), values.length) - 1
  return values[idx]
}

export type LowIncomeResult = {
  /** The obligor's basic obligation after low-income / reserve adjustment. */
  amount: number
  basis: CalculationBasis
}

/**
 * Adjust the obligor's share of the basic obligation for low income.
 *
 * Bands, per the statute:
 * - AGI <= minimum-order ceiling ($650): flat minimum order.
 * - AGI <= self-support reserve: reduced obligation set by child count.
 * - AGI above the reserve: obligation is capped at a percentage of
 *   (AGI − reserve), floored at the reduced amount and ceilinged at the schedule.
 */
export function applyLowIncomeAdjustment(
  obligorIncome: number,
  scheduleShare: number,
  childrenCount: number,
  rules: SupportRuleSet,
): LowIncomeResult {
  const low = rules.lowIncome
  const reserve = selfSupportReserve(rules)

  if (obligorIncome <= low.minimumOrderIncomeCeiling) {
    return { amount: low.minimumOrderAmount, basis: 'minimumOrder' }
  }

  const reduced = byChildren(low.reducedObligationByChildren, childrenCount)

  if (obligorIncome <= reserve) {
    // Never charge more than the schedule would have.
    return { amount: Math.min(reduced, scheduleShare), basis: 'lowIncomeReduced' }
  }

  const pct = byChildren(low.reserveDifferencePctByChildren, childrenCount)
  const difference = ((obligorIncome - reserve) * pct) / 100

  if (difference < reduced) {
    return { amount: Math.min(reduced, scheduleShare), basis: 'lowIncomeReduced' }
  }
  if (difference < scheduleShare) {
    return { amount: difference, basis: 'selfSupportReserve' }
  }
  return { amount: scheduleShare, basis: 'schedule' }
}

/**
 * The statutory percentage-of-income cap on the final obligation. Applies only while
 * the obligor earns above the reserve but no more than full-time minimum wage.
 * Returns `null` when no cap applies.
 */
export function obligationCap(obligorIncome: number, rules: SupportRuleSet): number | null {
  const reserve = selfSupportReserve(rules)
  const fullTime = fullTimeMinimumWageIncome(rules)
  if (obligorIncome > reserve && obligorIncome <= fullTime) {
    return (obligorIncome * rules.lowIncome.capPctOfObligorIncomeFullTimeBand) / 100
  }
  return null
}
