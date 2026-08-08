/**
 * Preferences state (Zustand).
 *
 * Holds the user's persisted choices and writes each change straight through to storage.
 * Separate from `worksheetStore` on purpose: `worksheetStore.reset()` clears the user's
 * financial input, and that must never take their theme with it.
 *
 * **No `zustand/middleware` persist.** The middleware would hide two things this app cares
 * about being explicit: the Zod parse at the storage boundary, and the try/catch that keeps
 * a throwing `localStorage` from breaking the boot. Both are testable here and would be
 * buried in config there.
 *
 * Hydration is **synchronous at module init**, so the very first render already has the
 * stored value. An async hydrate would mean one render with the wrong theme — the flash
 * this whole feature exists to remove.
 */
import { create } from 'zustand'
import type { Preferences, ThemePreference } from '../../../types/preferences'
import {
  defaultPreferencesRepository,
  type PreferencesRepository,
} from '../../../services/preferences'

export type PreferencesState = {
  preferences: Preferences

  /** Set the theme preference and persist it. */
  setTheme: (theme: ThemePreference) => void
  /**
   * Re-read preferences from a repository, replacing the one used for future writes.
   * Tests use this to inject an in-memory repository; the app never calls it.
   */
  hydrate: (repo: PreferencesRepository) => void
}

/**
 * The repository this store reads and writes through.
 *
 * Module-level and swappable rather than a constructor argument, because the store is a
 * module singleton created at import time — the same shape as `worksheetStore.loadRules`
 * accepting a repo, adapted to a synchronous source.
 */
let repository: PreferencesRepository = defaultPreferencesRepository

export const usePreferencesStore = create<PreferencesState>((set) => ({
  // Read once, eagerly. `load()` cannot throw (the adapter guarantees it), so an unreadable
  // or corrupt store yields defaults here rather than an exception during module evaluation.
  preferences: repository.load(),

  setTheme: (theme) =>
    set((s) => {
      const next: Preferences = { ...s.preferences, theme }
      // Write through immediately. If storage is full or blocked this is a silent no-op and
      // the value still applies for the session — the UI must not depend on the write.
      repository.save(next)
      return { preferences: next }
    }),

  hydrate: (repo) => {
    repository = repo
    set({ preferences: repo.load() })
  },
}))
