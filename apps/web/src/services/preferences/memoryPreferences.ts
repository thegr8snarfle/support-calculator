/**
 * In-memory preferences adapter.
 *
 * Two jobs: the fallback when `localStorage` is unavailable (Safari private mode, disabled
 * site data, a non-browser environment), and the test double so unit tests never touch real
 * storage or leak state between files.
 *
 * Preferences set through this adapter last for the session and vanish on reload. That is
 * the correct degradation — the app works, it just forgets.
 */
import { DEFAULT_PREFERENCES, type Preferences } from '../../types/preferences'
import type { PreferencesRepository } from './preferencesRepository'

/**
 * Create an isolated in-memory repository.
 *
 * @param initial Seed value, so a test can start from a known preference without
 *   pretending to write one first.
 * @returns A repository backed by a closure variable.
 */
export function createMemoryPreferences(
  initial: Preferences = DEFAULT_PREFERENCES,
): PreferencesRepository {
  // Cloned so a caller's object cannot be mutated out from under the repository (and so a
  // shared DEFAULT_PREFERENCES is never the live value).
  let current: Preferences = { ...initial }

  return {
    load: () => ({ ...current }),
    save: (preferences) => {
      current = { ...preferences }
    },
  }
}
