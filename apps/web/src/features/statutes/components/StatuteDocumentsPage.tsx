import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { FieldError } from '../../../components/ui/FieldError'
import { StatuteDocumentCard } from './StatuteDocumentCard'
import { getStatuteDocuments, getDocumentsForRuleSet } from '../../../services/statutes'
// See ActiveStatuteBadge.tsx for why this imports the hook directly instead of the
// `worksheet` barrel (avoids a cycle with `WorksheetPage`, which renders `ActiveStatuteBadge`).
import { useRules } from '../../worksheet/hooks/useRules'
import { formatIsoDateLong } from '../../../lib/format'

export type StatuteDocumentsPageProps = {
  onBack: () => void
}

/**
 * Standalone page (outside the guided Worksheet → Review → Results flow, see
 * `App.tsx`'s sibling view state) listing the statute documents behind the current
 * calculation, how each is used, and a same-origin download for each.
 */
export function StatuteDocumentsPage({ onBack }: StatuteDocumentsPageProps) {
  const { rules, status, error } = useRules()
  // Documents don't require the rule set to be loaded to render — fall back to the
  // default jurisdiction so the list still shows while rules are loading or errored.
  const documents = rules ? getDocumentsForRuleSet(rules) : getStatuteDocuments('CO')

  return (
    <div className="max-w-[720px]">
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-[0.09em] uppercase text-accent-strong">
          Statute Library
        </div>
        <h1 className="font-display font-bold text-[32px] tracking-[-0.02em] my-1.5">
          The statutes behind your estimate.
        </h1>
        <p className="text-text-muted max-w-[56ch] m-0">
          Every figure this calculator produces traces back to one of these documents.
          Download any of them to read the source yourself.
        </p>
      </div>

      {status === 'error' && (
        <div role="alert" className="mb-6">
          <FieldError>{error ?? 'Could not load the support guidelines.'}</FieldError>
        </div>
      )}

      {rules && (
        <Card className="bg-primary-weak border-transparent">
          <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-muted">
            Version currently applied
          </div>
          <p className="mt-1 text-[15px] m-0">
            {rules.jurisdiction.name} — {rules.citations.primary}, effective{' '}
            {formatIsoDateLong(rules.effective.from)}
            {rules.effective.enactedBy && <> ({rules.effective.enactedBy})</>}
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {documents.map((document) => (
          <StatuteDocumentCard key={document.id} document={document} citations={rules?.citations} />
        ))}
      </div>

      <div className="mt-8">
        <Button variant="ghost" onClick={onBack}>
          Back to worksheet
        </Button>
      </div>
    </div>
  )
}
