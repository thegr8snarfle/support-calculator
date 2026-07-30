/**
 * Pure, React-free model for the guided support flow. Kept separate from the hook
 * so it can be unit-tested directly (Vitest, when it lands). The reducer is the single
 * place progression rules live — future gates (e.g. `canAdvance` driven by validation
 * `status`) belong here, not in the components.
 */

/** A step in the guided flow. */
export type Step = 'worksheet' | 'review' | 'results'

/** Order the flow advances in; drives `next` / `back`. */
export const STEP_ORDER: Step[] = ['worksheet', 'review', 'results']

/**
 * Per-step validation / completion state. A deliberate seam: today every step is
 * 'incomplete', but the input + calculation layer will move steps to 'complete' /
 * 'error' via the SET_STATUS action.
 */
export type StepStatus = 'incomplete' | 'complete' | 'error'

export type StepMeta = {
  id: Step
  label: string
  status: StepStatus
}

export type StepFlowState = {
  current: Step
  /** Metadata per step, keyed by id — grows as the flow tracks more per-step state. */
  steps: Record<Step, StepMeta>
  /** Section id to scroll to after the next render (e.g. an "Edit" jump), or null. */
  pendingScroll: string | null
}

export const initialStepFlow: StepFlowState = {
  current: 'worksheet',
  steps: {
    worksheet: { id: 'worksheet', label: 'Worksheet', status: 'incomplete' },
    review: { id: 'review', label: 'Review', status: 'incomplete' },
    results: { id: 'results', label: 'Results', status: 'incomplete' },
  },
  pendingScroll: null,
}

export type StepFlowAction =
  | { type: 'GOTO'; step: Step; scrollTarget?: string }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_STATUS'; step: Step; status: StepStatus }
  | { type: 'CLEAR_SCROLL' }

/** Move `delta` places along STEP_ORDER from `current`, clamped to the ends. */
function shift(current: Step, delta: number): Step {
  const i = STEP_ORDER.indexOf(current)
  const next = Math.min(STEP_ORDER.length - 1, Math.max(0, i + delta))
  return STEP_ORDER[next]
}

export function stepFlowReducer(state: StepFlowState, action: StepFlowAction): StepFlowState {
  switch (action.type) {
    case 'GOTO':
      return { ...state, current: action.step, pendingScroll: action.scrollTarget ?? null }
    case 'NEXT':
      return { ...state, current: shift(state.current, 1), pendingScroll: null }
    case 'BACK':
      return { ...state, current: shift(state.current, -1), pendingScroll: null }
    case 'SET_STATUS':
      return {
        ...state,
        steps: {
          ...state.steps,
          [action.step]: { ...state.steps[action.step], status: action.status },
        },
      }
    case 'CLEAR_SCROLL':
      return state.pendingScroll === null ? state : { ...state, pendingScroll: null }
    default:
      return state
  }
}
