/**
 * The `localStorage` preferences adapter.
 *
 * Every access is wrapped, because `localStorage` throws more often than its API suggests:
 * merely *touching* `window.localStorage` raises a `SecurityError` when site data is
 * blocked, and `setItem` raises `QuotaExceededError` when the origin is full — which Safari
 * does aggressively in private mode. A preference is not worth a white screen, so all
 * failures degrade to "did not persist."
 *
 * Under Tauri this works with no plugin and no CSP change (storage is not gated by CSP),
 * with two behaviours worth knowing:
 *
 * - Dev (`http://localhost:3000`) and production (`tauri://localhost`) are **different
 *   origins** with separate buckets — a preference set under `desktop:dev` will not appear
 *   in the bundled app. Not a bug; browsers isolate storage by origin.
 * - The WKWebView data store is keyed to the bundle **identifier**, so changing
 *   `com.cbmds.support-calculator` in `tauri.conf.json` resets stored preferences.
 */
import { parsePreferences } from './preferencesSchema'
import { PREFERENCES_KEY, type PreferencesRepository } from './preferencesRepository'
import { DEFAULT_PREFERENCES, type Preferences } from '../../types/preferences'

/**
 * The slice of the `Storage` API this adapter uses.
 *
 * Narrowed to three methods so tests can pass a plain object — the project convention is to
 * inject a fake rather than mock the module. It also keeps the adapter honest about how
 * little of `Storage` it actually depends on.
 */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/**
 * The browser's `localStorage`, or `null` where there isn't one.
 *
 * Reading the property is itself inside the try: when site data is blocked, the *access*
 * throws, not just the call.
 *
 * @returns The ambient storage, or `null` if it cannot be reached.
 */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Whether a storage object is actually usable.
 *
 * Feature-*detection*, not feature-*presence*: the property can exist and still throw on
 * use, so the only reliable check is a real round-trip through it.
 *
 * @param storage Storage to probe; defaults to the browser's.
 * @returns `true` if a value can be written and removed without throwing.
 */
export function isStorageAvailable(storage: StorageLike | null = getBrowserStorage()): boolean {
  if (storage === null) return false
  try {
    // A dedicated probe key, removed immediately — writing to the real key would clobber
    // stored preferences just to answer "can I write?".
    const probe = '__support-calculator.probe__'
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/**
 * Create a repository backed by a `Storage`.
 *
 * @param storage Where to read and write; defaults to the browser's `localStorage`.
 * @returns A repository whose `load` falls back to defaults and whose `save` is a no-op
 *   when storage misbehaves.
 */
export function createLocalStoragePreferences(
  storage: StorageLike | null = getBrowserStorage(),
): PreferencesRepository {
  return {
    load: () => {
      if (storage === null) return DEFAULT_PREFERENCES
      try {
        // `parsePreferences` handles `null` (nothing stored) and any invalid payload, so
        // this only has to survive the read itself throwing.
        return parsePreferences(storage.getItem(PREFERENCES_KEY))
      } catch {
        return DEFAULT_PREFERENCES
      }
    },

    save: (preferences: Preferences) => {
      if (storage === null) return
      try {
        storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
      } catch {
        // Quota exceeded, or storage revoked mid-session. The in-memory store already holds
        // the new value, so the UI stays correct for this session — it just will not
        // survive a reload. Nothing useful to tell the user about a theme that did not save.
      }
    },
  }
}
