/**
 * Store tests. `loadRules` takes the repository as an argument, so the API-layer
 * failure paths are covered with plain fakes — no module mocking.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useWorksheetStore } from './worksheetStore'
import { SAMPLE_WORKSHEET } from '../../../mocks/supportFixtures'
import { createStaticRulesRepository } from '../../../services/rules/staticRulesRepository'
import type { RulesRepository } from '../../../services/rules'
import type { SupportRuleSet } from '../../../types/rules'

const initial = useWorksheetStore.getState()

beforeEach(() => {
  useWorksheetStore.setState({
    ...initial,
    input: structuredClone(SAMPLE_WORKSHEET),
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
    expect(income.gross.b).toBe(6500)
  })

  it('creates an income line that did not exist yet', () => {
    useWorksheetStore.getState().setIncome('bonus', 'b', 300)
    expect(useWorksheetStore.getState().input.income.bonus).toEqual({ a: 0, b: 300 })
  })

  it('updates overnights and clamps negatives to zero', () => {
    useWorksheetStore.getState().setNights('b', 200)
    expect(useWorksheetStore.getState().input.parentingTime.b).toBe(200)
    useWorksheetStore.getState().setNights('b', -5)
    expect(useWorksheetStore.getState().input.parentingTime.b).toBe(0)
  })

  it('updates children count and add-ons', () => {
    useWorksheetStore.getState().setChildrenCount(3)
    useWorksheetStore.getState().setAddOn('childcare', 900)
    const s = useWorksheetStore.getState().input
    expect(s.childrenCount).toBe(3)
    expect(s.addOns.childcare).toBe(900)
  })

  it('renames a party', () => {
    useWorksheetStore.getState().setPartyName('a', 'Sam')
    expect(useWorksheetStore.getState().input.parties.a.name).toBe('Sam')
  })

  it('resets back to the seed worksheet', () => {
    useWorksheetStore.getState().setChildrenCount(6)
    useWorksheetStore.getState().reset()
    expect(useWorksheetStore.getState().input.childrenCount).toBe(
      SAMPLE_WORKSHEET.childrenCount,
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
