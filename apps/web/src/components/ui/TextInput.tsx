import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldBaseText, fieldStateClass } from './fieldStyles'

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Renders the error border + ring state. */
  error?: boolean
}

/** Left-aligned free-text field (e.g. a parent's name) — the non-numeric counterpart to CurrencyInput/NumberInput. */
export function TextInput({ error, className, ...props }: TextInputProps) {
  return (
    <input
      type="text"
      aria-invalid={error || undefined}
      className={cn(fieldBaseText, fieldStateClass(error), 'px-3', className)}
      {...props}
    />
  )
}
