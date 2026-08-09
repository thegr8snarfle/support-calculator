/**
 * User preference types — the settings that survive between sessions.
 *
 * Deliberately narrow. Preferences are *UI choices*, not user data: the worksheet's income,
 * overnights and children counts are intentionally absent — persisting them is a product
 * decision needing a visible "clear my data" affordance, not a quiet field addition here.
 *
 * `parentNames` is the one deliberate exception to "never identify a person": first names
 * only, never leaves the device, no financial or case data attached. It ships with exactly
 * the affordance this file used to say such a field would need — a "Clear saved names"
 * control in the worksheet UI (`WorksheetPage`) that wipes the persisted value on request.
 */
import type { Party } from './common'

/**
 * The theme setting as the user expressed it — which is not the same as the theme that
 * ends up on screen.
 *
 * `'system'` is a *deferral*, not a color: it means "whatever the OS says, including when
 * the OS changes its mind." It is the default so a dark-mode user gets a dark app on first
 * run without touching anything, and so choosing it again hands control back to the OS.
 * Resolving it to an actual color is `resolveTheme`'s job.
 */
export type ThemePreference = 'light' | 'dark' | 'system'

/** A theme that can actually be painted — what `data-theme` is ever set to. */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Everything persisted between sessions, as one versioned record.
 *
 * `version` exists so a future shape change can migrate rather than discard. It is checked
 * on load: an unrecognised version falls back to defaults instead of being coerced, because
 * guessing at an unknown shape is how stale data corrupts a fresh build.
 */
export type Preferences = {
  version: 1
  theme: ThemePreference
  /** Remembered worksheet party names, so a returning user isn't retyping them. */
  parentNames: Record<Party, string>
}

/** Used on first run, and whenever stored data is missing, corrupt or unreadable. */
export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  theme: 'system',
  parentNames: { a: '', b: '' },
}
