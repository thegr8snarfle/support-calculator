import type { ReactNode } from 'react'
import { formatPercent, formatUsd } from '../../../lib/format'
import type { SupportEstimate } from '../../../types/support'

/**
 * The "how this was calculated" figures, shared by the sticky results rail and the
 * printable Results page.
 *
 * Previously these were two near-verbatim copies of the same markup — each with its
 * own identical local `Row` helper, and one taking pre-formatted strings while the
 * other took raw numbers, so they could drift. This takes the estimate object and
 * formats at a single boundary.
 */
export type EstimateBreakdownProps = {
  estimate: SupportEstimate
  nameA: string
  nameB: string
  /** Label for the closing total row, e.g. "Blake's share, net". */
  netLabel: string
  /** Larger type for the standalone Results page; compact in the rail. */
  size?: 'compact' | 'full'
}

export function EstimateBreakdown({
  estimate: e,
  nameA,
  nameB,
  netLabel,
  size = 'compact',
}: EstimateBreakdownProps) {
  const totalText = size === 'full' ? 'text-[14px]' : 'text-[13px]'
  return (
    <>
      <Row label="Combined income" value={formatUsd(e.combinedIncome)} />

      <div className="flex h-2 rounded-pill overflow-hidden my-1 shadow-[inset_0_0_0_1px_var(--border)]">
        <span className="bg-primary" style={{ width: `${e.shareA}%` }} />
        <span className="bg-accent" style={{ width: `${e.shareB}%` }} />
      </div>
      <div className="flex justify-between items-center pb-[7px] gap-3 text-[13px]">
        <span className="text-text-muted">Income share</span>
        <span className="num font-semibold text-right">
          {nameA} {formatPercent(e.shareA)} · {nameB} {formatPercent(e.shareB)}
        </span>
      </div>

      <Row label="Basic obligation" value={formatUsd(e.basicObligation)} />
      <Row
        label="Parenting-time adjustment"
        value={formatUsd(e.parentingAdjustment)}
        valueClass="text-positive"
      />
      <Row label="Childcare + health + medical" value={formatUsd(e.addOns)} />

      <div
        className={`flex justify-between items-center border-t border-border mt-1.5 pt-3 gap-3 ${totalText}`}
      >
        <span className="text-text font-bold">{netLabel}</span>
        <span className="num font-bold">{formatUsd(e.netTotal)}</span>
      </div>
    </>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: ReactNode
  value: ReactNode
  valueClass?: string
}) {
  return (
    <div className="flex justify-between items-center py-[7px] gap-3 text-[13px]">
      <span className="text-text-muted">{label}</span>
      <span className={`num font-semibold ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
