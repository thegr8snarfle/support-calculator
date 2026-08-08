import type { ReactNode } from 'react'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../lib/cn'
import { EstimateBreakdown } from './EstimateBreakdown'
import { formatUsd } from '../../../lib/format'
import type { SupportEstimate } from '../../../types/support'

export type ResultsRailProps = {
  /** The computed estimate; all figures derive from it. */
  estimate: SupportEstimate
  /** Small suffix after the amount, e.g. "/mo". */
  period?: string
  payer: string
  recipient: string
  nameA: string
  nameB: string
  netLabel: string
  citation: ReactNode
  /** Advance to the Review step. */
  onReview?: () => void
  /**
   * The figures are a **frozen** earlier estimate, held because the worksheet currently has
   * validation errors. Dims the numbers and blocks progression, so a stale amount is never
   * read as the live one.
   */
  stale?: boolean
}

/** Sticky results callout. All figures come from the estimate (no math here). */
export function ResultsRail(props: ResultsRailProps) {
  const {
    estimate, period = '/mo', payer, recipient, nameA, nameB, netLabel, citation, onReview,
    stale = false,
  } = props

  return (
    <>
      {/* A live region: the figure recalculates as the user types, so screen readers
          should hear the updated estimate without moving focus. */}
      <div
        role="region"
        aria-label="Support estimate"
        aria-live="polite"
        className="bg-surface border border-border rounded-lg shadow-md overflow-hidden"
      >
        {/* Announced by the surrounding live region, so a screen-reader user hears that the
            figure has stopped tracking their input rather than only seeing it fade. */}
        {stale && (
          <div className="border-b border-alert bg-alert-weak px-5 py-2 text-[12px] font-semibold text-alert">
            Waiting on a correction — showing your last complete estimate.
          </div>
        )}

        <div
          // Only the figures dim, not the whole card: the correction notice and the
          // buttons must stay at full contrast.
          className={cn('transition-opacity', stale && 'opacity-45')}
        >
        <div className="px-5 pt-4 text-[12px] font-semibold tracking-[0.08em] uppercase text-text-muted">
          Estimated monthly support
        </div>

        <div className="px-5 pt-0.5 pb-2">
          <span className="num inline-block pb-1 font-display font-bold text-[46px] leading-[1.05] tracking-[-0.03em] bg-linear-[transparent_78%,var(--accent-weak)_78%] shadow-[inset_0_-3px_0_var(--accent)]">
            {formatUsd(estimate.amount)}
            <small className="text-[17px] font-semibold text-text-muted">{period}</small>
          </span>
        </div>

        <div className="px-5 pb-4 text-[14px] text-text-muted">
          <b className="text-primary font-bold">{payer}</b> pays{' '}
          <span className="text-positive font-bold">{recipient}</span> each month.
        </div>

        <div className="border-t border-border px-5 py-4">
          <EstimateBreakdown
            estimate={estimate}
            nameA={nameA}
            nameB={nameB}
            netLabel={netLabel}
          />
        </div>

        </div>

        <div className="grid gap-2 px-5 pb-5">
          {/* Disabled while stale so the gate in `canAdvance` is visible here rather than
              silently swallowing the click in the reducer. */}
          <Button variant="primary" onClick={onReview} disabled={stale}>
            Review full worksheet
          </Button>
          <Button variant="ghost">Print / Export PDF</Button>
        </div>
      </div>

      <p className="mt-4 text-[11.5px] leading-normal text-text-subtle">{citation}</p>
    </>
  )
}
