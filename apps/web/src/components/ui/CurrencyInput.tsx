import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldBase, fieldStateClass } from './fieldStyles'

export type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Renders the error border + ring state. */
  error?: boolean
}

/**
 * Right-aligned currency field with a "$" prefix. Per STYLEGUIDE.md the "$"
 * belongs to currency fields only — use NumberInput for non-currency numerics.
 */
export function CurrencyInput({ error, className, ...props }: CurrencyInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-[14px] text-text-subtle"
      >
        $
      </span>
      <input
        inputMode="decimal"
        aria-invalid={error || undefined}
        className={cn(fieldBase, fieldStateClass(error), 'pl-[22px] pr-3', className)}
        {...props}
      />
    </div>
  )
}
