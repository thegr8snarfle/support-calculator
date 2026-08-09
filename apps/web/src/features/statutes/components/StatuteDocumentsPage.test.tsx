import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StatuteDocumentsPage } from './StatuteDocumentsPage'
import { useWorksheetStore } from '../../worksheet/store/worksheetStore'
import { STATUTE_DOCUMENTS } from '../../../services/statutes'

const initial = useWorksheetStore.getState()

beforeEach(() => {
  useWorksheetStore.setState({ ...initial, rules: null, status: 'idle', error: null })
})

describe('StatuteDocumentsPage', () => {
  it('lists every curated document', () => {
    render(<StatuteDocumentsPage onBack={() => {}} />)
    for (const document of STATUTE_DOCUMENTS) {
      expect(screen.getByText(document.title)).toBeInTheDocument()
    }
  })

  it('calls onBack when "Back to worksheet" is clicked', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<StatuteDocumentsPage onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: 'Back to worksheet' }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
