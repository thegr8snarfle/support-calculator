/**
 * Feeds worksheet validity into the step flow.
 *
 * `stepFlow.ts` has always modeled per-step `status` and a `SET_STATUS` action as a
 * seam for "the input + calculation layer" — this is that layer. The derivation
 * lives here; the *progression rules* stay in the reducer, which is what the
 * navigation module's own note asks for ("future gates belong here, not in the
 * components").
 */
import { useEffect } from 'react'
import { useStepFlow } from '../../navigation'
import type { StepStatus } from '../../navigation'
import type { SupportEstimate } from '../../../types/support'

/** Pure mapping from an estimate to the Worksheet step's status. */
export function worksheetStatus(estimate: SupportEstimate | null): StepStatus {
  if (!estimate || estimate.incomplete) return 'incomplete'
  return estimate.warnings.length > 0 ? 'error' : 'complete'
}

/** Keeps the Worksheet step's status in sync with the current estimate. */
export function useWorksheetStatus(estimate: SupportEstimate | null): StepStatus {
  const { setStepStatus } = useStepFlow()
  const status = worksheetStatus(estimate)

  useEffect(() => {
    setStepStatus('worksheet', status)
  }, [status, setStepStatus])

  return status
}
