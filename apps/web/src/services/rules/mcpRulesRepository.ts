/**
 * Remote adapter (**not yet active**) — the reason the port is async.
 *
 * The intended future source is an MCP server doing RAG over statute text, so the
 * app can pick up amendments (like HB 25-1159, which replaced Colorado's whole
 * parenting-time framework mid-2026) without shipping a new build.
 *
 * This file exists to prove the port is genuinely swappable and to hold the design
 * notes; it deliberately ships inert rather than half-implemented:
 *
 * - The response is untrusted, so it goes through the **same** `parseRuleSet` the
 *   bundled data does. A remote source must never bypass validation.
 * - Statute data is legally consequential: a partial or hallucinated rule set must
 *   fail loudly, never fall back silently to a stale local copy. Any fallback belongs
 *   at the call site, as an explicit, visible decision.
 * - Add caching/retry here (not in the engine) when it lands.
 */
import { parseRuleSet } from './ruleSetSchema'
import type { RulesRepository, RuleSetQuery } from './rulesRepository'
import type { SupportRuleSet } from '../../types/rules'

export type McpRulesRepositoryConfig = {
  /** Base URL of the MCP server exposing the statute corpus. */
  endpoint: string
  /** Optional per-request timeout in ms. */
  timeoutMs?: number
}

export function createMcpRulesRepository(config: McpRulesRepositoryConfig): RulesRepository {
  return {
    async getRuleSet(query: RuleSetQuery): Promise<SupportRuleSet> {
      throw new Error(
        `MCP rules source is not implemented yet (endpoint "${config.endpoint}", ` +
          `requested "${query.jurisdiction}"). Use the static repository until the ` +
          `server exists; responses must still be run through parseRuleSet().`,
      )
      // Shape the implementation will take:
      //   const raw = await callMcpTool(config, 'get_support_rule_set', query)
      //   return parseRuleSet(raw)
    },
  }
}

// Referenced so the validation contract above is a compile-time fact, not a comment.
void parseRuleSet
