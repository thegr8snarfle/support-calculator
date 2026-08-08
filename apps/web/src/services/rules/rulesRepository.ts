/**
 * The rules **port** — the seam between the business layer and wherever statute data
 * actually lives.
 *
 * Deliberately `async` even though today's only adapter reads bundled JSON: when the
 * rule set later comes from a remote MCP server (RAG over statute text), the adapter
 * swaps and **no call site changes**. Nothing above this interface may assume the
 * data is local, synchronous, or trusted.
 */
import type { SupportRuleSet } from '../../types/rules'

export type RuleSetQuery = {
  /** Jurisdiction code, e.g. `"CO"`. */
  jurisdiction: string
  /** ISO date; selects the rule vintage in effect on that date. Defaults to today. */
  effectiveOn?: string
}

export type RulesRepository = {
  getRuleSet(query: RuleSetQuery): Promise<SupportRuleSet>
}

/** Thrown when no rule set matches the query, so callers can distinguish it. */
export class RuleSetNotFoundError extends Error {
  constructor(query: RuleSetQuery) {
    super(
      `No support rule set for jurisdiction "${query.jurisdiction}"` +
        (query.effectiveOn ? ` effective on ${query.effectiveOn}` : ''),
    )
    this.name = 'RuleSetNotFoundError'
  }
}
