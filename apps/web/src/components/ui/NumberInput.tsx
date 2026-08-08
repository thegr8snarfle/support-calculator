import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldBase, fieldStateClass } from './fieldStyles'

export type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Renders the error border + ring state. */
  error?: boolean
}

/** Right-aligned numeric field with no currency prefix (e.g. overnights). */
export function NumberInput({ error, className, ...props }: NumberInputProps) {
  return (
    <input
      inputMode="numeric"
      aria-invalid={error || undefined}
      className={cn(fieldBase, fieldStateClass(error), 'px-3', className)}
      {...props}
    />
  )
}
