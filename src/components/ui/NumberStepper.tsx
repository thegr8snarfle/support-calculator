import type { ReactNode } from 'react'

export type NumberStepperProps = {
  value: ReactNode
  onDecrement?: () => void
  onIncrement?: () => void
  decrementLabel?: string
  incrementLabel?: string
}

/** Pill "–  value  +" stepper. Buttons are optional (presentational by default). */
export function NumberStepper({
  value,
  onDecrement,
  onIncrement,
  decrementLabel = 'fewer',
  incrementLabel = 'more',
}: NumberStepperProps) {
  return (
    <div className="inline-flex items-center rounded-pill border border-border overflow-hidden">
      <button
        type="button"
        aria-label={decrementLabel}
        onClick={onDecrement}
        className="focus-ring w-10 h-10 bg-surface text-primary text-xl leading-none cursor-pointer hover:bg-surface-2"
      >
        –
      </button>
      <span className="min-w-12 text-center font-bold num">{value}</span>
      <button
        type="button"
        aria-label={incrementLabel}
        onClick={onIncrement}
        className="focus-ring w-10 h-10 bg-surface text-primary text-xl leading-none cursor-pointer hover:bg-surface-2"
      >
        +
      </button>
    </div>
  )
}
