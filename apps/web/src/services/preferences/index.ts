/**
 * Public API of the preferences data layer.
 *
 * Consumers depend on the {@link PreferencesRepository} port and the factory below — never
 * on a concrete adapter — mirroring `services/rules`.
 */
import {
  createLocalStoragePreferences,
  getBrowserStorage,
  isStorageAvailable,
  type StorageLike,
} from './localStoragePreferences'
import { createMemoryPreferences } from './memoryPreferences'
import type { PreferencesRepository } from './preferencesRepository'

export type { PreferencesRepository } from './preferencesRepository'
export { PREFERENCES_KEY } from './preferencesRepository'
export { parsePreferences, preferencesSchema } from './preferencesSchema'
export {
  createLocalStoragePreferences,
  getBrowserStorage,
  isStorageAvailable,
  type StorageLike,
} from './localStoragePreferences'
export { createMemoryPreferences } from './memoryPreferences'

/**
 * Build the best available repository for this environment.
 *
 * Falls back to in-memory when storage cannot be used, so callers never branch on storage
 * availability — they always get a working repository, one of which happens to forget on
 * reload.
 *
 * @param storage Storage to use; defaults to the browser's `localStorage`.
 * @returns A storage-backed repository, or an in-memory one as fallback.
 */
export function createPreferencesRepository(
  storage: StorageLike | null = getBrowserStorage(),
): PreferencesRepository {
  return isStorageAvailable(storage)
    ? createLocalStoragePreferences(storage)
    : createMemoryPreferences()
}

/** The app-wide repository. Tests inject their own rather than using this. */
export const defaultPreferencesRepository: PreferencesRepository = createPreferencesRepository()
