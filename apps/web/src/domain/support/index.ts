/**
 * Public API of the support calculation domain.
 *
 * Everything here is pure and framework-free — no React, no services, no I/O. The
 * statute it implements arrives as data (`SupportRuleSet`) from the rules API layer.
 */
export { calculateChildSupport } from './calculateChildSupport'
export { errorsByField, fieldIds, validateWorksheet } from './validate'
export { adjustedGrossIncome, combinedIncome, incomeShares } from './income'
export { basicObligation } from './schedule'
export { parentingTimeCredit, parentingTimeCreditPct } from './parentingTime'
export {
  applyLowIncomeAdjustment,
  fullTimeMinimumWageIncome,
  obligationCap,
  selfSupportReserve,
} from './lowIncome'
export { roundMoney, roundPercent } from './rounding'
export type { BasicObligationResult } from './schedule'
export type { LowIncomeResult } from './lowIncome'
