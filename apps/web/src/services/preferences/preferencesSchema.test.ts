/**
 * Trust-boundary tests for persisted preferences.
 *
 * `localStorage` is user-editable and can hold anything a previous build wrote, so the
 * property being pinned is: **no input produces an invalid `Preferences` and no input
 * throws**. This runs during boot, so a throw here is a white screen.
 */
import { describe, expect, it } from 'vitest'
import { parsePreferences } from './preferencesSchema'
import { DEFAULT_PREFERENCES } from '../../types/preferences'

describe('parsePreferences', () => {
  it('reads a valid record', () => {
    const raw = JSON.stringify({ version: 1, theme: 'dark' })
    expect(parsePreferences(raw)).toEqual({ version: 1, theme: 'dark' })
  })

  it('defaults when nothing is stored', () => {
    // First run on this origin — not an error condition.
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES)
  })

  it('defaults to following the OS', () => {
    // The default matters: it is what makes a dark-mode user's first run correct.
    expect(DEFAULT_PREFERENCES.theme).toBe('system')
  })

  it.each([
    ['truncated JSON', '{"version":1,"theme":'],
    ['not an object', '"dark"'],
    ['empty string', ''],
    ['null literal', 'null'],
    ['an array', '[]'],
  ])('falls back on %s rather than throwing', (_label, raw) => {
    expect(() => parsePreferences(raw)).not.toThrow()
    expect(parsePreferences(raw)).toEqual(DEFAULT_PREFERENCES)
  })

  it('rejects an unknown theme value', () => {
    // e.g. a future build's 'high-contrast' read by today's code.
    const raw = JSON.stringify({ version: 1, theme: 'high-contrast' })
    expect(parsePreferences(raw)).toEqual(DEFAULT_PREFERENCES)
  })

  it('rejects a future version rather than reading it with current semantics', () => {
    // The whole point of the version literal: v2 data must not be interpreted by v1 code,
    // even though `theme` happens to look valid here.
    const raw = JSON.stringify({ version: 2, theme: 'dark' })
    expect(parsePreferences(raw)).toEqual(DEFAULT_PREFERENCES)
  })

  it('does not partially merge a malformed record', () => {
    // `theme` alone is valid, but the record failed validation — trusting part of a payload
    // that just proved untrustworthy is how corrupt state leaks in.
    const raw = JSON.stringify({ theme: 'dark' })
    expect(parsePreferences(raw)).toEqual(DEFAULT_PREFERENCES)
  })
})
