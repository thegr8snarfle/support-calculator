/**
 * Context + consumer hook for the theme.
 *
 * Split from `ThemeProvider.tsx` for the same reason `useValidation.ts` is split from
 * `ValidationProvider.tsx`: `react-refresh/only-export-components` flags a module that
 * exports both a component and non-component values.
 *
 * The *preference* lives in `preferencesStore` and could be read from anywhere without
 * context. What context adds is the **resolved** theme, which depends on a live `matchMedia`
 * subscription that should exist exactly once rather than once per consumer.
 */
import { createContext, useContext } from 'react'
import type { ResolvedTheme, ThemePreference } from '../../../types/preferences'

/** Everything the theme layer publishes to the component graph. */
export type ThemeState = {
  /** What the user chose, including the `'system'` deferral. */
  theme: ThemePreference
  /** What is actually painted right now — `'system'` already resolved against the OS. */
  resolved: ResolvedTheme
  /** Change the preference. Persists, and updates `data-theme` on the next render. */
  setTheme: (theme: ThemePreference) => void
}

/**
 * Undefined outside a provider, which `useTheme` turns into a thrown error rather than
 * letting a component render against a guessed theme.
 */
export const ThemeContext = createContext<ThemeState | undefined>(undefined)

/**
 * Read and change the current theme.
 *
 * @returns The active preference, the resolved theme, and a setter.
 * @throws If called outside a `ThemeProvider` — a silent fallback would quietly report
 *   `'light'` and make a real wiring mistake look like a working app.
 */
export function useTheme(): ThemeState {
  const value = useContext(ThemeContext)

  if (value === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return value
}
