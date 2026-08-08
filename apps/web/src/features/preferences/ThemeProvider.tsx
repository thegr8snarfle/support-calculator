/**
 * Owns the theme at runtime: resolves the user's preference against the OS and keeps
 * `data-theme` on `<html>` in sync.
 *
 * Mount it **outermost** in `App.tsx` — outside `StepFlowProvider` — because `AppHeader`
 * renders the toggle and sits above the step pages.
 *
 * ## Two owners, one attribute
 *
 * `public/theme-init.js` sets `data-theme` before first paint; this provider owns it from
 * the first render onward. The overlap is intentional and the handoff is a no-op in the
 * common case — both compute the same value from the same stored preference, so the effect
 * below usually writes the attribute that is already there.
 *
 * The duplication is forced: the boot script runs before the bundle exists, so it cannot
 * import `resolveTheme`. `preferencesContract.test.ts` pins the two to the same storage key
 * and the same resolution rules.
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { usePreferencesStore } from './store/preferencesStore'
import { DARK_SCHEME_QUERY, resolveTheme } from './theme'
import { ThemeContext, type ThemeState } from './hooks/useTheme'

/**
 * Subscribe to OS color-scheme changes.
 *
 * Module-level so its identity is stable across renders — `useSyncExternalStore`
 * re-subscribes whenever this function changes.
 *
 * @param onChange Called by React when the media query flips.
 * @returns The unsubscribe function.
 */
function subscribeToColorScheme(onChange: () => void): () => void {
  // Guard for environments without matchMedia (jsdom without the test stub, SSR). Returning
  // a no-op unsubscribe keeps the hook contract intact.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  const query = window.matchMedia(DARK_SCHEME_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Current OS preference.
 *
 * @returns `true` when the OS reports a dark color scheme. A boolean snapshot is
 *   value-stable, so `useSyncExternalStore` will not loop on identity.
 */
function getPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(DARK_SCHEME_QUERY).matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = usePreferencesStore((s) => s.preferences.theme)
  const setTheme = usePreferencesStore((s) => s.setTheme)

  // Live OS preference. Subscribed unconditionally rather than only while `theme` is
  // `'system'`: the subscription is cheap, and conditioning it would mean tearing down and
  // rebuilding a listener every time the user cycles the toggle.
  const prefersDark = useSyncExternalStore(
    subscribeToColorScheme,
    getPrefersDark,
    // Server snapshot: no OS to ask, so assume light. Unused today (no SSR) but required.
    () => false,
  )

  const resolved = resolveTheme(theme, prefersDark)

  // Sync the DOM to the resolved theme. A genuine external-system effect — this writes to
  // the document, it does not set React state, so it cannot trigger the render loop that
  // `react-hooks/set-state-in-effect` guards against.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  // Memoized so consumers re-render when the theme changes and not merely when a parent
  // does. `setTheme` is a Zustand action with a stable identity and the other two are
  // primitives, so this recomputes only on a real theme change.
  const value = useMemo<ThemeState>(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
