import { cn } from '../../lib/cn'

export type ErrorTipProps = {
  /** The error message: what is wrong *and* how to fix it. */
  message: string
  /** Id for the bubble, so the input can point at it with `aria-describedby`. */
  id: string
  className?: string
}

/**
 * The error counterpart to `HelpTip`: an alert-colored bubble attached to an invalid field.
 *
 * Same CSS-only reveal as `HelpTip` (`group-hover` / `group-focus-within`), so it needs no
 * state and no positioning library. Wrap it and the input in a `group relative` element.
 *
 * Two deliberate choices:
 *
 * - **Always rendered, never conditionally mounted.** `aria-describedby` can only reference
 *   an element that exists, so a screen reader (and a test) must be able to reach the text
 *   without a hover ever happening. Only opacity changes.
 * - **Positioned below the field**, unlike `HelpTip` which sits above. Worksheet inputs are
 *   in a tight two-column grid and an upward bubble would cover the row label above it.
 */
export function ErrorTip({ message, id, className }: ErrorTipProps) {
  return (
    <span
      id={id}
      role="tooltip"
      className={cn(
        // `pointer-events-none` so the bubble can never intercept a click meant for the
        // input underneath it.
        'pointer-events-none absolute right-0 top-full z-10 mt-1 w-max max-w-[200px]',
        'rounded-md bg-alert px-2.5 py-1.5 text-left text-[12px] font-medium leading-snug',
        'text-white shadow-md',
        'opacity-0 transition-opacity duration-150',
        'group-hover:opacity-100 group-focus-within:opacity-100',
        className,
      )}
    >
      {message}
    </span>
  )
}
