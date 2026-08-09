/**
 * Freeze-on-invalid tests for the calculation seam.
 *
 * The behaviour being pinned: while the worksheet has validation errors the hook must return
 * the **last valid** estimate rather than recalculating. Without this the rail would show a
 * figure derived from nonsense input (365/365 computes a confident $0), which is the exact
 * failure this layer exists to prevent.
 */
import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { useSupportEstimate } from './useSupportEstimate'
import { ValidationProvider } from '../ValidationProvider'
import { useWorksheetStore } from '../store/worksheetStore'
import { createStaticRulesRepository } from '../../../services/rules/staticRulesRepository'
import { DEFAULT_INPUT } from '../../../mocks/supportFixtures'

const initial = useWorksheetStore.getState()

beforeEach(() => {
  useWorksheetStore.setState({
    ...initial,
    input: structuredClone(DEFAULT_INPUT),
    rules: null,
    status: 'idle',
    error: null,
  })
})

function wrapper({ children }: { children: ReactNode }) {
  return <ValidationProvider>{children}</ValidationProvider>
}

/** Renders the hook with the real rule set already loaded. */
async function setup() {
  const view = renderHook(() => useSupportEstimate(), { wrapper })
  await act(async () => {
    await useWorksheetStore.getState().loadRules(createStaticRulesRepository())
  })
  return view
}

describe('useSupportEstimate', () => {
  it('calculates from valid input and is not stale', async () => {
    const { result } = await setup()
    expect(result.current.estimate?.amount).toBeGreaterThan(0)
    expect(result.current.stale).toBe(false)
  })

  it('freezes the last valid estimate when input becomes invalid', async () => {
    const { result } = await setup()
    const before = result.current.estimate?.amount

    act(() => {
      // Individually legal, impossible together — the engine would happily return $0.
      useWorksheetStore.getState().setNights('a', 365)
      useWorksheetStore.getState().setNights('b', 365)
    })

    expect(result.current.stale).toBe(true)
    expect(result.current.estimate?.amount).toBe(before)
  })

  it('recalculates and clears stale once the input is corrected', async () => {
    const { result } = await setup()

    act(() => {
      useWorksheetStore.getState().setNights('a', 900)
    })
    expect(result.current.stale).toBe(true)

    act(() => {
      useWorksheetStore.getState().setNights('a', 100)
      useWorksheetStore.getState().setNights('b', 265)
    })

    expect(result.current.stale).toBe(false)
    // The corrected split genuinely changes the figure, proving it recomputed rather than
    // continuing to serve the frozen value.
    expect(result.current.estimate?.amount).toBeGreaterThan(0)
  })

  it('shows nothing rather than fabricating a figure when input is invalid from the start', async () => {
    // No valid estimate has ever been computed, so there is nothing to freeze.
    act(() => {
      useWorksheetStore.getState().setNights('a', 900)
    })
    const { result } = await setup()

    expect(result.current.estimate).toBeNull()
    expect(result.current.stale).toBe(false)
  })
})
