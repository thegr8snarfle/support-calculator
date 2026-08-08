/**
 * Pure theme-helper tests.
 */
import { describe, expect, it } from 'vitest'
import { nextTheme, resolveTheme, themeLabel, THEME_CYCLE } from './theme'
import type { ThemePreference } from '../../types/preferences'

describe('resolveTheme', () => {
  it('passes an explicit choice through, whatever the OS says', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('defers to the OS when set to system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('nextTheme', () => {
  it('cycles through every state and returns to the start', () => {
    // A user must be able to get back to 'system' — it is the default, and a two-step
    // toggle would make handing control back to the OS impossible without clearing storage.
    const seen: ThemePreference[] = []
    let theme: ThemePreference = 'system'
    for (let i = 0; i < THEME_CYCLE.length; i += 1) {
      seen.push(theme)
      theme = nextTheme(theme)
    }

    expect(seen).toEqual(['system', 'light', 'dark'])
    expect(theme).toBe('system')
  })

  it('recovers from an unrecognised value', () => {
    expect(nextTheme('sepia' as ThemePreference)).toBe(THEME_CYCLE[0])
  })
})

describe('themeLabel', () => {
  it('labels every state in the cycle', () => {
    expect(THEME_CYCLE.map(themeLabel)).toEqual(['System', 'Light', 'Dark'])
  })
})
