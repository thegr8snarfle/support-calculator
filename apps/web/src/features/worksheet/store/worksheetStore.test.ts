/**
 * Store tests. `loadRules` takes the repository as an argument, so the API-layer
 * failure paths are covered with plain fakes — no module mocking.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useWorksheetStore } from './worksheetStore'
import { DEFAULT_INPUT } from '../../../mocks/supportFixtures'
import { createStaticRulesRepository } from '../../../services/rules/staticRulesRepository'
import type { RulesRepository } from '../../../services/rules'
import type { SupportRuleSet } from '../../../types/rules'

const initial = useWorksheetStore.getState()

beforeEach(() => {
  useWorksheetStore.setState({
    ...initial,
    input: structuredClone(DEFAULT_INPUT),
    rules: null,
    status: 'idle',
    error: null,
  })
})

describe('input actions', () => {
  it('updates an income cell without disturbing the other party', () => {
    useWorksheetStore.getState().setIncome('gross', 'a', 5200)
    const income = useWorksheetStore.getState().input.income
    expect(income.gross.a).toBe(5200)
    expect(income.gross.b).toBe(15000)
  })

  it('creates an income line that did not exist yet', () => {
    useWorksheetStore.getState().setIncome('bonus', 'b', 300)
    expect(useWorksheetStore.getState().input.income.bonus).toEqual({ a: 0, b: 300 })
  })

  it('updates overnights', () => {
    useWorksheetStore.getState().setNights('b', 200)
    expect(useWorksheetStore.getState().input.parentingTime.b).toBe(200)
  })

  it('keeps an out-of-range overnight count exactly as entered', () => {
    // Deliberately unclamped: `validateWorksheet` needs to see what the user actually
    // typed, and clamping here is what previously made the field and the store disagree
    // silently. Range enforcement is a validation concern, not a storage one.
    useWorksheetStore.getState().setNights('a', 900)
    expect(useWorksheetStore.getState().input.parentingTime.a).toBe(900)

    useWorksheetStore.getState().setNights('b', 366)
    expect(useWorksheetStore.getState().input.parentingTime.b).toBe(366)
  })

  it('keeps a negative overnight count so it can be reported', () => {
    useWorksheetStore.getState().setNights('a', -5)
    expect(useWorksheetStore.getState().input.parentingTime.a).toBe(-5)
  })

  it('ignores non-finite overnight values', () => {
    useWorksheetStore.getState().setNights('a', Number.NaN)
    expect(useWorksheetStore.getState().input.parentingTime.a).toBe(0)
    useWorksheetStore.getState().setNights('b', Number.POSITIVE_INFINITY)
    expect(useWorksheetStore.getState().input.parentingTime.b).toBe(0)
  })

  it('updates children count and add-ons', () => {
    useWorksheetStore.getState().setChildrenCount(3)
    useWorksheetStore.getState().setAddOn('childcare', 900)
    const s = useWorksheetStore.getState().input
    expect(s.childrenCount).toBe(3)
    expect(s.addOns.childcare.amount).toBe(900)
  })

  it('attributes an add-on to a parent and clears it again', () => {
    useWorksheetStore.getState().setAddOnPayer('childcare', 'b')
    expect(useWorksheetStore.getState().input.addOns.childcare.paidBy).toBe('b')

    // Omitting the party clears the attribution back to shared. The key must actually be
    // gone, not present-and-undefined, so the stored object matches the optional-prop type.
    useWorksheetStore.getState().setAddOnPayer('childcare')
    const entry = useWorksheetStore.getState().input.addOns.childcare
    expect(entry.paidBy).toBeUndefined()
    expect('paidBy' in entry).toBe(false)
  })

  it('preserves attribution when the amount changes, and vice versa', () => {
    useWorksheetStore.getState().setAddOnPayer('healthInsurance', 'a')
    useWorksheetStore.getState().setAddOn('healthInsurance', 310)
    const entry = useWorksheetStore.getState().input.addOns.healthInsurance
    expect(entry).toEqual({ amount: 310, paidBy: 'a' })
  })

  it('renames a party', () => {
    useWorksheetStore.getState().setPartyName('a', 'Sam')
    expect(useWorksheetStore.getState().input.parties.a.name).toBe('Sam')
  })

  it('resets back to the seed worksheet', () => {
    useWorksheetStore.getState().setChildrenCount(6)
    useWorksheetStore.getState().reset()
    expect(useWorksheetStore.getState().input.childrenCount).toBe(
      DEFAULT_INPUT.childrenCount,
    )
  })
})

describe('loadRules', () => {
  it('loads through an injected repository and marks ready', async () => {
    await useWorksheetStore.getState().loadRules(createStaticRulesRepository())
    const s = useWorksheetStore.getState()
    expect(s.status).toBe('ready')
    expect(s.rules?.jurisdiction.code).toBe('CO')
    expect(s.error).toBeNull()
  })

  it('captures a repository failure instead of throwing', async () => {
    const failing: RulesRepository = {
      getRuleSet: () => Promise.reject(new Error('statute service unavailable')),
    }
    await useWorksheetStore.getState().loadRules(failing)
    const s = useWorksheetStore.getState()
    expect(s.status).toBe('error')
    expect(s.rules).toBeNull()
    expect(s.error).toMatch(/statute service unavailable/)
  })

  it('does not start a second load while one is in flight', async () => {
    let calls = 0
    const slow: RulesRepository = {
      getRuleSet: () => {
        calls += 1
        return new Promise<SupportRuleSet>((resolve) => {
          setTimeout(
            () => resolve(createStaticRulesRepository().getRuleSet({ jurisdiction: 'CO' })),
            5,
          )
        })
      },
    }
    const first = useWorksheetStore.getState().loadRules(slow)
    await useWorksheetStore.getState().loadRules(slow)
    await first
    expect(calls).toBe(1)
  })
})
