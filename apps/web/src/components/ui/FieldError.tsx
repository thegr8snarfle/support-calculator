import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type FieldErrorProps = {
  children: ReactNode
  className?: string
}

/** Short inline error message. States what happened + how to fix it. */
export function FieldError({ children, className }: FieldErrorProps) {
  return (
    <span className={cn('block text-[14px] text-alert', className)}>{children}</span>
  )
}
