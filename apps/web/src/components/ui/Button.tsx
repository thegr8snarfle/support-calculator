import type { ButtonHTMLAttributes } from 'react'
import { buttonVariantClassName, type ButtonVariant } from './buttonStyles'

export type { ButtonVariant }

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

/** Foundational button. Maps to STYLEGUIDE.md: primary / secondary / ghost. */
export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonVariantClassName(variant, className)} {...props} />
  )
}
