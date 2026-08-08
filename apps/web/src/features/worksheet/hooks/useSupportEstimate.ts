/**
 * The single seam where state meets the calculation engine.
 *
 * Selects the worksheet input and the loaded rule set from the store and runs the
 * pure engine, memoized on both. No calculation logic lives here — this hook only
 * decides *when* to call it.
 */
import { useMemo } from 'react'
import { calculateChildSupport } from '../../../domain/support'
import type { SupportEstimate } from '../../../types/support'
import { useWorksheetStore } from '../store/worksheetStore'

export type SupportEstimateResult = {
  /** `null` until the rule set has loaded. */
  estimate: SupportEstimate | null
  loading: boolean
  error: string | null
}

export function useSupportEstimate(): SupportEstimateResult {
  const input = useWorksheetStore((s) => s.input)
  const rules = useWorksheetStore((s) => s.rules)
  const status = useWorksheetStore((s) => s.status)
  const error = useWorksheetStore((s) => s.error)

  const estimate = useMemo(
    () => (rules ? calculateChildSupport(input, rules) : null),
    [input, rules],
  )

  return { estimate, loading: status === 'loading' || status === 'idle', error }
}
