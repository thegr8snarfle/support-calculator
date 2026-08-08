/**
 * Regression guard: the provider's action callbacks must keep a stable identity.
 *
 * `useWorksheetStatus` calls `setStepStatus` from an effect keyed on it. When the
 * provider rebuilt its callbacks each render, that looped forever ("Maximum update
 * depth exceeded") — and the e2e suite still passed, so only this catches it.
 */
import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { StepFlowProvider } from './StepFlowProvider'
import { useStepFlow } from './useStepFlow'

const wrapper = ({ children }: { children: ReactNode }) => (
  <StepFlowProvider>{children}</StepFlowProvider>
)

describe('StepFlowProvider', () => {
  it('keeps action identities stable across state changes', () => {
    const { result } = renderHook(() => useStepFlow(), { wrapper })
    const first = {
      goTo: result.current.goTo,
      next: result.current.next,
      back: result.current.back,
      setStepStatus: result.current.setStepStatus,
      clearPendingScroll: result.current.clearPendingScroll,
    }

    act(() => result.current.setStepStatus('worksheet', 'complete'))

    expect(result.current.steps[0].status).toBe('complete')
    expect(result.current.goTo).toBe(first.goTo)
    expect(result.current.next).toBe(first.next)
    expect(result.current.back).toBe(first.back)
    expect(result.current.setStepStatus).toBe(first.setStepStatus)
    expect(result.current.clearPendingScroll).toBe(first.clearPendingScroll)
  })

  it('does not re-render endlessly when an effect sets status', () => {
    let renders = 0
    const { result } = renderHook(
      () => {
        renders += 1
        return useStepFlow()
      },
      { wrapper },
    )

    act(() => result.current.setStepStatus('worksheet', 'complete'))
    // Setting the same status again must be a no-op-ish, not a cascade.
    act(() => result.current.setStepStatus('worksheet', 'complete'))

    expect(renders).toBeLessThan(10)
  })

  it('exposes the advance gate', () => {
    const { result } = renderHook(() => useStepFlow(), { wrapper })
    expect(result.current.canAdvance).toBe(false)

    act(() => result.current.next())
    expect(result.current.current).toBe('worksheet')

    act(() => result.current.setStepStatus('worksheet', 'complete'))
    expect(result.current.canAdvance).toBe(true)

    act(() => result.current.next())
    expect(result.current.current).toBe('review')
  })
})
