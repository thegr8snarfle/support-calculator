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
 * Per-step validation / completion state, driven by the input + calculation layer
 * via the SET_STATUS action (see `features/worksheet/hooks/useWorksheetStatus`).
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

/**
 * Whether the flow may move forward from `from`.
 *
 * Advancing past the Worksheet requires it to be both filled in and valid — a Review or
 * Results page built from either an incomplete or an invalid worksheet presents a figure
 * that looks authoritative but isn't.
 *
 * `'error'` **blocks**. It previously did not, on the reasoning that the estimate was still
 * meaningful and an inline warning was kinder than trapping the user. That reasoning was
 * built around overnights not totalling 365 — which turned out not to be a warning at all:
 * 365 and 365 computes a confident $0. Status now carries only blocking validation errors
 * (engine warnings no longer reach it), so nothing merely informative is caught here.
 *
 * Moving backward is always allowed.
 *
 * @param state - Current flow state.
 * @param from - Step to advance from; defaults to the current step.
 * @returns Whether progression is permitted.
 */
export function canAdvance(state: StepFlowState, from: Step = state.current): boolean {
  if (from === 'worksheet') return state.steps.worksheet.status === 'complete'
  return true
}

/** Whether a given step may be jumped to directly (the header chips). */
export function canGoTo(state: StepFlowState, target: Step): boolean {
  const targetIndex = STEP_ORDER.indexOf(target)
  const currentIndex = STEP_ORDER.indexOf(state.current)
  if (targetIndex <= currentIndex) return true
  return canAdvance(state, 'worksheet')
}

export function stepFlowReducer(state: StepFlowState, action: StepFlowAction): StepFlowState {
  switch (action.type) {
    case 'GOTO':
      if (!canGoTo(state, action.step)) return state
      return { ...state, current: action.step, pendingScroll: action.scrollTarget ?? null }
    case 'NEXT':
      if (!canAdvance(state)) return state
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
