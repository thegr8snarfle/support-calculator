/**
 * Public API of the rules data layer.
 *
 * Consumers depend on the {@link RulesRepository} port and the factory below — never
 * on a concrete adapter — so swapping the static source for a remote MCP one is a
 * one-line change here.
 */
import { createStaticRulesRepository } from './staticRulesRepository'
import { createMcpRulesRepository } from './mcpRulesRepository'
import type { RulesRepository } from './rulesRepository'

export type { RulesRepository, RuleSetQuery } from './rulesRepository'
export { RuleSetNotFoundError } from './rulesRepository'
export { parseRuleSet, ruleSetSchema } from './ruleSetSchema'
export { createStaticRulesRepository } from './staticRulesRepository'
export { createMcpRulesRepository } from './mcpRulesRepository'

export type RulesSourceConfig =
  | { kind: 'static' }
  | { kind: 'mcp'; endpoint: string; timeoutMs?: number }

/**
 * Build the repository for a given source config. Pure `(config) => repository`,
 * mirroring `loadAppConfig`'s shape so wiring stays declarative and testable.
 */
export function createRulesRepository(
  config: RulesSourceConfig = { kind: 'static' },
): RulesRepository {
  switch (config.kind) {
    case 'mcp':
      return createMcpRulesRepository({
        endpoint: config.endpoint,
        timeoutMs: config.timeoutMs,
      })
    case 'static':
    default:
      return createStaticRulesRepository()
  }
}

/** The app-wide default repository (bundled statute data). */
export const defaultRulesRepository: RulesRepository = createRulesRepository()

/** Jurisdiction the app ships rules for today. */
export const DEFAULT_JURISDICTION = 'CO'
