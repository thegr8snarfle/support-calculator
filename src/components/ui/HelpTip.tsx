import { cn } from '../../lib/cn'

export type HelpTipProps = {
  /** Plain one-sentence explanation shown in the tooltip. */
  label: string
  className?: string
}

/**
 * Small circular "?" affordance with a dark tooltip on hover/focus.
 * The tooltip is CSS-only (group-hover / focus-within) so it needs no state.
 */
export function HelpTip({ label, className }: HelpTipProps) {
  return (
    <span className={cn('relative inline-grid group align-middle', className)}>
      <button
        type="button"
        aria-label={label}
        className="focus-ring grid place-items-center w-4 h-4 rounded-full bg-surface-2 border border-border text-text-muted text-[11px] font-bold cursor-help"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-2 w-max max-w-[220px] -translate-x-1/2
                   rounded-md bg-text px-3 py-2 text-left text-[12px] font-normal leading-snug text-surface shadow-md
                   opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}
