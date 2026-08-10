import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldBaseTextarea, fieldStateClass } from './fieldStyles'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

/** Multi-line free-text field (e.g. export notes) — the multi-row counterpart to TextInput. */
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(fieldBaseTextarea, fieldStateClass(), 'px-3 py-2', className)}
      {...props}
    />
  )
}
