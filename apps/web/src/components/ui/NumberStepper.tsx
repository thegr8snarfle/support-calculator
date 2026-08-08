import type { ReactNode } from 'react'

export type NumberStepperProps = {
  value: ReactNode
  onDecrement?: () => void
  onIncrement?: () => void
  decrementLabel?: string
  incrementLabel?: string
  /** Accessible name for the whole control (announced with the current value). */
  label?: string
  /** Bounds — when `value` is a number, the matching button disables at the limit. */
  min?: number
  max?: number
}

/**
 * Pill "–  value  +" stepper.
 *
 * Exposed as a `spinbutton` so assistive tech (and the e2e specs) can read the
 * current value; the +/− buttons disable at `min`/`max` so a bound value can't be
 * driven out of range.
 */
export function NumberStepper({
  value,
  onDecrement,
  onIncrement,
  decrementLabel = 'fewer',
  incrementLabel = 'more',
  label,
  min,
  max,
}: NumberStepperProps) {
  const numeric = typeof value === 'number' ? value : undefined
  const atMin = numeric !== undefined && min !== undefined && numeric <= min
  const atMax = numeric !== undefined && max !== undefined && numeric >= max

  return (
    <div
      className="inline-flex items-center rounded-pill border border-border overflow-hidden"
      role="spinbutton"
      aria-label={label}
      aria-valuenow={numeric}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      <button
        type="button"
        aria-label={decrementLabel}
        onClick={onDecrement}
        disabled={atMin}
        className="focus-ring w-10 h-10 bg-surface text-primary text-xl leading-none cursor-pointer hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        –
      </button>
      <span className="min-w-12 text-center font-bold num">{value}</span>
      <button
        type="button"
        aria-label={incrementLabel}
        onClick={onIncrement}
        disabled={atMax}
        className="focus-ring w-10 h-10 bg-surface text-primary text-xl leading-none cursor-pointer hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  )
}
