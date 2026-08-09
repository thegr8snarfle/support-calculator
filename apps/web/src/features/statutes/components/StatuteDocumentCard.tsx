import { Card } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { LinkButton } from '../../../components/ui/LinkButton'
import { formatIsoDateLong } from '../../../lib/format'
import { humanizeCitationTopic } from '../citationTopicLabels'
import type { StatuteDocument } from '../../../types/statutes'

const ROLE_LABEL: Record<StatuteDocument['role'], string> = {
  'base-statute': 'Base statute',
  amendment: 'Amendment',
}

export type StatuteDocumentCardProps = {
  document: StatuteDocument
  /** Live citation strings from the loaded rule set, keyed by topic — undefined while rules are loading. */
  citations?: Record<string, string>
}

/** One curated statute document: what it is, what it feeds in the calculation, and a download. */
export function StatuteDocumentCard({ document, citations }: StatuteDocumentCardProps) {
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
        <LinkButton
          variant="secondary"
          href={document.file.path}
          download={document.file.filename}
        >
          Download PDF
        </LinkButton>
        <LinkButton variant="ghost" href={document.source.url} target="_blank" rel="noopener noreferrer">
          View source
        </LinkButton>
      </div>
    </Card>
  )
}
