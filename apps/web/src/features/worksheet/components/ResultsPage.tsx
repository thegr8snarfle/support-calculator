import { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Textarea } from '../../../components/ui/Textarea'
import { WorksheetRecap } from './WorksheetRecap'
import { EstimateBreakdown } from './EstimateBreakdown'
import { SupportCitation } from './SupportCitation'
import { useStepFlow } from '../../navigation'
import { useWorksheetStore } from '../store/worksheetStore'
import { useSupportEstimate } from '../hooks/useSupportEstimate'
import { EMPTY_ESTIMATE } from '../estimateDefaults'
import { formatUsd, truncateName } from '../../../lib/format'

/**
 * The Results step of the guided flow (Worksheet → Review → Results). A complete,
 * standalone printable summary: the headline estimate, an expanded "how this was
 * calculated" breakdown, and a read-only recap of every worksheet input — so a printed
 * Results page stands on its own. Figures come from the live estimate. Designed in the Columbine language (no mockup existed),
 * reusing the results-rail breakdown vocabulary and the shared worksheet recap.
 *
 * "Print" is `window.print()`, not a generated file — both macOS and Windows
 * print dialogs offer "Save as PDF" as a destination, so this needs no new dependency and
 * no byte-generation step. Everything on-screen that shouldn't appear on paper (this
 * page's own buttons, the app header) is hidden via Tailwind's `print:` variant instead.
 */
export function ResultsPage() {
  const { back } = useStepFlow()
  const parties = useWorksheetStore((s) => s.input.parties)
  const { estimate } = useSupportEstimate()
  const e = estimate ?? EMPTY_ESTIMATE
  // Export-only annotation: local to this page, never part of WorksheetInput. Not
  // persisted and not shown on Review — it exists purely to appear on a printed/exported
  // copy of this specific estimate.
  const [notes, setNotes] = useState('')
  // Truncated for display — WorksheetRecap below reads the store directly and truncates its
  // own copies, so the full name is never touched here, only these local display variants.
  const payerName = truncateName(parties[e.payer].name)
  const recipientName = truncateName(parties[e.recipient].name)
  return (
    <div className="max-w-[720px] print:max-w-none">
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-[0.09em] uppercase text-accent-strong">
          Child Support · Results
        </div>
        <h1 className="font-display font-bold text-[32px] tracking-[-0.02em] my-1.5">
          Your estimated support.
        </h1>
        <p className="text-text-muted max-w-[56ch] m-0">
          A summary of the estimate and how it was reached. This is an estimate, not a
          court order — you can print or export it, but nothing is filed or saved.
        </p>
      </div>

      {/* Hero estimate */}
      <Card>
        <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-muted">
          Estimated monthly support
        </div>
        <div className="mt-0.5">
          <span className="num inline-block pb-1 font-display font-bold text-[46px] leading-[1.05] tracking-[-0.03em] bg-linear-[transparent_78%,var(--accent-weak)_78%] shadow-[inset_0_-3px_0_var(--accent)]">
            {formatUsd(e.amount)}
            <small className="text-[17px] font-semibold text-text-muted">/mo</small>
          </span>
        </div>
        <p className="mt-2 text-[14px] text-text-muted m-0">
          <b className="text-primary font-bold">{payerName}</b> pays{' '}
          <span className="text-positive font-bold">{recipientName}</span> each month.
        </p>
      </Card>

      {/* How this was calculated */}
      <Card title="How this was calculated">
        <EstimateBreakdown
          estimate={e}
          nameA={truncateName(parties.a.name)}
          nameB={truncateName(parties.b.name)}
          netLabel={`${payerName}’s share, net`}
          size="full"
        />
      </Card>

      {/* Inputs used */}
      <h2 className="font-display font-semibold text-[18px] tracking-[-0.01em] mt-8 mb-4">
        Inputs used
      </h2>
      <WorksheetRecap />

      {/* Editable on screen, hidden on paper — a <textarea> prints inconsistently across
          browsers (clipped to its visible height, stray scrollbars/resize handles). The
          plain-text mirror just below is what actually appears when printed. */}
      <div className="print:hidden mt-8 mb-6">
        <label
          htmlFor="export-notes"
          className="block text-[13px] font-semibold text-text-muted mb-1.5"
        >
          Notes for this export{' '}
          <span className="font-normal text-text-subtle">
            (optional — appears when you print or save as PDF)
          </span>
        </label>
        <Textarea
          id="export-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Add anything you want to remember about this estimate…"
        />
      </div>
      {/* Only rendered when there's something to show, so a worksheet with nothing typed
          prints exactly as it did before this field existed. */}
      {notes.trim() && (
        <div className="hidden print:block mt-8 mb-6">
          <h2 className="font-display font-semibold text-[18px] tracking-[-0.01em] mb-2">
            Notes
          </h2>
          <p className="whitespace-pre-wrap text-[14px]">{notes}</p>
        </div>
      )}

      <p className="text-[11.5px] leading-normal text-text-subtle">
        <SupportCitation />
      </p>

      <div className="print:hidden flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
        <Button variant="ghost" onClick={back}>Back to review</Button>
        <Button variant="primary" onClick={() => window.print()}>Print</Button>
      </div>
    </div>
  )
}
