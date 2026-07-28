import { cn } from '../../lib/cn'

export type SegmentedOption = {
  label: string
  value: string
}

export type SegmentedToggleProps = {
  options: SegmentedOption[]
  value: string
  onChange?: (value: string) => void
  'aria-label'?: string
}

/**
 * Pill track with a raised selected segment. For mutually exclusive choices
 * (pay period, yes/no, paid vs received).
 */
export function SegmentedToggle({ options, value, onChange, ...rest }: SegmentedToggleProps) {
  return (
    <div
      role="tablist"
      aria-label={rest['aria-label']}
      className="inline-flex gap-0.5 rounded-pill bg-surface-2 p-[3px]"
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              'focus-ring rounded-pill px-3 py-[5px] text-[13px] cursor-pointer transition-colors',
              selected
                ? 'bg-surface text-text font-semibold shadow-sm'
                : 'bg-transparent text-text-muted',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
