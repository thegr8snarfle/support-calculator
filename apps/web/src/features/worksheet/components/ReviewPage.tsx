import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { WorksheetRecap } from './WorksheetRecap'
import { useStepFlow } from '../../navigation'
import { SAMPLE_WORKSHEET, SAMPLE_ESTIMATE } from '../../../mocks'
import { formatUsd } from '../../../lib/format'

const { parties } = SAMPLE_WORKSHEET

/**
 * The Review step of the guided flow (Worksheet → Review → Results). A read-only,
 * grouped recap of everything the worksheet collects, so the user can confirm the
 * inputs before seeing full results. Values are still static (from the shared mock
 * fixtures — no calculation); each "Edit" jumps back to that worksheet section, and
 * "See full results" advances to the Results step.
 */
export function ReviewPage() {
  const { back, goTo } = useStepFlow()
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
            {formatUsd(SAMPLE_ESTIMATE.amount)}
          </span>
          <span className="text-[16px] font-semibold text-text-muted">/mo</span>
        </div>
        <p className="mt-1 text-[14px] text-text-muted m-0">
          {parties[SAMPLE_ESTIMATE.payer].name} pays {parties[SAMPLE_ESTIMATE.recipient].name} each month.
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
