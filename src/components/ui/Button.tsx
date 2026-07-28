import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const base =
  'inline-flex items-center justify-center h-11 px-4 rounded-md font-body text-[15px] font-semibold ' +
  'cursor-pointer border border-transparent transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
  secondary: 'bg-primary-weak text-primary hover:brightness-95',
  ghost: 'bg-transparent text-text border-border hover:bg-surface-2',
}

/** Foundational button. Maps to STYLEGUIDE.md: primary / secondary / ghost. */
export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(base, variants[variant], className)} {...props} />
  )
}
