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
 *   7. A parent who carries an add-on bill in full is credited the whole amount against
 *      their transfer (`C.R.S. §14-10-115(9)–(10)`) — see the add-on credit section below.
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
    addOnsPaid: 0,
    addOnCredit: 0,
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

  // Overnights are *not* checked here. A total that isn't the parenting year is a blocking
  // `ValidationError` (see `domain/support/validate.ts`) rather than a warning, because the
  // resulting figure is meaningless rather than merely imprecise — 365/365 computes a
  // confident $0. Invalid input never reaches this function, so there is nothing to warn
  // about; `warnings` is reserved for cases that still produce a usable estimate.
  const nights = input.parentingTime

  const shares = incomeShares(agi)
  const basic = basicObligation(combined, children, rules)
  if (basic.basis === 'aboveScheduleCeiling') {
    warnings.push(
      'Combined income is above the top of the schedule; the highest scheduled amount ' +
        'is shown as a floor — a court may order more.',
    )
  }

  const addOnTotal = rules.addOnLines.reduce(
    (sum, line) => sum + (input.addOns[line.id]?.amount ?? 0),
    0,
  )

  // Lines one parent carries in full. A zero-amount line is skipped even if attributed:
  // "Blake pays $0 of childcare" is not a credit and must not raise the advisory warning.
  const attributedLines = rules.addOnLines.filter((line) => {
    const entry = input.addOns[line.id]
    return entry !== undefined && entry.paidBy !== undefined && entry.amount > 0
  })
  const attributedTotal = attributedLines.reduce(
    (sum, line) => sum + (input.addOns[line.id]?.amount ?? 0),
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
      // Filled in below: who carries which line cannot be resolved until the recipient is
      // known, and the recipient is decided from the basic figures computed here.
      addOnsPaid: 0,
      addOnCredit: 0,
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

  // --- Who carries each add-on bill ---------------------------------------------
  //
  // An unattributed line is treated as carried by the **recipient**. That is not a new
  // policy: it is exactly what this function has always assumed, made explicit. The
  // transfer below adds the payer's share of the add-ons and never subtracts anything,
  // which is only correct if the other parent is the one paying the bills.
  //
  // "Carried by the recipient" is circular on its face — the recipient is not known until
  // the obligation is computed. It is resolved by the ordering the engine already has:
  // direction is decided from `basicNet` alone (above), *before* add-ons enter the figure,
  // so the recipient is settled by the time attribution is needed. Attribution can then
  // never change who pays whom, which is also what keeps §4 of the plan's floor honest.
  const unattributedTotal = addOnTotal - attributedTotal
  const addOnsPaid: Record<Party, number> = { a: 0, b: 0 }
  for (const line of attributedLines) {
    const entry = input.addOns[line.id]
    // `paidBy` is non-undefined by construction of `attributedLines`; the guard is for the
    // compiler, which cannot see through the filter.
    if (entry?.paidBy !== undefined) addOnsPaid[entry.paidBy] += entry.amount
  }
  addOnsPaid[recipient] += unattributedTotal
  perParty.a.addOnsPaid = addOnsPaid.a
  perParty.b.addOnsPaid = addOnsPaid.b

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

  // --- The add-on credit ---------------------------------------------------------
  //
  // Only the payer's own carried amount moves the transfer. Both parents still owe their
  // income share of every add-on — the expense stays pooled — but a parent who has already
  // handed the money to the provider gets the full amount back off the top
  // (`C.R.S. §14-10-115(9)–(10)`). Worked through: on a $2,000 obligation split 60/40, the
  // payer owes $1,200; carrying a $250 premium leaves a $950 transfer, so their total
  // outlay is still $1,200 — exactly their 60% share.
  //
  // **Applied after the caps, deliberately.** The statutory caps limit the support
  // *obligation*; the credit is money already paid against that obligation, not a
  // reduction of it. Crediting first and capping second would let the cap swallow the
  // credit and quietly charge the payer twice — the reverse order is a plausible
  // misreading, hence this note.
  const addOnCredit = perParty[payer].addOnsPaid
  perParty[payer].addOnCredit = addOnCredit
  const creditedNet = net - addOnCredit

  // Floored at zero: the direction of payment never reverses. A credit big enough to wipe
  // out the obligation means the payer has overpaid relative to their share, but a court
  // would not order the other parent to start paying *them* on that basis without the
  // recipient agreeing, and an estimate that silently flipped direction would assert an
  // outcome no judge has blessed.
  net = Math.max(0, creditedNet)

  // The floor discards a number, and it is precisely the number that gets litigated — so
  // say it out loud rather than letting $0 imply everything balanced.
  if (creditedNet < 0) {
    const shortfall = roundMoney(-creditedNet, rules)
    warnings.push(
      `${input.parties[payer].name}'s direct-payment credits exceed their share by ` +
        `$${shortfall}/mo. Support is shown as $0; the excess is not carried over and may ` +
        `need to be addressed by agreement or by the court.`,
    )
  }

  // An attributed line is a legal assertion, not just arithmetic — it has to be documented
  // and agreed, or ordered. A warning rather than a `ValidationError` because the worksheet
  // still calculates correctly: this is not something the user can "fix" by editing a
  // field, so gating progression on it would be a dead end. Labels come from the rule set,
  // never hardcoded English, so a new jurisdiction's lines name themselves.
  if (attributedLines.length > 0) {
    const labels = attributedLines.map((line) => line.label)
    const list =
      labels.length === 1
        ? labels[0]
        : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
    const verb = labels.length === 1 ? 'is' : 'are'
    warnings.push(
      `${list} ${verb} credited to whichever parent carries the bill. Direct-payment ` +
        `credits must be documented and agreed by both parents, or ordered by the court.`,
    )
  }

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
    addOnsPaid: roundMoney(p.addOnsPaid, rules),
    addOnCredit: roundMoney(p.addOnCredit, rules),
    obligation: roundMoney(p.obligation, rules),
  }
}
