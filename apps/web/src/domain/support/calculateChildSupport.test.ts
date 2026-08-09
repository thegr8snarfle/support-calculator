/**
 * Engine tests against the real shipped Colorado rule set.
 *
 * These deliberately use the production data (not a toy fixture) so a bad
 * transcription of the schedule or the parenting-time table fails here.
 */
import { describe, expect, it, beforeAll } from 'vitest'
import { createStaticRulesRepository } from '../../services/rules/staticRulesRepository'
import { DEFAULT_INPUT } from '../../mocks/supportFixtures'
import { calculateChildSupport } from './calculateChildSupport'
import { selfSupportReserve } from './lowIncome'
import type { SupportRuleSet } from '../../types/rules'
import type { WorksheetInput } from '../../types/support'

let rules: SupportRuleSet

beforeAll(async () => {
  rules = await createStaticRulesRepository().getRuleSet({ jurisdiction: 'CO' })
})

function input(overrides: Partial<WorksheetInput> = {}): WorksheetInput {
  return { ...structuredClone(DEFAULT_INPUT), ...overrides }
}

describe('rule set integrity', () => {
  it('ships the post-HB 25-1159 Colorado schedule', () => {
    expect(rules.jurisdiction.code).toBe('CO')
    expect(rules.effective.from).toBe('2026-03-01')
    expect(rules.schedule.rows).toHaveLength(800)
    expect(rules.schedule.rows[0].combinedIncome).toBe(50)
    expect(rules.schedule.rows[799].combinedIncome).toBe(40000)
  })

  it('matches independently published figures (transcription cross-check)', () => {
    // Guards against a bad transcription of the schedule. These two values are
    // reported independently of the bill text by published 2026 Colorado guidance:
    //   $10,000 combined monthly AGI, two children -> $2,001 basic obligation
    //   self-support reserve -> $1,831.83/mo
    const row = rules.schedule.rows.find((r) => r.combinedIncome === 10000)
    expect(row?.obligations[1]).toBe(2001)
    expect(selfSupportReserve(rules)).toBeCloseTo(1831.83, 2)

    // Reserve is a formula on the state minimum wage, not a hardcoded amount.
    const ssr = rules.selfSupportReserve
    expect(ssr.formula).toEqual({ hoursPerWeek: 29, weeksPerYear: 50, monthsPerYear: 12 })
  })

  it('ships the continuous parenting-time credit table', () => {
    const t = rules.parentingTimeCredit.table
    expect(t).toHaveLength(367)
    expect(t[0]).toEqual({ overnights: 0, creditPct: 0 })
    expect(t[t.length - 1]).toEqual({ overnights: 365, creditPct: 100 })
    expect(t.some((r) => r.overnights === 182.5 && r.creditPct === 50)).toBe(true)
  })
})

describe('calculateChildSupport — sample worksheet', () => {
  it('produces a coherent estimate', () => {
    const e = calculateChildSupport(input(), rules)

    // AGI: no other-children order applies, so AGI equals gross for both parties.
    expect(e.adjustedIncome).toEqual({ a: 8300, b: 15000 })
    expect(e.combinedIncome).toBe(23300)
    expect(e.shareA + e.shareB).toBeCloseTo(100, 1)
    expect(e.incomplete).toBe(false)
    expect(e.amount).toBeGreaterThan(0)
    // A has the majority of overnights, so B pays.
    expect(e.payer).toBe('b')
    expect(e.recipient).toBe('a')
    expect(e.addOns).toBe(950)
  })

  it('does not warn about overnights — that is now a blocking validation error', () => {
    // Ownership moved to `validateWorksheet`: a total that isn't the parenting year makes
    // the figure meaningless rather than imprecise (365/365 computes a confident $0), so it
    // blocks instead of warning, and invalid input never reaches this function at all.
    // `warnings` is reserved for cases that still produce a usable estimate.
    const e = calculateChildSupport(input({ parentingTime: { a: 200, b: 100 } }), rules)
    expect(e.warnings.some((w) => w.includes('300'))).toBe(false)
  })
})

describe('no 93-overnight cliff (HB 25-1159)', () => {
  it('changes support smoothly across the former threshold', () => {
    const at = (nightsB: number) =>
      calculateChildSupport(
        input({ parentingTime: { a: 365 - nightsB, b: nightsB } }),
        rules,
      ).amount

    const before = at(92)
    const on = at(93)
    const after = at(94)

    // Monotonic: more overnights for the payer never increases what they owe.
    expect(on).toBeLessThanOrEqual(before)
    expect(after).toBeLessThanOrEqual(on)
    // And the step across the old cliff is small — no discontinuity.
    expect(Math.abs(before - on)).toBeLessThan(25)
  })

  it('gives credit below 93 overnights, which the old formula did not', () => {
    const none = calculateChildSupport(
      input({ parentingTime: { a: 365, b: 0 } }),
      rules,
    ).amount
    const some = calculateChildSupport(
      input({ parentingTime: { a: 315, b: 50 } }),
      rules,
    ).amount
    expect(some).toBeLessThan(none)
  })

  it('is symmetric at an even split', () => {
    const even = calculateChildSupport(
      input({
        parentingTime: { a: 182.5, b: 182.5 },
        income: {
          gross: { a: 5000, b: 5000 },
          selfEmployment: { a: 0, b: 0 },
          maintenance: { a: 0, b: 0 },
          otherChildren: { a: 0, b: 0 },
        },
        addOns: {},
      }),
      rules,
    )
    // Equal incomes + equal time + no add-ons => no transfer.
    expect(even.amount).toBe(0)
  })
})

describe('income shares drive who pays', () => {
  it('flips the payer when the income advantage flips', () => {
    const base = {
      parentingTime: { a: 182.5, b: 182.5 },
      addOns: {},
    }
    const aRicher = calculateChildSupport(
      input({
        ...base,
        income: {
          gross: { a: 9000, b: 3000 },
          selfEmployment: { a: 0, b: 0 },
          maintenance: { a: 0, b: 0 },
          otherChildren: { a: 0, b: 0 },
        },
      }),
      rules,
    )
    const bRicher = calculateChildSupport(
      input({
        ...base,
        income: {
          gross: { a: 3000, b: 9000 },
          selfEmployment: { a: 0, b: 0 },
          maintenance: { a: 0, b: 0 },
          otherChildren: { a: 0, b: 0 },
        },
      }),
      rules,
    )
    expect(aRicher.payer).toBe('a')
    expect(bRicher.payer).toBe('b')
    expect(aRicher.amount).toBe(bRicher.amount)
  })
})

describe('child count', () => {
  it('increases the basic obligation monotonically', () => {
    const amounts = [1, 2, 3, 4, 5, 6].map(
      (n) => calculateChildSupport(input({ childrenCount: n }), rules).basicObligation,
    )
    for (let i = 1; i < amounts.length; i += 1) {
      expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i - 1])
    }
  })

  it('treats more than six children as six', () => {
    const six = calculateChildSupport(input({ childrenCount: 6 }), rules)
    const nine = calculateChildSupport(input({ childrenCount: 9 }), rules)
    expect(nine.basicObligation).toBe(six.basicObligation)
    expect(nine.warnings.some((w) => w.includes('6 children'))).toBe(true)
  })
})

describe('low income protections', () => {
  const lowIncome = (gross: number): WorksheetInput =>
    input({
      childrenCount: 1,
      parentingTime: { a: 365, b: 0 },
      addOns: {},
      income: {
        gross: { a: 4000, b: gross },
        selfEmployment: { a: 0, b: 0 },
        maintenance: { a: 0, b: 0 },
        otherChildren: { a: 0, b: 0 },
      },
    })

  it('applies the $10 minimum order at or below $650', () => {
    const e = calculateChildSupport(lowIncome(600), rules)
    expect(e.payer).toBe('b')
    expect(e.basis).toBe('minimumOrder')
    expect(e.amount).toBe(10)
  })

  it('keeps an obligor near the self-support reserve well below the schedule share', () => {
    const reserve = selfSupportReserve(rules)
    expect(reserve).toBeCloseTo(1831.83, 1)
    const e = calculateChildSupport(lowIncome(Math.round(reserve) - 100), rules)
    expect(e.amount).toBeLessThan(e.perParty.b.shareOfBasic)
    expect(['lowIncomeReduced', 'selfSupportReserve']).toContain(e.basis)
  })
})

describe('incomplete input', () => {
  it('returns a zeroed, flagged estimate rather than throwing', () => {
    const e = calculateChildSupport(input({ income: {}, childrenCount: 0 }), rules)
    expect(e.incomplete).toBe(true)
    expect(e.amount).toBe(0)
    expect(e.warnings.length).toBeGreaterThan(0)
  })
})

describe('above the schedule ceiling', () => {
  it('floors at the top row and flags it', () => {
    const e = calculateChildSupport(
      input({
        income: {
          gross: { a: 30000, b: 30000 },
          selfEmployment: { a: 0, b: 0 },
          maintenance: { a: 0, b: 0 },
          otherChildren: { a: 0, b: 0 },
        },
      }),
      rules,
    )
    expect(e.basis).toBe('aboveScheduleCeiling')
    // One child (the default worksheet's childrenCount), top row of the schedule.
    expect(e.basicObligation).toBe(3398)
  })
})

/**
 * Add-on credits (`C.R.S. §14-10-115(9)–(10)`).
 *
 * Before this feature, nothing pinned add-on behaviour at all — the engine added the
 * payer's share and never subtracted anything, which silently assumed the recipient paid
 * every bill. These tests fix that assumption in place as the *unattributed* default and
 * cover the credit that departs from it.
 */
describe('add-on credits', () => {
  /** Attribute one shared-cost line to a parent, leaving the amounts alone. */
  function withPayer(lineId: string, party: 'a' | 'b'): WorksheetInput {
    const w = input()
    w.addOns[lineId] = { ...w.addOns[lineId], paidBy: party }
    return w
  }

  it('reproduces the pre-credit figures when nothing is attributed', () => {
    // The regression guard: an untouched worksheet must calculate exactly as it did
    // before add-on entries gained a carrier.
    const e = calculateChildSupport(input(), rules)
    expect(e.addOns).toBe(950)
    expect(e.perParty[e.payer].addOnCredit).toBe(0)
    // Unattributed lines are modelled as carried by the recipient — the assumption the
    // engine always made implicitly, now stated.
    expect(e.perParty[e.recipient].addOnsPaid).toBe(950)
    expect(e.perParty[e.payer].addOnsPaid).toBe(0)
    expect(e.warnings).toEqual([])
  })

  it('credits the carrying parent the full amount, not their pro-rata share', () => {
    const base = calculateChildSupport(input(), rules)
    const credited = calculateChildSupport(withPayer('healthInsurance', 'b'), rules)

    // Blake pays; the $200 premium comes off the top of his transfer in full.
    expect(base.payer).toBe('b')
    expect(credited.payer).toBe('b')
    expect(base.amount - credited.amount).toBe(200)
    expect(credited.perParty.b.addOnCredit).toBe(200)
    // His total outlay is unchanged: he pays $200 to the insurer instead of to Taylor.
    expect(credited.amount + 200).toBe(base.amount)
  })

  it('leaves the pooled obligation and both income shares untouched', () => {
    // The expense stays shared — both parents still owe their percentage of it. Only who
    // hands over the money changes, so nothing upstream of the transfer may move.
    const base = calculateChildSupport(input(), rules)
    const credited = calculateChildSupport(withPayer('childcare', 'b'), rules)

    expect(credited.addOns).toBe(base.addOns)
    expect(credited.perParty.a.shareOfAddOns).toBe(base.perParty.a.shareOfAddOns)
    expect(credited.perParty.b.shareOfAddOns).toBe(base.perParty.b.shareOfAddOns)
    expect(credited.basicObligation).toBe(base.basicObligation)
  })

  it('splits the add-on total between the parties by income share', () => {
    const e = calculateChildSupport(input(), rules)
    expect(e.perParty.a.shareOfAddOns + e.perParty.b.shareOfAddOns).toBeCloseTo(e.addOns, 0)
  })

  it('does not change who pays when the recipient carries a bill', () => {
    // Direction is settled from the basic figures before add-ons are attributed, so a
    // credit to the recipient is inert — it cannot flip the worksheet around.
    const base = calculateChildSupport(input(), rules)
    const credited = calculateChildSupport(withPayer('childcare', 'a'), rules)

    expect(credited.payer).toBe(base.payer)
    expect(credited.recipient).toBe(base.recipient)
    expect(credited.amount).toBe(base.amount)
    expect(credited.perParty[credited.payer].addOnCredit).toBe(0)
  })

  it('floors at zero and names the excess rather than reversing direction', () => {
    // A childcare bill far larger than the obligation, carried by the payer.
    const w = input()
    w.addOns.childcare = { amount: 20000, paidBy: 'b' }
    const e = calculateChildSupport(w, rules)

    expect(e.amount).toBe(0)
    // Direction holds: Blake still owes Taylor, he has simply overpaid.
    expect(e.payer).toBe('b')
    expect(e.recipient).toBe('a')
    // The discarded number is the one that gets litigated, so it must be visible.
    expect(e.warnings.some((warning) => /exceed their share by \$\d/.test(warning))).toBe(true)
  })

  it('raises the documentation advisory only when a line is attributed', () => {
    const shared = calculateChildSupport(input(), rules)
    expect(shared.warnings.some((w) => w.includes('documented'))).toBe(false)

    const credited = calculateChildSupport(withPayer('healthInsurance', 'b'), rules)
    const advisory = credited.warnings.find((w) => w.includes('documented'))
    // Names the line from the rule set's own label, not hardcoded English.
    expect(advisory).toContain(rules.addOnLines.find((l) => l.id === 'healthInsurance')!.label)
  })

  it('ignores an attribution on a zero-amount line', () => {
    // "Blake pays $0 of childcare" is not a credit, and must not raise the advisory.
    const w = input()
    w.addOns.childcare = { amount: 0, paidBy: 'b' }
    const e = calculateChildSupport(w, rules)
    expect(e.perParty.b.addOnCredit).toBe(0)
    expect(e.warnings.some((warning) => warning.includes('documented'))).toBe(false)
  })

  it('applies the credit after the statutory cap, not before', () => {
    // A low-income payer whose obligation is capped, carrying a bill. Capping limits the
    // *obligation*; the credit is money already paid against it. If the order were
    // reversed the cap would swallow the credit and charge them twice.
    const w = input({
      income: {
        gross: { a: 6000, b: 1400 },
        selfEmployment: { a: 0, b: 0 },
        maintenance: { a: 0, b: 0 },
        otherChildren: { a: 0, b: 0 },
      },
      parentingTime: { a: 300, b: 65 },
    })
    w.addOns = { healthInsurance: { amount: 100, paidBy: 'b' } }

    const uncredited = input({ ...w, addOns: { healthInsurance: { amount: 100 } } })
    const base = calculateChildSupport(uncredited, rules)
    const e = calculateChildSupport(w, rules)

    expect(base.payer).toBe('b')
    expect(e.amount).toBe(Math.max(0, base.amount - 100))
  })
})
