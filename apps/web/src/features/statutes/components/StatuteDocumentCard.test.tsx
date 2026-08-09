import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StatuteDocumentCard } from './StatuteDocumentCard'
import { STATUTE_DOCUMENTS } from '../../../services/statutes'
import type { DownloadService } from '../../../services/downloads'

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

  it('downloads the PDF through the injected download service, not a plain <a download>', async () => {
    const downloadFile = vi.fn().mockResolvedValue({ status: 'saved' })
    render(
      <StatuteDocumentCard
        document={document}
        downloadService={{ downloadFile } satisfies DownloadService}
      />,
    )

    // Tauri's webview treats `<a download>` as a silent no-op, so this must be a real
    // button dispatching through the service — see `services/downloads`.
    const button = screen.getByRole('button', { name: 'Download PDF' })
    await userEvent.click(button)

    expect(downloadFile).toHaveBeenCalledWith({
      url: document.file.path,
      filename: document.file.filename,
      mimeType: document.file.mimeType,
    })
  })

  it('surfaces a download error from the download service instead of failing silently', async () => {
    const downloadFile = vi.fn().mockResolvedValue({ status: 'error', message: 'Could not save the file.' })
    render(
      <StatuteDocumentCard
        document={document}
        downloadService={{ downloadFile } satisfies DownloadService}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Download PDF' }))

    expect(await screen.findByText('Could not save the file.')).toBeInTheDocument()
  })

  it('links out to the original source', () => {
    render(<StatuteDocumentCard document={document} />)
    const link = screen.getByRole('link', { name: 'View source' })
    expect(link).toHaveAttribute('href', document.source.url)
    expect(link).toHaveAttribute('target', '_blank')
  })
})
