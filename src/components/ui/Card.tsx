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
  children?: ReactNode
  className?: string
}

/**
 * Surface card with an optional numbered header. Maps to STYLEGUIDE.md's
 * "Section card" — one per guided worksheet step.
 */
export function Card({ step, title, hint, help, children, className }: CardProps) {
  const hasHeader = step !== undefined || title || hint
  return (
    <section
      className={cn(
        'bg-surface border border-border rounded-lg shadow-sm p-6 mb-6',
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
