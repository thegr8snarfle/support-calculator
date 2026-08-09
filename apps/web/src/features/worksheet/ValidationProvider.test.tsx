/**
 * Contract tests for the validation context.
 *
 * These pin the two properties the design depends on and that nothing else would catch:
 * that `useValidation` fails loudly outside a provider (a silent fallback would report "no
 * errors" and re-open the gate this layer exists to close), and that one provider serves all
 * consumers from a single computation rather than re-validating per subscriber.
 *
 * Same spirit as `StepFlowProvider.test.tsx`: invariants that every visible assertion would
 * happily pass while being violated.
 */
import { render, screen, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ValidationProvider } from './ValidationProvider'
import { useValidation, type WorksheetValidation } from './hooks/useValidation'
import { useWorksheetStore } from './store/worksheetStore'
import { createStaticRulesRepository } from '../../services/rules/staticRulesRepository'
import { DEFAULT_INPUT } from '../../mocks/supportFixtures'

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

/** Loads the real rule set into the store, as `useRules` would. */
async function loadRules() {
  await act(async () => {
    await useWorksheetStore.getState().loadRules(createStaticRulesRepository())
  })
}

function Probe({ label }: { label: string }) {
  const validation = useValidation()
  seen.push(validation)
  return (
    <div>
      <span>{`${label}:${validation.errors.length}`}</span>
    </div>
  )
}

let seen: WorksheetValidation[] = []

beforeEach(() => {
  seen = []
})

describe('useValidation', () => {
  it('throws outside a provider rather than reporting a clean worksheet', () => {
    // Silence the error boundary noise React prints for the thrown render.
    expect(() => render(<Probe label="orphan" />)).toThrow(/within a ValidationProvider/)
  })
})

describe('ValidationProvider', () => {
  it('reports no errors before the rule set loads', () => {
    // Every bound is statute data, so there is nothing to validate against yet.
    render(
      <ValidationProvider>
        <Probe label="a" />
      </ValidationProvider>,
    )
    expect(screen.getByText('a:0')).toBeInTheDocument()
  })

  it('serves every consumer from one computation', async () => {
    await loadRules()
    // Two overnight values that are individually legal but impossible together.
    act(() => {
      useWorksheetStore.getState().setNights('a', 365)
      useWorksheetStore.getState().setNights('b', 365)
    })

    render(
      <ValidationProvider>
        <Probe label="a" />
        <Probe label="b" />
      </ValidationProvider>,
    )

    expect(screen.getByText('a:1')).toBeInTheDocument()
    expect(screen.getByText('b:1')).toBeInTheDocument()

    // Identity, not just equality: both consumers must have received the *same* object,
    // which is only true if `validateWorksheet` ran once for the pair.
    const [first, second] = seen
    expect(first).toBe(second)
  })

  it('clears errors once the input is corrected', async () => {
    await loadRules()
    act(() => {
      useWorksheetStore.getState().setNights('a', 900)
    })

    const { rerender } = render(
      <ValidationProvider>
        <Probe label="a" />
      </ValidationProvider>,
    )
    expect(screen.getByText('a:1')).toBeInTheDocument()

    act(() => {
      useWorksheetStore.getState().setNights('a', 219)
      useWorksheetStore.getState().setNights('b', 146)
    })
    rerender(
      <ValidationProvider>
        <Probe label="a" />
      </ValidationProvider>,
    )
    expect(screen.getByText('a:0')).toBeInTheDocument()
  })
})
