/**
 * "Print" is `window.print()`, not a generated file (see the component's doc
 * comment) — jsdom's `window.print` is stubbed directly, the same way `URL.createObjectURL`
 * is stubbed in `browserDownloadService.test.ts`, since neither exists in jsdom by default.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { ResultsPage } from './ResultsPage'
import { ValidationProvider } from '../ValidationProvider'
import { StepFlowProvider } from '../../navigation'
import { useWorksheetStore } from '../store/worksheetStore'
import { createStaticRulesRepository } from '../../../services/rules/staticRulesRepository'
import { DEFAULT_INPUT } from '../../../mocks/supportFixtures'

const initial = useWorksheetStore.getState()

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ValidationProvider>
      <StepFlowProvider>{children}</StepFlowProvider>
    </ValidationProvider>
  )
}

/** Renders the page with valid input and the real rule set already loaded. */
async function setup() {
  useWorksheetStore.setState({
    ...initial,
    input: structuredClone(DEFAULT_INPUT),
    rules: null,
    status: 'idle',
    error: null,
  })
  await useWorksheetStore.getState().loadRules(createStaticRulesRepository())
  return render(<ResultsPage />, { wrapper })
}

describe('ResultsPage', () => {
  beforeEach(() => {
    window.print = vi.fn() as typeof window.print
  })

  it('prints via window.print() rather than a generated file', async () => {
    await setup()

    await userEvent.click(screen.getByRole('button', { name: 'Print' }))

    expect(window.print).toHaveBeenCalledOnce()
  })

  it('shows nothing under "Notes" until something is typed, then mirrors it for print', async () => {
    await setup()

    expect(screen.queryByText('Notes')).not.toBeInTheDocument()

    const notes = "Client asked that we flag the childcare line for renewal in June."
    await userEvent.type(screen.getByLabelText(/Notes for this export/i), notes)

    // React renders a controlled <textarea>'s value as a child text node too, so without
    // `selector` this would match both it and the print-only mirror paragraph below.
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(screen.getByText(notes, { selector: 'p' })).toBeInTheDocument()
  })
})
