/**
 * The child-support calculation engine.
 *
 * Pure and framework-free: `(input, rules) => estimate`. It imports no React, no
 * services, and performs no I/O, so it is trivially unit-testable and the statute it
 * implements can be swapped by handing it a different rule set.
 *
 * Implements Colorado's post-HB 25-1159 method (`C.R.S. §14-10-115`, effective
 * 2026-03-01):
 *
 *   1. Each parent's adjusted gross income; combined income; income shares.
 *   2. Total basic obligation from the schedule (interpolated between rows).
 *   3. Each parent's parenting-time credit = total basic obligation x their credit %
 *      from the parenting-time table — every overnight counts, no 93-night cliff.
 *   4. Each parent owes: their income share of the basic obligation, minus their
 *      parenting-time credit, plus their income share of the add-ons.
 *   5. The parent owing more pays the difference.
 *   6. Low-income / self-support-reserve adjustments and caps apply to that payer,
 *      including the statutory rule that a parent with overnights can never owe more
 *      than the same parent would owe with none.
 *
 * The function is **total**: incomplete input yields a zeroed estimate flagged
 * `incomplete` rather than a throw, so the UI can render a partial figure while the
 * user is still typing.
 */
import type { Party } from '../../types/common'
import type { SupportRuleSet } from '../../types/rules'
import type { CalculationBasis, SupportEstimate, WorksheetInput } from '../../types/support'
import { adjustedGrossIncome, combinedIncome, incomeShares } from './income'
import { basicObligation } from './schedule'
import { parentingTimeCredit, parentingTimeCreditPct } from './parentingTime'
import { applyLowIncomeAdjustment, obligationCap } from './lowIncome'
import { roundMoney, roundPercent } from './rounding'

const OTHER: Record<Party, Party> = { a: 'b', b: 'a' }

function emptyEstimate(warnings: string[]): SupportEstimate {
  const zeroParty = {
    sharePct: 50,
    shareOfBasic: 0,
    parentingTimeCreditPct: 0,
    parentingTimeCredit: 0,
    shareOfAddOns: 0,
    obligation: 0,
  }
  return {
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
    perParty: { a: { ...zeroParty }, b: { ...zeroParty } },
    warnings,
    incomplete: true,
  }
}

export function calculateChildSupport(
  input: WorksheetInput,
  rules: SupportRuleSet,
): SupportEstimate {
  const warnings: string[] = []

  const agi = adjustedGrossIncome(input, rules)
  const combined = combinedIncome(agi)
  const children = input.childrenCount

  if (children <= 0) warnings.push('Enter at least one child to see an estimate.')
  if (combined <= 0) warnings.push('Enter monthly income for at least one parent.')
  if (children <= 0 || combined <= 0) return emptyEstimate(warnings)

  if (children > rules.schedule.maxChildren) {
    warnings.push(
      `The schedule covers up to ${rules.schedule.maxChildren} children; the ` +
        `${rules.schedule.maxChildren}-child amount is used.`,
    )
  }

  // Overnights should total the parenting year; the statute averages across children.
  const nights = input.parentingTime
  const totalNights = nights.a + nights.b
  if (totalNights !== rules.yearNights) {
    warnings.push(
      `Overnights total ${totalNights}, not ${rules.yearNights}. Adjust so they add up.`,
    )
  }

  const shares = incomeShares(agi)
  const basic = basicObligation(combined, children, rules)
  if (basic.basis === 'aboveScheduleCeiling') {
    warnings.push(
      'Combined income is above the top of the schedule; the highest scheduled amount ' +
        'is shown as a floor — a court may order more.',
    )
  }

  const addOnTotal = rules.addOnLines.reduce(
    (sum, line) => sum + (input.addOns[line.id] ?? 0),
    0,
  )

  // Per-parent obligation: share of basic − parenting-time credit + share of add-ons.
  const parties: Party[] = ['a', 'b']
  const perParty = {} as SupportEstimate['perParty']
  for (const p of parties) {
    const shareOfBasic = basic.amount * shares[p]
    const creditPct = parentingTimeCreditPct(nights[p], rules)
    const credit = parentingTimeCredit(basic.amount, nights[p], rules)
    const shareOfAddOns = addOnTotal * shares[p]
    perParty[p] = {
      sharePct: shares[p] * 100,
      shareOfBasic,
      parentingTimeCreditPct: creditPct,
      parentingTimeCredit: credit,
      shareOfAddOns,
      obligation: shareOfBasic - credit + shareOfAddOns,
    }
  }

  // Who pays is decided on the basic obligation net of parenting-time credit.
  //
  // The transfer is that parent's *own* obligation, not the difference between the
  // two. Because the credit percentages sum to 100% of the total basic obligation and
  // the income shares sum to 100%, the two parents' basic obligations always sum to
  // zero — so "the difference" would be exactly double the correct transfer. Taking
  // the payer's own figure is what satisfies all three statutory boundary cases:
  // sole care (0/365) yields the payer's income share of the obligation, an even
  // split with equal incomes yields zero, and every overnight reduces the amount
  // (the point of HB 25-1159's move away from the 93-night cliff).
  const basicNet: Record<Party, number> = {
    a: perParty.a.shareOfBasic - perParty.a.parentingTimeCredit,
    b: perParty.b.shareOfBasic - perParty.b.parentingTimeCredit,
  }
  const payer: Party = basicNet.a >= basicNet.b ? 'a' : 'b'
  const recipient = OTHER[payer]
  let net = basicNet[payer] + perParty[payer].shareOfAddOns

  // Low-income / self-support-reserve adjustment applies to the payer.
  const adjusted = applyLowIncomeAdjustment(
    agi[payer],
    perParty[payer].shareOfBasic,
    children,
    rules,
  )
  let basis: CalculationBasis = basic.basis
  if (adjusted.basis !== 'schedule') {
    // Re-derive the net from the adjusted basic share, keeping credits and add-ons.
    const adjustedObligation =
      adjusted.amount - perParty[payer].parentingTimeCredit + perParty[payer].shareOfAddOns
    net = Math.min(net, adjustedObligation)
    basis = adjusted.basis
  }

  // A parent with overnights can never owe more than with no overnights at all.
  const noOvernightObligation =
    perParty[payer].shareOfBasic + perParty[payer].shareOfAddOns
  net = Math.min(net, noOvernightObligation)

  // Statutory percentage-of-income cap for the low-income bands.
  const cap = obligationCap(agi[payer], rules)
  if (cap !== null) net = Math.min(net, cap)

  net = Math.max(0, net)

  const parentingAdjustment = -perParty[payer].parentingTimeCredit

  return {
    amount: roundMoney(net, rules),
    payer,
    recipient,
    combinedIncome: roundMoney(combined, rules),
    adjustedIncome: { a: roundMoney(agi.a, rules), b: roundMoney(agi.b, rules) },
    shareA: roundPercent(shares.a * 100),
    shareB: roundPercent(shares.b * 100),
    basicObligation: roundMoney(basic.amount, rules),
    parentingAdjustment: roundMoney(parentingAdjustment, rules),
    addOns: roundMoney(addOnTotal, rules),
    netTotal: roundMoney(net, rules),
    basis,
    perParty: {
      a: roundParty(perParty.a, rules),
      b: roundParty(perParty.b, rules),
    },
    warnings,
    incomplete: false,
  }
}

function roundParty(
  p: SupportEstimate['perParty'][Party],
  rules: SupportRuleSet,
): SupportEstimate['perParty'][Party] {
  return {
    sharePct: roundPercent(p.sharePct),
    shareOfBasic: roundMoney(p.shareOfBasic, rules),
    parentingTimeCreditPct: roundPercent(p.parentingTimeCreditPct),
    parentingTimeCredit: roundMoney(p.parentingTimeCredit, rules),
    shareOfAddOns: roundMoney(p.shareOfAddOns, rules),
    obligation: roundMoney(p.obligation, rules),
  }
}
