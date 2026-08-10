/** Shared visual styles for text-like input fields (currency, number, free text). */

export const fieldBase =
  'w-full h-10 rounded-md border bg-surface text-text text-right text-[15px] num ' +
  'placeholder:text-text-subtle focus:outline-none'

/** Same shell as {@link fieldBase}, left-aligned with no tabular-figure numerals — for
 * free text (e.g. a parent's name) rather than a number. */
export const fieldBaseText =
  'w-full h-10 rounded-md border bg-surface text-text text-left text-[15px] ' +
  'placeholder:text-text-subtle focus:outline-none'

/** Multi-line counterpart to {@link fieldBaseText} — a resizable block instead of a
 * fixed `h-10` row, for free-form text longer than one line (e.g. export notes). */
export const fieldBaseTextarea =
  'w-full min-h-[100px] rounded-md border bg-surface text-text text-left text-[15px] ' +
  'placeholder:text-text-subtle focus:outline-none resize-y'

/** Border/focus classes for the default vs error field state. */
export function fieldStateClass(error?: boolean): string {
  return error
    ? 'border-alert shadow-[0_0_0_3px_var(--color-alert-weak)] focus:border-alert'
    : 'border-border focus:border-primary focus:shadow-[var(--focus-ring)]'
}
