/**
 * Pure theme helpers — no React, no DOM writes, so they can be unit-tested directly and
 * reused by both the provider and the header.
 */
import type { ResolvedTheme, ThemePreference } from '../../types/preferences'

/** Media query that answers "does the OS want dark?". */
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

/**
 * Turn the user's stated preference into a theme that can actually be painted.
 *
 * @param preference What the user chose, possibly the `'system'` deferral.
 * @param prefersDark Whether the OS currently reports a dark color scheme.
 * @returns The theme to write to `data-theme`.
 */
export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

/**
 * Order the toggle cycles through.
 *
 * `system` first because it is the default, so the first click moves a user *away* from the
 * OS rather than between two pinned colors — and a third click returns them to it, making
 * the deferral reachable instead of a one-way door.
 */
export const THEME_CYCLE: readonly ThemePreference[] = ['system', 'light', 'dark']

/**
 * The next preference in the cycle.
 *
 * @param current The active preference.
 * @returns The preference one step along, wrapping at the end.
 */
export function nextTheme(current: ThemePreference): ThemePreference {
  const i = THEME_CYCLE.indexOf(current)
  // An unrecognised value (only reachable if storage validation were ever bypassed) starts
  // the cycle over rather than getting stuck at -1 → index 0 by accident.
  if (i === -1) return THEME_CYCLE[0]
  return THEME_CYCLE[(i + 1) % THEME_CYCLE.length]
}

/** Human-readable label for the toggle button. */
export function themeLabel(preference: ThemePreference): string {
  switch (preference) {
    case 'light':
      return 'Light'
    case 'dark':
      return 'Dark'
    case 'system':
      return 'System'
  }
}
