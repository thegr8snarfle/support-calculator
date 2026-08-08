import { describe, expect, it } from 'vitest'
import { formatUsd, formatPercent, parseUsd, parseCount } from './format'

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
