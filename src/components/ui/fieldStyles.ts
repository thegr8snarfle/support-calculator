/** Shared visual styles for text-like input fields (currency, number). */

export const fieldBase =
  'w-full h-10 rounded-md border bg-surface text-text text-right text-[15px] num ' +
  'placeholder:text-text-subtle focus:outline-none'

/** Border/focus classes for the default vs error field state. */
export function fieldStateClass(error?: boolean): string {
  return error
    ? 'border-alert shadow-[0_0_0_3px_var(--color-alert-weak)] focus:border-alert'
    : 'border-border focus:border-primary focus:shadow-[var(--focus-ring)]'
}
