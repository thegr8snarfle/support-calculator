import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type CardProps = {
  /** Step number shown in the badge (one numbered card per worksheet step). */
  step?: number
  /** Section title. */
  title?: string
  /** One-line helper under the title. */
  hint?: ReactNode
  /** Optional help affordance rendered inline after the hint (e.g. <HelpTip/>). */
  help?: ReactNode
  /** DOM id / scroll anchor. When set, the card can also receive programmatic focus. */
  id?: string
  children?: ReactNode
  className?: string
}

/**
 * Surface card with an optional numbered header. Maps to STYLEGUIDE.md's
 * "Section card" — one per guided worksheet step.
 */
export function Card({ step, title, hint, help, id, children, className }: CardProps) {
  const hasHeader = step !== undefined || title || hint
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      className={cn(
        // Shadows are a screen affordance (depth cues on a surface); printed paper has no
        // such thing, so drop it for every card rather than special-casing the printable
        // pages that happen to use Card.
        'bg-surface border border-border rounded-lg shadow-sm print:shadow-none p-4 sm:p-6 mb-6',
        // scroll-margin so a scrolled-to card clears the header; no focus outline box
        id && 'scroll-mt-6 focus:outline-none',
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-baseline gap-3 mb-4">
          {step !== undefined && (
            <div className="flex-none grid place-items-center w-[26px] h-[26px] rounded-lg bg-primary-weak text-primary font-display font-bold text-[13px]">
              {step}
            </div>
          )}
          <div>
            {title && (
              <h2 className="font-display font-semibold text-[18px] tracking-[-0.01em] m-0">
                {title}
              </h2>
            )}
            {hint && (
              <p className="mt-0.5 text-[13px] text-text-muted">
                {hint}
                {help}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </section>
  )
}
