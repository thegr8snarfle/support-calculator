/**
 * A zeroed estimate used as a render fallback while the rule set is still loading,
 * so presentational components can stay non-nullable.
 */
import type { SupportEstimate } from '../../types/support'

const ZERO_PARTY = {
  sharePct: 50,
  shareOfBasic: 0,
  parentingTimeCreditPct: 0,
  parentingTimeCredit: 0,
  shareOfAddOns: 0,
  obligation: 0,
}

export const EMPTY_ESTIMATE: SupportEstimate = {
  amount: 0,
  payer: 'b',
  recipient: 'a',
  combinedIncome: 0,
  adjustedIncome: { a: 0, b: 0 },
  shareA: 50,
  shareB: 50,
  basicObligation: 0,
  parentingAdjustment: 0,
  addOns: 0,
  netTotal: 0,
  basis: 'schedule',
  perParty: { a: { ...ZERO_PARTY }, b: { ...ZERO_PARTY } },
  warnings: [],
  incomplete: true,
}
