/** Presentational formatters. Kept at the component boundary so domain data (and the
 *  mock fixtures in `src/mocks/`) stay as plain numbers. */

/**
 * Format a whole-dollar amount, e.g. `4800 → "$4,800"`, `-612 → "−$612"`.
 * Uses the Unicode minus (U+2212) to match the Columbine numeral styling.
 */
export function formatUsd(amount: number): string {
  const sign = amount < 0 ? '−' : ''
  return `${sign}$${Math.abs(amount).toLocaleString('en-US')}`
}

/** Format a percentage value, e.g. `42.5 → "42.5%"`. */
export function formatPercent(value: number): string {
  return `${value}%`
}
