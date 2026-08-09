import type { AnchorHTMLAttributes } from 'react'
import { buttonVariantClassName, type ButtonVariant } from './buttonStyles'

export type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant
}

/** An `<a>` styled like `Button` — for same-origin downloads and external links that should read as an action, not a link. */
export function LinkButton({ variant = 'primary', className, ...props }: LinkButtonProps) {
  return <a className={buttonVariantClassName(variant, className)} {...props} />
}
