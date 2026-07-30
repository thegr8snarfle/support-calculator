import type { ReactNode } from 'react'

export type RecapValueProps = {
  /** Dim the value for a zero / empty entry. */
  muted?: boolean
  children: ReactNode
}

/**
 * Right-aligned read-only value, aligned to where the worksheet input sat. Shared by
 * the Review and Results recaps so a read-only figure looks identical in both.
 */
export function RecapValue({ muted, children }: RecapValueProps) {
  return (
    <span
      className={
        muted
          ? 'num block text-right text-[15px] text-text-subtle'
          : 'num block text-right text-[15px] font-semibold'
      }
    >
      {children}
    </span>
  )
}
