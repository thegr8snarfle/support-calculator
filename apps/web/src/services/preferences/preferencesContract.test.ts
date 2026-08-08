/**
 * The contract between `public/theme-init.js` and the app bundle.
 *
 * The boot script runs before any module exists, so it cannot import the storage key or
 * `resolveTheme` — it re-implements both. That duplication is forced, but it is also exactly
 * the kind that rots silently: rename the key in `src/` and the app keeps working while the
 * flash quietly comes back, because the boot script is now reading a key nobody writes.
 *
 * These tests read the actual script file and pin the shared assumptions, so a drift fails
 * the suite instead of degrading the product invisibly.
 */
import { describe, expect, it } from 'vitest'
// `?raw` rather than `node:fs` so this stays inside the app's browser tsconfig (which types
// `vite/client` but not Node) and needs no build-config carve-out for one test.
import script from '../../../public/theme-init.js?raw'
import html from '../../../index.html?raw'
import { PREFERENCES_KEY } from './preferencesRepository'
import { preferencesSchema } from './preferencesSchema'
import { DARK_SCHEME_QUERY, resolveTheme } from '../../features/preferences/theme'

describe('theme-init.js ↔ bundle contract', () => {
  it('reads the same storage key the app writes', () => {
    expect(script).toContain(`'${PREFERENCES_KEY}'`)
  })

  it('reads the same field name the schema persists', () => {
    // If `theme` were ever renamed in the schema, the boot script would read undefined and
    // silently fall back to 'system'.
    expect(Object.keys(preferencesSchema.shape)).toContain('theme')
    expect(script).toContain('stored.theme')
  })

  it('queries the same media feature the provider subscribes to', () => {
    expect(script).toContain(DARK_SCHEME_QUERY)
  })

  it('accepts exactly the theme values the schema allows', () => {
    // Both sides must agree on the vocabulary, or a legitimately stored value gets
    // discarded at boot and applied a moment later — a flash, not an error.
    const allowed = preferencesSchema.shape.theme.options
    for (const value of allowed) {
      expect(script).toContain(`'${value}'`)
    }
  })

  it('resolves system the same way resolveTheme does', () => {
    // The script's rule, transcribed: prefersDark ? 'dark' : 'light'.
    expect(script).toContain("prefersDark ? 'dark' : 'light'")
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('is loaded render-blocking, without defer or module type', () => {
    // The entire reason this file exists. `type="module"` or `defer` would push execution
    // past first paint and reintroduce the flash while looking perfectly correct.
    const tag = html.match(/<script[^>]*theme-init\.js[^>]*>/)?.[0]

    expect(tag).toBeDefined()
    expect(tag).not.toContain('type="module"')
    expect(tag).not.toContain('defer')
    expect(tag).not.toContain('async')
  })

  it('cannot throw during boot', () => {
    // A throw here runs before React and takes the whole app down, so the blanket catch is
    // load-bearing rather than defensive habit.
    expect(script).toContain('try {')
    expect(script).toMatch(/catch\s*\(/)
  })
})
