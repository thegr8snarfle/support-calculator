import { useCallback, useReducer } from 'react'
import type { ReactNode } from 'react'
import {
  STEP_ORDER,
  canAdvance,
  canGoTo,
  initialStepFlow,
  stepFlowReducer,
  type Step,
  type StepStatus,
} from './stepFlow'
import { StepFlowContext, type StepFlow } from './useStepFlow'

/**
 * Provides the guided-flow state to the app. Wrap the root in this.
 *
 * The action callbacks are memoized (and the context value with them) because
 * consumers put them in effect dependency arrays — `useWorksheetStatus` calls
 * `setStepStatus` from an effect, so an identity that changed on every render would
 * loop forever ("Maximum update depth exceeded").
 */
export function StepFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(stepFlowReducer, initialStepFlow)
  const i = STEP_ORDER.indexOf(state.current)

  // `dispatch` is stable, so each of these is created once.
  const goTo = useCallback(
    (step: Step, scrollTarget?: string) => dispatch({ type: 'GOTO', step, scrollTarget }),
    [],
  )
  const next = useCallback(() => dispatch({ type: 'NEXT' }), [])
  const back = useCallback(() => dispatch({ type: 'BACK' }), [])
  const setStepStatus = useCallback(
    (step: Step, status: StepStatus) => dispatch({ type: 'SET_STATUS', step, status }),
    [],
  )
  const clearPendingScroll = useCallback(() => dispatch({ type: 'CLEAR_SCROLL' }), [])

  // The value object itself may be rebuilt per render — only the callbacks need a
  // stable identity, since those are what consumers put in effect dependencies.
  const value: StepFlow = {
    current: state.current,
    steps: STEP_ORDER.map((id) => state.steps[id]),
    goTo,
    next,
    back,
    isFirst: i === 0,
    isLast: i === STEP_ORDER.length - 1,
    canAdvance: canAdvance(state),
    canGoTo: (step: Step) => canGoTo(state, step),
    setStepStatus,
    pendingScroll: state.pendingScroll,
    clearPendingScroll,
  }

  return <StepFlowContext.Provider value={value}>{children}</StepFlowContext.Provider>
}
