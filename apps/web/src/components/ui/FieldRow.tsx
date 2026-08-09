import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { partyGridCols } from './grid'

export type FieldRowProps = {
  /** Left-hand field label. */
  label: ReactNode
  /** Optional sub-hint shown under the label. */
  hint?: ReactNode
  /** Draw the top hairline divider (default true). */
  divider?: boolean
  /** Parent A column cell (two-column mode). */
  a?: ReactNode
  /** Parent B column cell (two-column mode). */
  b?: ReactNode
  /** Single input spanning both party columns (e.g. shared costs). */
  wide?: ReactNode
  /**
   * Secondary control on its own full-width line beneath the row (e.g. the "who pays this"
   * toggle on a shared cost).
   *
   * A second row rather than another column because the `wide` slot is only ~13rem at
   * 390px — an amount field and a three-way toggle side by side would overflow the phone
   * viewport that `apps/web/CLAUDE.md` calls out.
   */
  meta?: ReactNode
}

/**
 * One labeled worksheet row on the shared party grid. Either provide `a` + `b`
 * for the two-party columns, or `wide` for a single input spanning both; `meta` adds a
 * full-width second line under either arrangement.
 */
export function FieldRow({ label, hint, divider = true, a, b, wide, meta }: FieldRowProps) {
  return (
    <div
      className={cn(
        partyGridCols,
        'items-center py-3 px-1',
        divider && 'border-t border-border',
      )}
    >
      <div className="text-[14px]">
        {label}
        {hint && <small className="block text-[12px] text-text-subtle">{hint}</small>}
      </div>
      {wide ? (
        <div className="col-start-2 col-span-2">{wide}</div>
      ) : (
        <>
          <div>{a}</div>
          <div>{b}</div>
        </>
      )}
      {/* Spans every column so the control is free to wrap on a narrow viewport. */}
      {meta && <div className="col-start-1 col-span-3 mt-2">{meta}</div>}
    </div>
  )
}
