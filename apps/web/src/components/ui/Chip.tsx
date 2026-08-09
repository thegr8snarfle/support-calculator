import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type ChipTone = 'neutral' | 'accent' | 'positive'

export type ChipProps = {
  tone?: ChipTone
  children: ReactNode
}

const tones: Record<ChipTone, string> = {
  neutral: 'bg-surface-2 text-text-muted',
  accent: 'bg-primary-weak text-primary',
  positive: 'bg-positive/15 text-positive',
}

/** Small pill label — role/topic tags, status markers. */
export function Chip({ tone = 'neutral', children }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
