export type ParentingTimeBarProps = {
  nameA: string
  nameB: string
  nightsA: number
  nightsB: number
}

const YEAR_NIGHTS = 365

/**
 * Signature element: the parenting-time balance bar. A single 0–365 track split
 * between the two parents (Parent A = primary, Parent B = accent), with the
 * 0 / 183 / 365 scale and a legend of nights + percentage.
 */
export function ParentingTimeBar({ nameA, nameB, nightsA, nightsB }: ParentingTimeBarProps) {
  const total = nightsA + nightsB || 1
  const pctA = Math.round((nightsA / total) * 100)
  const pctB = 100 - pctA

  return (
    <div className="mt-4">
      <div className="relative flex h-[46px] rounded-md overflow-hidden shadow-[inset_0_0_0_1px_var(--border)]">
        <div
          className="flex items-center justify-start pl-[14px] bg-primary text-white text-[13px] font-semibold"
          style={{ width: `${pctA}%` }}
        >
          {nameA}
        </div>
        <div
          className="flex items-center justify-end pr-[14px] bg-accent text-[#3a2410] text-[13px] font-semibold"
          style={{ width: `${pctB}%` }}
        >
          {nameB}
        </div>
      </div>

      <div className="flex justify-between mt-1.5 text-[11px] text-text-subtle">
        <span>0</span>
        <span>{Math.round(YEAR_NIGHTS / 2)}</span>
        <span>{YEAR_NIGHTS} nights</span>
      </div>

      <div className="flex gap-6 mt-4 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary" /> {nameA}{' '}
          <b className="num">{nightsA} nights · {pctA}%</b>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-accent" /> {nameB}{' '}
          <b className="num">{nightsB} nights · {pctB}%</b>
        </div>
      </div>
    </div>
  )
}
