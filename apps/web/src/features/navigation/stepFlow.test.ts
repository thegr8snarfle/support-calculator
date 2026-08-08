import { describe, expect, it } from 'vitest'
import {
  canAdvance,
  canGoTo,
  initialStepFlow,
  stepFlowReducer,
  type StepFlowState,
} from './stepFlow'

function withWorksheet(status: StepFlowState['steps']['worksheet']['status']): StepFlowState {
  return {
    ...initialStepFlow,
    steps: {
      ...initialStepFlow.steps,
      worksheet: { ...initialStepFlow.steps.worksheet, status },
    },
  }
}

describe('navigation gates', () => {
  it('blocks advancing while the worksheet is incomplete', () => {
    expect(canAdvance(withWorksheet('incomplete'))).toBe(false)
    const next = stepFlowReducer(withWorksheet('incomplete'), { type: 'NEXT' })
    expect(next.current).toBe('worksheet')
  })

  it('allows advancing once the worksheet is complete', () => {
    const state = withWorksheet('complete')
    expect(canAdvance(state)).toBe(true)
    expect(stepFlowReducer(state, { type: 'NEXT' }).current).toBe('review')
  })

  it('treats warnings as non-blocking', () => {
    // "error" means e.g. overnights don't total 365 — the estimate is still useful,
    // so we surface the warning rather than trapping the user on the worksheet.
    expect(canAdvance(withWorksheet('error'))).toBe(true)
  })

  it('blocks jumping ahead but always allows going back', () => {
    const blocked = withWorksheet('incomplete')
    expect(canGoTo(blocked, 'results')).toBe(false)
    expect(stepFlowReducer(blocked, { type: 'GOTO', step: 'results' }).current).toBe('worksheet')

    const onResults = { ...withWorksheet('complete'), current: 'results' as const }
    expect(canGoTo(onResults, 'worksheet')).toBe(true)
    expect(stepFlowReducer(onResults, { type: 'GOTO', step: 'worksheet' }).current).toBe(
      'worksheet',
    )
  })

  it('BACK is never gated', () => {
    const onReview = { ...withWorksheet('incomplete'), current: 'review' as const }
    expect(stepFlowReducer(onReview, { type: 'BACK' }).current).toBe('worksheet')
  })

  it('SET_STATUS updates only the named step', () => {
    const next = stepFlowReducer(initialStepFlow, {
      type: 'SET_STATUS',
      step: 'worksheet',
      status: 'complete',
    })
    expect(next.steps.worksheet.status).toBe('complete')
    expect(next.steps.review.status).toBe('incomplete')
  })
})
