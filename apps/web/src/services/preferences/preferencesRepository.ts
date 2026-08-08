/**
 * The preferences storage port.
 *
 * Consumers depend on this type and on `createPreferencesRepository`, never on a concrete
 * adapter — the same discipline as {@link RulesRepository} in `services/rules`. That is what
 * makes a future `tauri-plugin-store` adapter (durable JSON in the app data dir, immune to
 * the WKWebView storage eviction that can hit iOS) a change to one factory rather than to
 * every call site.
 *
 * **Synchronous, unlike `RulesRepository`.** This is a deliberate difference, not an
 * oversight: `localStorage` is synchronous, and the theme has to be known before the first
 * render or the app paints the wrong color and then corrects itself. An async adapter would
 * need a hydration state and a "preferences not loaded yet" branch in every consumer. If a
 * Tauri adapter ever forces that, it should be introduced as a separate async port rather
 * than by making this one async and awaiting it everywhere.
 */
import type { Preferences } from '../../types/preferences'

/**
 * Where preferences live in `localStorage`.
 *
 * **Also hardcoded in `public/theme-init.js`**, which runs before the bundle exists and so
 * cannot import this. `preferencesContract.test.ts` asserts the two agree — if you change
 * this key, that test fails and tells you which other file to change.
 */
export const PREFERENCES_KEY = 'support-calculator.preferences'

/**
 * Read and write the user's persisted preferences.
 *
 * Neither method throws. Storage is a best-effort convenience — a browser in private mode,
 * a full disk, or a user who has disabled site data should all degrade to "preferences do
 * not stick," never to a broken app.
 */
export type PreferencesRepository = {
  /** Current preferences, or the defaults when nothing valid is stored. */
  load: () => Preferences
  /** Persist preferences. Silently a no-op if storage is unavailable or full. */
  save: (preferences: Preferences) => void
}
