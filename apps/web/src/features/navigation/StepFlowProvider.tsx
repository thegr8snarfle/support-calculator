import { useReducer } from 'react'
import type { ReactNode } from 'react'
import { STEP_ORDER, initialStepFlow, stepFlowReducer } from './stepFlow'
import { StepFlowContext, type StepFlow } from './useStepFlow'

/**
 * Provides the guided-flow state to the app. Wrap the root in this. The value is
 * rebuilt only when the reducer state changes (the provider has no other state), so
 * no manual memoization is needed.
 */
export function StepFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(stepFlowReducer, initialStepFlow)
  const i = STEP_ORDER.indexOf(state.current)

  const value: StepFlow = {
    current: state.current,
    steps: STEP_ORDER.map((id) => state.steps[id]),
    goTo: (step, scrollTarget) => dispatch({ type: 'GOTO', step, scrollTarget }),
    next: () => dispatch({ type: 'NEXT' }),
    back: () => dispatch({ type: 'BACK' }),
    isFirst: i === 0,
    isLast: i === STEP_ORDER.length - 1,
    setStepStatus: (step, status) => dispatch({ type: 'SET_STATUS', step, status }),
    pendingScroll: state.pendingScroll,
    clearPendingScroll: () => dispatch({ type: 'CLEAR_SCROLL' }),
  }

  return <StepFlowContext.Provider value={value}>{children}</StepFlowContext.Provider>
}
