import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

export type ResultsRailProps = {
  /** Big display amount, e.g. "$842". */
  amount: string
  /** Small suffix after the amount, e.g. "/mo". */
  period?: string
  payer: string
  recipient: string
  nameA: string
  nameB: string
  combinedIncome: string
  /** Income-share percentages (drive the split bar and the label). */
  shareA: number
  shareB: number
  basicObligation: string
  /** Parenting-time credit, shown in the positive color, e.g. "−$612". */
  parentingAdjustment: string
  addOns: string
  netLabel: string
  netTotal: string
  citation: ReactNode
}

function Row({ label, value, valueClass }: { label: ReactNode; value: ReactNode; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center py-[7px] text-[13px]">
      <span className="text-text-muted">{label}</span>
      <span className={`num font-semibold ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}

/** Sticky results callout. All figures are supplied by the caller (no math here). */
export function ResultsRail(props: ResultsRailProps) {
  const {
    amount, period = '/mo', payer, recipient, nameA, nameB,
    combinedIncome, shareA, shareB, basicObligation, parentingAdjustment,
    addOns, netLabel, netTotal, citation,
  } = props

  return (
    <>
      <div className="bg-surface border border-border rounded-lg shadow-md overflow-hidden">
        <div className="px-5 pt-4 text-[12px] font-semibold tracking-[0.08em] uppercase text-text-muted">
          Estimated monthly support
        </div>

        <div className="px-5 pt-0.5 pb-2">
          <span className="num inline-block pb-1 font-display font-bold text-[46px] leading-[1.05] tracking-[-0.03em] bg-linear-[transparent_78%,var(--accent-weak)_78%] shadow-[inset_0_-3px_0_var(--accent)]">
            {amount}
            <small className="text-[17px] font-semibold text-text-muted">{period}</small>
          </span>
        </div>

        <div className="px-5 pb-4 text-[14px] text-text-muted">
          <b className="text-primary font-bold">{payer}</b> pays{' '}
          <span className="text-positive font-bold">{recipient}</span> each month.
        </div>

        <div className="border-t border-border px-5 py-4">
          <Row label="Combined income" value={combinedIncome} />
          <div className="flex h-2 rounded-pill overflow-hidden my-1 shadow-[inset_0_0_0_1px_var(--border)]">
            <span className="bg-primary" style={{ width: `${shareA}%` }} />
            <span className="bg-accent" style={{ width: `${shareB}%` }} />
          </div>
          <div className="flex justify-between items-center pb-[7px] text-[13px]">
            <span className="text-text-muted">Income share</span>
            <span className="num font-semibold">
              {nameA} {shareA}% · {nameB} {shareB}%
            </span>
          </div>

          <Row label="Basic obligation" value={basicObligation} />
          <Row label="Parenting-time adjustment" value={parentingAdjustment} valueClass="text-positive" />
          <Row label="Childcare + health + medical" value={addOns} />

          <div className="flex justify-between items-center border-t border-border mt-1.5 pt-3 text-[14px]">
            <span className="text-text font-bold">{netLabel}</span>
            <span className="num font-bold">{netTotal}</span>
          </div>
        </div>

        <div className="grid gap-2 px-5 pb-5">
          <Button variant="primary">Review full worksheet</Button>
          <Button variant="ghost">Print / Export PDF</Button>
        </div>
      </div>

      <p className="mt-4 text-[11.5px] leading-normal text-text-subtle">{citation}</p>
    </>
  )
}
