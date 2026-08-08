/**
 * Feeds worksheet validity into the step flow.
 *
 * `stepFlow.ts` has always modeled per-step `status` and a `SET_STATUS` action as a seam for
 * "the input + calculation layer" — this is that layer. The derivation lives here; the
 * *progression rules* stay in the reducer, which is what the navigation module's own note
 * asks for ("future gates belong here, not in the components").
 *
 * This is the **push** half of how validation reaches navigation. Components read errors
 * synchronously via `useValidation()` (the pull half); the reducer only ever learns about
 * them through the `SET_STATUS` dispatch below.
 */
import { useEffect } from 'react'
import { useStepFlow } from '../../navigation'
import type { StepStatus } from '../../navigation'
import type { SupportEstimate } from '../../../types/support'
import { useValidation } from './useValidation'

/**
 * Pure mapping from an estimate plus validity to the Worksheet step's status.
 *
 * Kept pure and exported so the mapping can be unit-tested without rendering.
 *
 * @param estimate - The current estimate, or `null` before the rule set loads.
 * @param hasErrors - Whether the input has blocking validation errors.
 * @returns The status to publish for the Worksheet step.
 */
export function worksheetStatus(
  estimate: SupportEstimate | null,
  hasErrors: boolean,
): StepStatus {
  // Errors outrank everything: a worksheet that cannot be calculated must not read as
  // complete, even if a frozen estimate is still on screen.
  if (hasErrors) return 'error'
  if (!estimate || estimate.incomplete) return 'incomplete'

  // Engine `warnings` deliberately do **not** map to 'error' any more. They are the
  // informative-but-calculable cases (income above the schedule ceiling), and treating them
  // as errors is why `canAdvance` originally had to let 'error' through — which in turn is
  // how a 730-overnight worksheet reached Review.
  return 'complete'
}

/**
 * Keeps the Worksheet step's status in sync with the current estimate and validity.
 *
 * @param estimate - The current estimate from `useSupportEstimate`.
 * @returns The status just published, for callers that want to render from it.
 */
export function useWorksheetStatus(estimate: SupportEstimate | null): StepStatus {
  const { setStepStatus } = useStepFlow()
  const { hasErrors } = useValidation()
  const status = worksheetStatus(estimate, hasErrors)

  // `status` is a string and `setStepStatus` is memoized by the provider, so both
  // dependencies are stable by value — no update loop.
  useEffect(() => {
    setStepStatus('worksheet', status)
  }, [status, setStepStatus])

  return status
}
