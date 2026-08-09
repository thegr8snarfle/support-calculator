import { describe, expect, it } from 'vitest'
import {
  formatUsd,
  formatPercent,
  parseUsd,
  parseCount,
  formatIsoDateLong,
  truncateName,
  NAME_DISPLAY_MAX,
} from './format'

describe('formatUsd', () => {
  it('formats whole dollars with separators', () => {
    expect(formatUsd(4800)).toBe('$4,800')
    expect(formatUsd(0)).toBe('$0')
  })

  it('uses the Unicode minus for negatives', () => {
    expect(formatUsd(-612)).toBe('−$612')
  })
})

describe('formatPercent', () => {
  it('appends a percent sign', () => {
    expect(formatPercent(42.5)).toBe('42.5%')
  })
})

describe('parseUsd', () => {
  it('parses plain and decorated amounts', () => {
    expect(parseUsd('4800')).toBe(4800)
    expect(parseUsd('4,800')).toBe(4800)
    expect(parseUsd('$1,234.50')).toBe(1234.5)
    expect(parseUsd(' 42 ')).toBe(42)
  })

  it('round-trips what formatUsd produces, including the Unicode minus', () => {
    for (const n of [0, 42, 4800, -612, 1234567]) {
      expect(parseUsd(formatUsd(n))).toBe(n)
    }
  })

  it('returns null for blank or non-numeric input rather than coercing to 0', () => {
    expect(parseUsd('')).toBeNull()
    expect(parseUsd('   ')).toBeNull()
    expect(parseUsd('abc')).toBeNull()
    expect(parseUsd('12abc')).toBeNull()
    expect(parseUsd('-')).toBeNull()
  })
})

describe('formatIsoDateLong', () => {
  it('formats a date as long-form', () => {
    expect(formatIsoDateLong('2026-03-01')).toBe('March 1, 2026')
  })

  it('does not shift a day under a negative UTC offset', () => {
    // A local-time interpretation (e.g. `new Date('2026-03-01').getDate()` read in a
    // UTC-5 zone) would misread this as the last day of February.
    expect(formatIsoDateLong('2026-03-01')).not.toContain('Feb')
    expect(formatIsoDateLong('2026-01-01')).toBe('January 1, 2026')
  })
})

describe('truncateName', () => {
  it('leaves a name at or under the limit untouched', () => {
    expect(truncateName('Jane')).toBe('Jane')
    expect(truncateName('A'.repeat(NAME_DISPLAY_MAX))).toBe('A'.repeat(NAME_DISPLAY_MAX))
  })

  it('ellipsizes anything over 15 characters', () => {
    const long = 'Jonathan Alexander Smith-O\'Brien'
    const result = truncateName(long)
    expect(result).toBe(`${long.slice(0, 15)}…`)
    expect(result.length).toBe(16) // 15 kept characters + the ellipsis mark
  })

  it('honors a custom limit', () => {
    expect(truncateName('Jane', 2)).toBe('Ja…')
  })
})

describe('parseCount', () => {
  it('parses whole numbers', () => {
    expect(parseCount('219')).toBe(219)
    expect(parseCount('0')).toBe(0)
  })

  it('rejects blanks, decimals, and negatives', () => {
    expect(parseCount('')).toBeNull()
    expect(parseCount('12.5')).toBeNull()
    expect(parseCount('-3')).toBeNull()
    expect(parseCount('abc')).toBeNull()
  })
})
