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
}

/**
 * One labeled worksheet row on the shared party grid. Either provide `a` + `b`
 * for the two-party columns, or `wide` for a single input spanning both.
 */
export function FieldRow({ label, hint, divider = true, a, b, wide }: FieldRowProps) {
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
    </div>
  )
}
