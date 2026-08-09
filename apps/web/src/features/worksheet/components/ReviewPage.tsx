import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { WorksheetRecap } from './WorksheetRecap'
import { useStepFlow } from '../../navigation'
import { useWorksheetStore } from '../store/worksheetStore'
import { useSupportEstimate } from '../hooks/useSupportEstimate'
import { formatUsd, truncateName } from '../../../lib/format'

/**
 * The Review step of the guided flow (Worksheet → Review → Results). A read-only,
 * grouped recap of everything the worksheet collects, so the user can confirm the
 * inputs before seeing full results. Figures come from the live estimate; each "Edit"
 * jumps back to that worksheet section, and "See full results" advances to the
 * Results step.
 */
export function ReviewPage() {
  const { back, goTo } = useStepFlow()
  const parties = useWorksheetStore((s) => s.input.parties)
  const { estimate } = useSupportEstimate()
  return (
    <div className="max-w-[720px]">
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-[0.09em] uppercase text-accent-strong">
          Child Support · Review
        </div>
        <h1 className="font-display font-bold text-[32px] tracking-[-0.02em] my-1.5">
          Review your worksheet.
        </h1>
        <p className="text-text-muted max-w-[56ch] m-0">
          Check each section before you see the full results. Anything can be changed —
          nothing is filed and nothing is saved.
        </p>
      </div>

      {/* Estimate echo — the number being confirmed, kept compact (not the full rail) */}
      <Card className="bg-primary-weak border-transparent">
        <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-muted">
          Estimated monthly support
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="num font-display font-bold text-[40px] tracking-[-0.02em] text-primary">
            {formatUsd(estimate?.amount ?? 0)}
          </span>
          <span className="text-[16px] font-semibold text-text-muted">/mo</span>
        </div>
        <p className="mt-1 text-[14px] text-text-muted m-0">
          {truncateName(parties[estimate?.payer ?? 'b'].name)} pays{' '}
          {truncateName(parties[estimate?.recipient ?? 'a'].name)} each month.
        </p>
      </Card>

      <WorksheetRecap onEdit={(sectionId) => goTo('worksheet', sectionId)} />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
        <Button variant="ghost" onClick={back}>Back to worksheet</Button>
        <Button variant="primary" onClick={() => goTo('results')}>
          See full results
        </Button>
      </div>
    </div>
  )
}
