export type ParentingTimeBarProps = {
  nameA: string
  nameB: string
  nightsA: number
  nightsB: number
  /** Nights in a parenting year, from the rule set (365). */
  yearNights?: number
}

const DEFAULT_YEAR_NIGHTS = 365

/**
 * Signature element: the parenting-time balance bar. A single 0–365 track split
 * between the two parents (Parent A = primary, Parent B = accent), with the
 * 0 / 183 / 365 scale and a legend of nights + percentage.
 *
 * Percentages are of the **parenting year**, not of the nights entered, so a total
 * that doesn't add up to 365 renders as an obvious gap rather than silently
 * normalizing to 100% and hiding the mistake.
 */
export function ParentingTimeBar({
  nameA,
  nameB,
  nightsA,
  nightsB,
  yearNights = DEFAULT_YEAR_NIGHTS,
}: ParentingTimeBarProps) {
  const year = yearNights || DEFAULT_YEAR_NIGHTS
  const clamp = (n: number) => Math.min(Math.max(n, 0), year)
  const pctA = Math.round((clamp(nightsA) / year) * 100)
  const pctB = Math.round((clamp(nightsB) / year) * 100)
  const remainder = Math.max(0, 100 - pctA - pctB)

  return (
    <div className="mt-4">
      <div className="relative flex h-[46px] rounded-md overflow-hidden shadow-[inset_0_0_0_1px_var(--border)]">
        <div
          className="flex items-center justify-start pl-[14px] bg-primary text-white text-[13px] font-semibold overflow-hidden whitespace-nowrap"
          style={{ width: `${pctA}%` }}
        >
          {nameA}
        </div>
        <div
          className="flex items-center justify-end pr-[14px] bg-accent text-[#3a2410] text-[13px] font-semibold overflow-hidden whitespace-nowrap"
          style={{ width: `${pctB}%` }}
        >
          {nameB}
        </div>
        {remainder > 0 && (
          <div className="bg-surface-2" style={{ width: `${remainder}%` }} aria-hidden />
        )}
      </div>

      <div className="flex justify-between mt-1.5 text-[11px] text-text-subtle">
        <span>0</span>
        <span>{Math.round(year / 2)}</span>
        <span>{year} nights</span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary" /> {nameA}{' '}
          <b className="num">
            {nightsA} nights · {pctA}%
          </b>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-accent" /> {nameB}{' '}
          <b className="num">
            {nightsB} nights · {pctB}%
          </b>
        </div>
      </div>
    </div>
  )
}
