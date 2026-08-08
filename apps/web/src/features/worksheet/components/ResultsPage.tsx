import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { WorksheetRecap } from './WorksheetRecap'
import { EstimateBreakdown } from './EstimateBreakdown'
import { SupportCitation } from './SupportCitation'
import { useStepFlow } from '../../navigation'
import { useWorksheetStore } from '../store/worksheetStore'
import { useSupportEstimate } from '../hooks/useSupportEstimate'
import { EMPTY_ESTIMATE } from '../estimateDefaults'
import { formatUsd } from '../../../lib/format'

/**
 * The Results step of the guided flow (Worksheet → Review → Results). A complete,
 * standalone printable summary: the headline estimate, an expanded "how this was
 * calculated" breakdown, and a read-only recap of every worksheet input — so a printed
 * Results page stands on its own. Figures come from the live estimate. Designed in the Columbine language (no mockup existed),
 * reusing the results-rail breakdown vocabulary and the shared worksheet recap.
 */
export function ResultsPage() {
  const { back } = useStepFlow()
  const parties = useWorksheetStore((s) => s.input.parties)
  const { estimate } = useSupportEstimate()
  const e = estimate ?? EMPTY_ESTIMATE
  const payerName = parties[e.payer].name
  const recipientName = parties[e.recipient].name
  return (
    <div className="max-w-[720px]">
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
          nameA={parties.a.name}
          nameB={parties.b.name}
          netLabel={`${payerName}’s share, net`}
          size="full"
        />
      </Card>

      {/* Inputs used */}
      <h2 className="font-display font-semibold text-[18px] tracking-[-0.01em] mt-8 mb-4">
        Inputs used
      </h2>
      <WorksheetRecap />

      <p className="text-[11.5px] leading-normal text-text-subtle">
        <SupportCitation />
      </p>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
        <Button variant="ghost" onClick={back}>Back to review</Button>
        {/* Export isn't wired yet — presentational until the print/summary layer lands. */}
        <Button variant="primary">Print / Export PDF</Button>
      </div>
    </div>
  )
}
