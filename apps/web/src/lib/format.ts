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

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

/**
 * Format an ISO date (`"2026-03-01"`) as a long-form date (`"March 1, 2026"`).
 * Rendered against UTC explicitly, not the viewer's local zone, so a date can't
 * shift a day earlier under a negative UTC offset.
 */
export function formatIsoDateLong(iso: string): string {
  return LONG_DATE_FORMATTER.format(new Date(`${iso}T00:00:00Z`))
}

/**
 * Parse a user-typed money string into a number, e.g. `"4,800" → 4800`,
 * `"$1,234.50" → 1234.5`, `"−$612" → -612`.
 *
 * Tolerates the decorations {@link formatUsd} emits (`$`, thousands separators,
 * the Unicode minus U+2212) so a formatted value round-trips. Returns `null` for
 * anything non-numeric so callers can surface a field error rather than silently
 * coercing to 0 — `""` is `null` too, letting the caller decide if blank means zero.
 */
export function parseUsd(raw: string): number | null {
  const cleaned = raw
    .replace(/[\s,$]/g, '')
    // Unicode minus (U+2212) → ASCII hyphen so Number() accepts it.
    .replace(/−/g, '-')
  if (cleaned === '' || cleaned === '-') return null
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/**
 * Parse a user-typed whole-number count (children, overnights), e.g. `"219" → 219`.
 * Returns `null` for blanks, negatives, decimals, or non-numeric input.
 */
export function parseCount(raw: string): number | null {
  const cleaned = raw.replace(/[\s,]/g, '')
  if (cleaned === '') return null
  if (!/^\d+$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isSafeInteger(n) ? n : null
}
