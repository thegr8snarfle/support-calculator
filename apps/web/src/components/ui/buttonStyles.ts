import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const base =
  'inline-flex items-center justify-center h-11 px-4 rounded-md font-body text-[15px] font-semibold ' +
  'cursor-pointer border border-transparent transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
  secondary: 'bg-primary-weak text-primary hover:brightness-95',
  ghost: 'bg-transparent text-text border-border hover:bg-surface-2',
}

/** The button look, shared with non-`<button>` elements styled the same way (e.g. `LinkButton`). */
export function buttonVariantClassName(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(base, variants[variant], className)
}
