/**
 * Static adapter: serves rule sets from JSON bundled with the app.
 *
 * No network, works offline (the desktop/iOS builds ship the same bundle). Payloads
 * still go through `parseRuleSet`, so the validation path is identical to a remote
 * source. Results are cached per jurisdiction+vintage after first validation, since
 * validating an 800-row schedule is not free.
 */
import coloradoRuleSet2026 from './data/co/2026.json'
import { parseRuleSet } from './ruleSetSchema'
import { RuleSetNotFoundError, type RulesRepository, type RuleSetQuery } from './rulesRepository'
import type { SupportRuleSet } from '../../types/rules'

/** Every bundled rule set, newest first within a jurisdiction. */
const BUNDLED: Record<string, unknown[]> = {
  CO: [coloradoRuleSet2026],
}

function effectiveFrom(raw: unknown): string {
  const eff = (raw as { effective?: { from?: string } }).effective
  return eff?.from ?? ''
}

export function createStaticRulesRepository(
  bundles: Record<string, unknown[]> = BUNDLED,
): RulesRepository {
  const cache = new Map<string, SupportRuleSet>()

  return {
    async getRuleSet(query: RuleSetQuery): Promise<SupportRuleSet> {
      const code = query.jurisdiction.toUpperCase()
      const on = query.effectiveOn ?? new Date().toISOString().slice(0, 10)
      const key = `${code}@${on}`

      const cached = cache.get(key)
      if (cached) return cached

      const candidates = bundles[code]
      if (!candidates || candidates.length === 0) throw new RuleSetNotFoundError(query)

      // Pick the newest vintage that had taken effect on the requested date.
      const applicable = candidates
        .filter((r) => effectiveFrom(r) <= on)
        .sort((a, b) => effectiveFrom(b).localeCompare(effectiveFrom(a)))[0]

      if (!applicable) throw new RuleSetNotFoundError(query)

      const parsed = parseRuleSet(applicable)
      cache.set(key, parsed)
      return parsed
    },
  }
}
