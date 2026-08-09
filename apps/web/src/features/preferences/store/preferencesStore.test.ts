/**
 * Preferences store tests.
 *
 * The load-bearing property is isolation from `worksheetStore`: resetting the worksheet
 * clears the user's financial input, and it must never take their theme with it.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferencesStore } from './preferencesStore'
import { useWorksheetStore } from '../../worksheet/store/worksheetStore'
import { createMemoryPreferences } from '../../../services/preferences'

beforeEach(() => {
  usePreferencesStore.getState().hydrate(createMemoryPreferences())
})

describe('preferencesStore', () => {
  it('hydrates from the injected repository', () => {
    usePreferencesStore
      .getState()
      .hydrate(createMemoryPreferences({ version: 1, theme: 'dark', parentNames: { a: '', b: '' } }))
    expect(usePreferencesStore.getState().preferences.theme).toBe('dark')
  })

  it('writes a change through to storage immediately', () => {
    const repo = createMemoryPreferences()
    usePreferencesStore.getState().hydrate(repo)

    usePreferencesStore.getState().setTheme('dark')

    expect(usePreferencesStore.getState().preferences.theme).toBe('dark')
    expect(repo.load().theme).toBe('dark')
  })

  it('keeps the theme when the worksheet is reset', () => {
    usePreferencesStore.getState().setTheme('dark')

    // Clearing financial input is a different concern from clearing UI chrome.
    useWorksheetStore.getState().reset()

    expect(usePreferencesStore.getState().preferences.theme).toBe('dark')
  })

  it('keeps working when the repository cannot persist', () => {
    // Simulates a full or blocked store: `save` is a no-op, `load` never sees the write.
    const failing = {
      load: () => ({ version: 1, theme: 'system', parentNames: { a: '', b: '' } }) as const,
      save: () => {},
    }
    usePreferencesStore.getState().hydrate(failing)

    usePreferencesStore.getState().setTheme('dark')

    // The session still reflects the choice even though nothing was persisted — the UI must
    // not depend on the write succeeding.
    expect(usePreferencesStore.getState().preferences.theme).toBe('dark')
  })

  it('remembers one parent name and persists it', () => {
    const repo = createMemoryPreferences()
    usePreferencesStore.getState().hydrate(repo)

    usePreferencesStore.getState().setParentName('a', 'Jane')

    expect(usePreferencesStore.getState().preferences.parentNames).toEqual({ a: 'Jane', b: '' })
    expect(repo.load().parentNames).toEqual({ a: 'Jane', b: '' })
  })

  it('clears both saved names without touching the theme', () => {
    const repo = createMemoryPreferences()
    usePreferencesStore.getState().hydrate(repo)
    usePreferencesStore.getState().setTheme('dark')
    usePreferencesStore.getState().setParentName('a', 'Jane')
    usePreferencesStore.getState().setParentName('b', 'John')

    usePreferencesStore.getState().clearParentNames()

    expect(usePreferencesStore.getState().preferences.parentNames).toEqual({ a: '', b: '' })
    expect(usePreferencesStore.getState().preferences.theme).toBe('dark')
    expect(repo.load().parentNames).toEqual({ a: '', b: '' })
  })

  it('keeps saved parent names when the worksheet is reset', () => {
    usePreferencesStore.getState().setParentName('a', 'Jane')

    useWorksheetStore.getState().reset()

    expect(usePreferencesStore.getState().preferences.parentNames.a).toBe('Jane')
  })
})
