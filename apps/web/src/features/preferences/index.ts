/**
 * Public API of the preferences feature.
 *
 * Import from here, not from the files inside — the same convention as
 * `features/navigation` and `features/worksheet`.
 */
export { ThemeProvider } from './ThemeProvider'
export { useTheme, type ThemeState } from './hooks/useTheme'
export { usePreferencesStore } from './store/preferencesStore'
export { nextTheme, resolveTheme, themeLabel, DARK_SCHEME_QUERY, THEME_CYCLE } from './theme'
