/**
 * Engine tests against the real shipped Colorado rule set.
 *
 * These deliberately use the production data (not a toy fixture) so a bad
 * transcription of the schedule or the parenting-time table fails here.
 */
import { describe, expect, it, beforeAll } from 'vitest'
import { createStaticRulesRepository } from '../../services/rules/staticRulesRepository'
import { SAMPLE_WORKSHEET } from '../../mocks/supportFixtures'
import { calculateChildSupport } from './calculateChildSupport'
import { selfSupportReserve } from './lowIncome'
import type { SupportRuleSet } from '../../types/rules'
import type { WorksheetInput } from '../../types/support'

let rules: SupportRuleSet

beforeAll(async () => {
  rules = await createStaticRulesRepository().getRuleSet({ jurisdiction: 'CO' })
})

function input(overrides: Partial<WorksheetInput> = {}): WorksheetInput {
  return { ...structuredClone(SAMPLE_WORKSHEET), ...overrides }
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

    // AGI: Taylor 4800; Blake 6500 − 450 (other-children order) = 6050.
    expect(e.adjustedIncome).toEqual({ a: 4800, b: 6050 })
    expect(e.combinedIncome).toBe(10850)
    expect(e.shareA + e.shareB).toBeCloseTo(100, 1)
    expect(e.incomplete).toBe(false)
    expect(e.amount).toBeGreaterThan(0)
    // Taylor has the majority of overnights, so Blake pays.
    expect(e.payer).toBe('b')
    expect(e.recipient).toBe('a')
    expect(e.addOns).toBe(1080)
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
    // Two children, top row of the schedule.
    expect(e.basicObligation).toBe(4992)
  })
})
