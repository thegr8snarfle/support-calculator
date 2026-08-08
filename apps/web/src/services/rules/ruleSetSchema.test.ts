/**
 * The rule set is the app's trust boundary. These tests cover both the happy path
 * (the shipped Colorado data validates) and the rejection paths a remote MCP source
 * would exercise — malformed statute data must fail loudly, never partially load.
 */
import { describe, expect, it } from 'vitest'
import coloradoRuleSet from './data/co/2026.json'
import { parseRuleSet } from './ruleSetSchema'
import { createStaticRulesRepository } from './staticRulesRepository'
import { RuleSetNotFoundError } from './rulesRepository'

function validSet(): Record<string, unknown> {
  return structuredClone(coloradoRuleSet) as unknown as Record<string, unknown>
}

describe('parseRuleSet', () => {
  it('accepts the shipped Colorado rule set', () => {
    const parsed = parseRuleSet(validSet())
    expect(parsed.jurisdiction.code).toBe('CO')
    expect(parsed.schedule.rows).toHaveLength(800)
    expect(parsed.parentingTimeCredit.table).toHaveLength(367)
  })

  it('records provenance so figures can be audited', () => {
    const parsed = parseRuleSet(validSet())
    expect(parsed.source?.document).toContain('HB 25-1159')
    expect(parsed.citations.schedule).toContain('14-10-115')
  })

  it('rejects a non-object payload', () => {
    expect(() => parseRuleSet(null)).toThrow(/Invalid support rule set/)
    expect(() => parseRuleSet('nope')).toThrow(/Invalid support rule set/)
  })

  it('rejects a missing required section', () => {
    const bad = validSet()
    delete bad.schedule
    expect(() => parseRuleSet(bad)).toThrow(/schedule/)
  })

  it('rejects schedule rows with the wrong number of columns', () => {
    const bad = validSet() as unknown as {
      schedule: { rows: { combinedIncome: number; obligations: number[] }[] }
    }
    bad.schedule.rows[10].obligations = [1, 2, 3]
    expect(() => parseRuleSet(bad)).toThrow(/obligation columns/)
  })

  it('rejects an unsorted schedule', () => {
    const bad = validSet() as unknown as {
      schedule: { rows: { combinedIncome: number }[] }
    }
    bad.schedule.rows[5].combinedIncome = 999999
    expect(() => parseRuleSet(bad)).toThrow(/increasing combinedIncome/)
  })

  it('rejects an unsorted parenting-time table', () => {
    const bad = validSet() as unknown as {
      parentingTimeCredit: { table: { overnights: number }[] }
    }
    bad.parentingTimeCredit.table[5].overnights = 999
    expect(() => parseRuleSet(bad)).toThrow(/increasing overnights/)
  })

  it('rejects an out-of-range credit percentage', () => {
    const bad = validSet() as unknown as {
      parentingTimeCredit: { table: { creditPct: number }[] }
    }
    bad.parentingTimeCredit.table[3].creditPct = 140
    expect(() => parseRuleSet(bad)).toThrow(/Invalid support rule set/)
  })
})

describe('staticRulesRepository', () => {
  it('resolves the Colorado rule set', async () => {
    const repo = createStaticRulesRepository()
    const rules = await repo.getRuleSet({ jurisdiction: 'CO' })
    expect(rules.jurisdiction.code).toBe('CO')
  })

  it('is case-insensitive on the jurisdiction code', async () => {
    const repo = createStaticRulesRepository()
    await expect(repo.getRuleSet({ jurisdiction: 'co' })).resolves.toBeDefined()
  })

  it('caches after the first validation', async () => {
    const repo = createStaticRulesRepository()
    const a = await repo.getRuleSet({ jurisdiction: 'CO', effectiveOn: '2026-06-01' })
    const b = await repo.getRuleSet({ jurisdiction: 'CO', effectiveOn: '2026-06-01' })
    expect(a).toBe(b)
  })

  it('throws RuleSetNotFoundError for an unknown jurisdiction', async () => {
    const repo = createStaticRulesRepository()
    await expect(repo.getRuleSet({ jurisdiction: 'ZZ' })).rejects.toBeInstanceOf(
      RuleSetNotFoundError,
    )
  })

  it('does not serve a vintage that had not taken effect yet', async () => {
    const repo = createStaticRulesRepository()
    await expect(
      repo.getRuleSet({ jurisdiction: 'CO', effectiveOn: '2020-01-01' }),
    ).rejects.toBeInstanceOf(RuleSetNotFoundError)
  })
})
