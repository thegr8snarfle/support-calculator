import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ActiveStatuteBadge } from './ActiveStatuteBadge'
import { useWorksheetStore } from '../../worksheet/store/worksheetStore'
import { createStaticRulesRepository } from '../../../services/rules/staticRulesRepository'

const initial = useWorksheetStore.getState()

beforeEach(() => {
  useWorksheetStore.setState({ ...initial, rules: null, status: 'idle', error: null })
})

describe('ActiveStatuteBadge', () => {
  it('renders nothing while rules are not loaded', () => {
    const { container } = render(<ActiveStatuteBadge />)
    expect(container).toBeEmptyDOMElement()
  })

  it('names the jurisdiction, citation, and effective date once rules load', async () => {
    await useWorksheetStore.getState().loadRules(createStaticRulesRepository())
    render(<ActiveStatuteBadge />)
    expect(screen.getByText(/Colorado/)).toBeInTheDocument()
    expect(screen.getByText(/C\.R\.S\. §14-10-115/)).toBeInTheDocument()
    expect(screen.getByText(/March 1, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/HB 25-1159/)).toBeInTheDocument()
  })
})
