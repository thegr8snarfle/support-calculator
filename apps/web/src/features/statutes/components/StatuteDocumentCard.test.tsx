import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatuteDocumentCard } from './StatuteDocumentCard'
import { STATUTE_DOCUMENTS } from '../../../services/statutes'

const [document] = STATUTE_DOCUMENTS.filter((d) => d.id === 'co-hb25-1159-final-act')

describe('StatuteDocumentCard', () => {
  it('renders the title, description, and role', () => {
    render(<StatuteDocumentCard document={document} />)
    expect(screen.getByText(document.title)).toBeInTheDocument()
    expect(screen.getByText(document.description)).toBeInTheDocument()
    expect(screen.getByText('Amendment')).toBeInTheDocument()
  })

  it('lists the citation topics it informs, with the live citation text when provided', () => {
    render(
      <StatuteDocumentCard
        document={document}
        citations={{ schedule: 'C.R.S. §14-10-115(7)(b)' }}
      />,
    )
    expect(screen.getByText('Basic obligation schedule')).toBeInTheDocument()
    expect(screen.getByText('C.R.S. §14-10-115(7)(b)')).toBeInTheDocument()
  })

  it('offers a same-origin download link with the suggested filename', () => {
    render(<StatuteDocumentCard document={document} />)
    const link = screen.getByRole('link', { name: 'Download PDF' })
    expect(link).toHaveAttribute('href', document.file.path)
    expect(link).toHaveAttribute('download', document.file.filename)
  })

  it('links out to the original source', () => {
    render(<StatuteDocumentCard document={document} />)
    const link = screen.getByRole('link', { name: 'View source' })
    expect(link).toHaveAttribute('href', document.source.url)
    expect(link).toHaveAttribute('target', '_blank')
  })
})
