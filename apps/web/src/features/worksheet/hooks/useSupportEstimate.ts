/**
 * The single seam where state meets the calculation engine.
 *
 * Selects the worksheet input and the loaded rule set from the store and runs the pure
 * engine, memoized on both. No calculation logic lives here — this hook only decides *when*
 * to call it, and (since validation landed) *whether* to.
 */
import { useMemo, useState } from 'react'
import { calculateChildSupport } from '../../../domain/support'
import type { SupportEstimate } from '../../../types/support'
import { useWorksheetStore } from '../store/worksheetStore'
import { useValidation } from './useValidation'

export type SupportEstimateResult = {
  /** `null` until the rule set has loaded, or until the first valid input. */
  estimate: SupportEstimate | null
  /**
   * True when `estimate` is a **frozen** earlier result being shown because the current
   * input has blocking errors. The UI must mark it visibly — a stale figure that looks live
   * is worse than no figure.
   */
  stale: boolean
  loading: boolean
  error: string | null
}

export function useSupportEstimate(): SupportEstimateResult {
  const input = useWorksheetStore((s) => s.input)
  const rules = useWorksheetStore((s) => s.rules)
  const status = useWorksheetStore((s) => s.status)
  const error = useWorksheetStore((s) => s.error)
  const { hasErrors } = useValidation()

  // Recompute only from input the validator has cleared. The engine is *total* — it returns
  // a figure for almost anything — so calling it on invalid input is exactly how 365/365
  // produced a confident $0.
  const fresh = useMemo(
    () => (rules && !hasErrors ? calculateChildSupport(input, rules) : null),
    [input, rules, hasErrors],
  )

  // Hold the last valid estimate so the rail can keep showing figures (marked stale) while
  // the user fixes a field, instead of collapsing to zeros and back.
  //
  // This is React's sanctioned "adjust state during render" pattern rather than a ref write
  // or an effect: React discards the in-progress render and immediately re-renders, so
  // nothing is committed and no second paint occurs. An effect here would violate
  // `react-hooks/set-state-in-effect` and risk the render loop that bit `StepFlowProvider`.
  const [lastValid, setLastValid] = useState<SupportEstimate | null>(null)
  if (fresh !== null && fresh !== lastValid) {
    setLastValid(fresh)
  }

  // While input is invalid, fall back to the frozen value — which is `null` if the user has
  // never had a valid worksheet, so nothing fabricated is ever shown.
  const estimate = fresh ?? lastValid

  return {
    estimate,
    stale: fresh === null && estimate !== null,
    loading: status === 'loading' || status === 'idle',
    error,
  }
}
