/**
 * Adapter tests — the failure modes, mostly.
 *
 * `localStorage` throws more often than its API suggests: touching it at all raises when
 * site data is blocked, and `setItem` raises on quota (Safari private mode does both). The
 * contract is that none of that reaches the caller.
 *
 * Storage is **injected** rather than module-mocked, per the project's testing convention —
 * which also keeps these tests independent of whether the JS runtime happens to supply a
 * working ambient `localStorage`.
 */
import { describe, expect, it } from 'vitest'
import {
  createLocalStoragePreferences,
  isStorageAvailable,
  type StorageLike,
} from './localStoragePreferences'
import { PREFERENCES_KEY } from './preferencesRepository'
import { createPreferencesRepository } from './index'
import { DEFAULT_PREFERENCES, type Preferences } from '../../types/preferences'

const DARK: Preferences = { version: 1, theme: 'dark' }

/** A working in-memory stand-in for `Storage`. */
function fakeStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed))
  return {
    map,
    storage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, value)
      },
      removeItem: (key: string) => {
        map.delete(key)
      },
    } satisfies StorageLike,
  }
}

/** Storage that throws on every operation — blocked site data. */
const blockedStorage: StorageLike = {
  getItem: () => {
    throw new DOMException('denied', 'SecurityError')
  },
  setItem: () => {
    throw new DOMException('denied', 'SecurityError')
  },
  removeItem: () => {
    throw new DOMException('denied', 'SecurityError')
  },
}

/** Storage that reads fine but cannot accept writes — quota exhausted. */
const fullStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {
    throw new DOMException('full', 'QuotaExceededError')
  },
  removeItem: () => {},
}

describe('createLocalStoragePreferences', () => {
  it('round-trips a preference', () => {
    const repo = createLocalStoragePreferences(fakeStorage().storage)
    repo.save(DARK)
    expect(repo.load()).toEqual(DARK)
  })

  it('writes under the shared key', () => {
    // The key is the contract with public/theme-init.js, so it is asserted explicitly.
    const { map, storage } = fakeStorage()
    createLocalStoragePreferences(storage).save(DARK)
    expect(map.get(PREFERENCES_KEY)).toBe(JSON.stringify(DARK))
  })

  it('returns defaults when nothing is stored', () => {
    expect(createLocalStoragePreferences(fakeStorage().storage).load()).toEqual(
      DEFAULT_PREFERENCES,
    )
  })

  it('returns defaults for a corrupt stored value', () => {
    const { storage } = fakeStorage({ [PREFERENCES_KEY]: '{not json' })
    expect(createLocalStoragePreferences(storage).load()).toEqual(DEFAULT_PREFERENCES)
  })

  it('survives a throwing read', () => {
    const repo = createLocalStoragePreferences(blockedStorage)
    expect(() => repo.load()).not.toThrow()
    expect(repo.load()).toEqual(DEFAULT_PREFERENCES)
  })

  it('survives a quota error on write', () => {
    // The theme still applies for the session; it just will not survive a reload. A failed
    // save must never surface as an exception in a click handler.
    expect(() => createLocalStoragePreferences(fullStorage).save(DARK)).not.toThrow()
  })

  it('degrades to defaults when there is no storage at all', () => {
    const repo = createLocalStoragePreferences(null)
    expect(repo.load()).toEqual(DEFAULT_PREFERENCES)
    expect(() => repo.save(DARK)).not.toThrow()
  })
})

describe('isStorageAvailable', () => {
  it('is true for working storage', () => {
    expect(isStorageAvailable(fakeStorage().storage)).toBe(true)
  })

  it('is false when storage throws on write', () => {
    expect(isStorageAvailable(blockedStorage)).toBe(false)
  })

  it('is false when there is no storage', () => {
    expect(isStorageAvailable(null)).toBe(false)
  })

  it('leaves no probe key behind', () => {
    const { map, storage } = fakeStorage()
    isStorageAvailable(storage)
    expect(map.size).toBe(0)
  })
})

describe('createPreferencesRepository', () => {
  it('uses storage when it works', () => {
    const { map, storage } = fakeStorage()
    createPreferencesRepository(storage).save(DARK)
    expect(map.get(PREFERENCES_KEY)).toBe(JSON.stringify(DARK))
  })

  it('falls back to a working repository when storage is unusable', () => {
    // The caller never branches on availability — it always gets something that works,
    // one variant of which simply forgets on reload.
    const repo = createPreferencesRepository(blockedStorage)
    repo.save(DARK)
    expect(repo.load()).toEqual(DARK)
  })
})
