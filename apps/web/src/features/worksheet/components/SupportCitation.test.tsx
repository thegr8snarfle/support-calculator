/**
 * Pins the fix that made this read from the loaded rule set instead of hardcoded
 * copy — see the component's doc comment for why that mattered.
 */
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SupportCitation } from './SupportCitation'
import { useWorksheetStore } from '../store/worksheetStore'
import { createStaticRulesRepository } from '../../../services/rules/staticRulesRepository'

const initial = useWorksheetStore.getState()

beforeEach(() => {
  useWorksheetStore.setState({ ...initial, rules: null, status: 'idle', error: null })
})

describe('SupportCitation', () => {
  it('renders a plain disclaimer before rules load', () => {
    render(<SupportCitation />)
    expect(screen.getByText(/Estimate only/)).toBeInTheDocument()
    expect(screen.queryByText(/C\.R\.S\./)).not.toBeInTheDocument()
  })

  it('cites the live statute and effective date once rules load', async () => {
    await useWorksheetStore.getState().loadRules(createStaticRulesRepository())
    render(<SupportCitation />)
    expect(screen.getByText(/C\.R\.S\. §14-10-115/)).toBeInTheDocument()
    expect(screen.getByText(/March 1, 2026/)).toBeInTheDocument()
  })
})
