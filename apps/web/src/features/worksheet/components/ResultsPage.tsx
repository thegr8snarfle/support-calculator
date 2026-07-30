import type { ReactNode } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { WorksheetRecap } from './WorksheetRecap'
import { SupportCitation } from './SupportCitation'
import { useStepFlow } from '../../navigation'
import { SAMPLE_WORKSHEET, SAMPLE_ESTIMATE } from '../../../mocks'
import { formatUsd, formatPercent } from '../../../lib/format'

const { parties } = SAMPLE_WORKSHEET
const e = SAMPLE_ESTIMATE
const payerName = parties[e.payer].name
const recipientName = parties[e.recipient].name

/**
 * The Results step of the guided flow (Worksheet → Review → Results). A complete,
 * standalone printable summary: the headline estimate, an expanded "how this was
 * calculated" breakdown, and a read-only recap of every worksheet input — so a printed
 * Results page stands on its own. Values are static (from the shared mock fixtures); no
 * calculation logic exists yet. Designed in the Columbine language (no mockup existed),
 * reusing the results-rail breakdown vocabulary and the shared worksheet recap.
 */
export function ResultsPage() {
  const { back } = useStepFlow()
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
        <Row label="Combined income" value={formatUsd(e.combinedIncome)} />
        <div className="flex h-2 rounded-pill overflow-hidden my-1 shadow-[inset_0_0_0_1px_var(--border)]">
          <span className="bg-primary" style={{ width: `${e.shareA}%` }} />
          <span className="bg-accent" style={{ width: `${e.shareB}%` }} />
        </div>
        <div className="flex justify-between items-center pb-[7px] text-[13px]">
          <span className="text-text-muted">Income share</span>
          <span className="num font-semibold">
            {parties.a.name} {formatPercent(e.shareA)} · {parties.b.name} {formatPercent(e.shareB)}
          </span>
        </div>

        <Row label="Basic obligation" value={formatUsd(e.basicObligation)} />
        <Row label="Parenting-time adjustment" value={formatUsd(e.parentingAdjustment)} valueClass="text-positive" />
        <Row label="Childcare + health + medical" value={formatUsd(e.addOns)} />

        <div className="flex justify-between items-center border-t border-border mt-1.5 pt-3 text-[14px]">
          <span className="text-text font-bold">{payerName}&rsquo;s share, net</span>
          <span className="num font-bold">{formatUsd(e.netTotal)}</span>
        </div>
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

function Row({ label, value, valueClass }: { label: ReactNode; value: ReactNode; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center py-[7px] text-[13px]">
      <span className="text-text-muted">{label}</span>
      <span className={`num font-semibold ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
