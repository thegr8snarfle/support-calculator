import type { ReactNode } from 'react'
import { Card } from './Card'

export type RecapCardProps = {
  /** Number shown in the badge. */
  step: number
  title: string
  /** Optional right-aligned action (e.g. an "Edit" link). Omitted on the printable
   *  Results recap, present on the Review recap. */
  action?: ReactNode
  /** DOM id / scroll anchor, forwarded to the underlying Card. */
  id?: string
  children: ReactNode
}

/**
 * A read-only recap card: numbered badge + title on the left (mirroring the worksheet's
 * Card header) with an optional right-aligned action slot. Built on a bare `Card`
 * surface because Card's inline `help` slot can't carry a right-side affordance. Shared
 * by the Review step (with an Edit action) and the Results step (no action).
 */
export function RecapCard({ step, title, action, id, children }: RecapCardProps) {
  return (
    <Card id={id}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-none grid place-items-center w-[26px] h-[26px] rounded-lg bg-primary-weak text-primary font-display font-bold text-[13px]">
            {step}
          </div>
          <h2 className="font-display font-semibold text-[18px] tracking-[-0.01em] m-0">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}
