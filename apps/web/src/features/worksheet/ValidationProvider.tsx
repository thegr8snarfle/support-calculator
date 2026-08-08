/**
 * Runs worksheet validation once and shares the result with the whole component graph.
 *
 * Mount this **inside `StepFlowProvider`** and around anything that renders a worksheet step
 * — `App.tsx` wraps `AppShell` with it. It cannot live inside `WorksheetPage`, because
 * `ReviewPage` and `ResultsPage` also call `useSupportEstimate`, and that hook is a consumer.
 *
 * The dependency graph here is acyclic, which is what lets everything settle in a single
 * top-down render pass with no synchronising effect: validation depends only on
 * `(input, rules)`, and nothing it depends on depends back on it.
 *
 *     worksheetStore (input, rules)
 *             ↓
 *     ValidationProvider ──→ ValidationContext
 *             ↓                     ↓
 *     useSupportEstimate      components (fields, summary, rail)
 *             ↓
 *     useWorksheetStatus
 *             ↓ (existing SET_STATUS effect)
 *     stepFlow reducer → canAdvance
 */
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { errorsByField, validateWorksheet } from '../../domain/support'
import { useWorksheetStore } from './store/worksheetStore'
import { ValidationContext, type WorksheetValidation } from './hooks/useValidation'

/** Nothing to validate against before the statute loads; also the shape used on error. */
const NO_ERRORS: WorksheetValidation = { errors: [], fieldErrors: {}, hasErrors: false }

export function ValidationProvider({ children }: { children: ReactNode }) {
  // Subscribe to the two things validation derives from. Zustand is an external store, not
  // context, so this provider does not care whether `useRules()` has run yet.
  const input = useWorksheetStore((s) => s.input)
  const rules = useWorksheetStore((s) => s.rules)

  const value = useMemo<WorksheetValidation>(() => {
    // Before the rule set resolves there are no bounds to check against — every limit is
    // statute data. Reporting "no errors" here is correct rather than optimistic, because
    // `useSupportEstimate` independently returns a null estimate until `rules` exists, so
    // nothing can advance on the strength of this.
    if (!rules) return NO_ERRORS

    const errors = validateWorksheet(input, rules)

    return {
      errors,
      fieldErrors: errorsByField(errors),
      hasErrors: errors.length > 0,
    }
  }, [input, rules])

  // No `useCallback` needed on anything in `value`: unlike `StepFlow` it carries no
  // callbacks, so there is no identity that consumers could put in an effect dependency
  // array and loop on. `hasErrors` is a boolean and therefore value-stable.
  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>
}
