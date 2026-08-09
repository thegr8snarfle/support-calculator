import { useActionState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Button } from '../../../components/ui/Button'
import { LinkButton } from '../../../components/ui/LinkButton'
import { FieldError } from '../../../components/ui/FieldError'
import { formatIsoDateLong } from '../../../lib/format'
import { humanizeCitationTopic } from '../citationTopicLabels'
import { defaultDownloadService, type DownloadService } from '../../../services/downloads'
import type { StatuteDocument } from '../../../types/statutes'

const ROLE_LABEL: Record<StatuteDocument['role'], string> = {
  'base-statute': 'Base statute',
  amendment: 'Amendment',
}

export type StatuteDocumentCardProps = {
  document: StatuteDocument
  /** Live citation strings from the loaded rule set, keyed by topic — undefined while rules are loading. */
  citations?: Record<string, string>
  /** Injected for tests; defaults to the runtime-appropriate (browser vs. Tauri) adapter. */
  downloadService?: DownloadService
}

type DownloadActionState = { error: string | null }

/**
 * One curated statute document: what it is, what it feeds in the calculation, and a
 * download.
 *
 * The download is a button, not a plain `<a download>` — Tauri's webview has no download
 * manager, so that attribute is a silent no-op there. `downloadService` fetches the bytes and
 * saves them the right way for the current runtime (see `services/downloads`).
 */
export function StatuteDocumentCard({
  document,
  citations,
  downloadService = defaultDownloadService,
}: StatuteDocumentCardProps) {
  const [downloadState, dispatchDownload, isDownloading] = useActionState(
    async (): Promise<DownloadActionState> => {
      const outcome = await downloadService.downloadFile({
        url: document.file.path,
        filename: document.file.filename,
        mimeType: document.file.mimeType,
      })
      return outcome.status === 'error' ? { error: outcome.message } : { error: null }
    },
    { error: null } satisfies DownloadActionState,
  )

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-[16px] m-0">{document.title}</h3>
            <Chip tone={document.role === 'amendment' ? 'accent' : 'neutral'}>
              {ROLE_LABEL[document.role]}
            </Chip>
          </div>
          <p className="mt-1 text-[14px] text-text-muted max-w-[60ch]">{document.description}</p>
        </div>
      </div>

      <div className="mt-3 text-[13px] text-text-subtle">
        Retrieved {formatIsoDateLong(document.source.retrieved)}
        {document.source.note && <> — {document.source.note}</>}
      </div>

      <div className="mt-3">
        <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-muted mb-1.5">
          Informs
        </div>
        <ul className="flex flex-col gap-1 m-0 p-0 list-none">
          {document.informsCitationTopics.map((topic) => (
            <li key={topic} className="flex items-baseline gap-2 text-[13px]">
              <Chip>{humanizeCitationTopic(topic)}</Chip>
              {citations?.[topic] && <code className="text-text-muted">{citations[topic]}</code>}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* `action` (not `onClick`) so React wraps the dispatch in a transition itself —
            calling `dispatchDownload()` from a plain onClick logs a dev warning and leaves
            `isDownloading` unreliable. `className="contents"` keeps the <form> from
            disrupting the flex row it sits in. */}
        <form action={dispatchDownload} className="contents">
          <Button type="submit" variant="secondary" disabled={isDownloading}>
            {isDownloading ? 'Downloading…' : 'Download PDF'}
          </Button>
        </form>
        <LinkButton variant="ghost" href={document.source.url} target="_blank" rel="noopener noreferrer">
          View source
        </LinkButton>
      </div>
      {downloadState.error && <FieldError className="mt-2">{downloadState.error}</FieldError>}
    </Card>
  )
}
