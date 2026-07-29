import { createContext, useContext } from 'react'
import type { Step, StepMeta, StepStatus } from './stepFlow'

/**
 * The custom step-progression hook's public API. Components navigate and read flow
 * state through this; the reducer behind it (see stepFlow.ts) is where progression
 * rules live.
 */
export type StepFlow = {
  /** The step currently on screen. */
  current: Step
  /** Steps in flow order, with their metadata (label, validation status). */
  steps: StepMeta[]
  /** Jump to a step, optionally queuing a section id to scroll to after it renders. */
  goTo: (step: Step, scrollTarget?: string) => void
  /** Advance one step along the flow (clamped at the last). */
  next: () => void
  /** Go back one step along the flow (clamped at the first). */
  back: () => void
  isFirst: boolean
  isLast: boolean
  /** Set a step's validation/completion status (seam for the future input layer). */
  setStepStatus: (step: Step, status: StepStatus) => void
  /** Section id queued by `goTo`, to scroll to once the target view has rendered. */
  pendingScroll: string | null
  /** Clear the queued scroll target (call after handling it). */
  clearPendingScroll: () => void
}

export const StepFlowContext = createContext<StepFlow | null>(null)

/** Read and drive the guided flow. Must be used within a <StepFlowProvider>. */
export function useStepFlow(): StepFlow {
  const ctx = useContext(StepFlowContext)
  if (!ctx) throw new Error('useStepFlow must be used within a StepFlowProvider')
  return ctx
}
