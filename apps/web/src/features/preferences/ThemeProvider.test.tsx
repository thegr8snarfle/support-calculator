/**
 * Theme provider behaviour.
 *
 * The interesting cases are all about `'system'` being a *live deferral* rather than a
 * stored color: it must track the OS while selected, and stop tracking the moment the user
 * pins a theme. Both are invisible to a snapshot test and easy to break.
 */
import { render, screen, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './hooks/useTheme'
import { usePreferencesStore } from './store/preferencesStore'
import { createMemoryPreferences } from '../../services/preferences'
import { setPrefersDark } from '../../test/setup'
import type { Preferences } from '../../types/preferences'

/** Mount the provider over an in-memory store seeded with `initial`. */
function setup(initial?: Preferences) {
  usePreferencesStore.getState().hydrate(createMemoryPreferences(initial))
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

function Probe() {
  const { theme, resolved, setTheme } = useTheme()
  return (
    <div>
      <span>{`pref:${theme}`}</span>
      <span>{`resolved:${resolved}`}</span>
      <button type="button" onClick={() => setTheme('light')}>
        pin light
      </button>
    </div>
  )
}

const themeAttr = () => document.documentElement.getAttribute('data-theme')

beforeEach(() => {
  // Each test starts from a fresh in-memory repository, so nothing leaks between them.
  usePreferencesStore.getState().hydrate(createMemoryPreferences())
})

describe('useTheme', () => {
  it('throws outside a provider rather than guessing a theme', () => {
    expect(() => render(<Probe />)).toThrow(/within a ThemeProvider/)
  })
})

describe('ThemeProvider', () => {
  it('applies a stored preference to the document', () => {
    setup({ version: 1, theme: 'dark', parentNames: { a: '', b: '' } })
    expect(screen.getByText('pref:dark')).toBeInTheDocument()
    expect(themeAttr()).toBe('dark')
  })

  it('resolves system against the OS', () => {
    setPrefersDark(true)
    setup({ version: 1, theme: 'system', parentNames: { a: '', b: '' } })

    // The preference stays 'system' — only the resolved value is dark.
    expect(screen.getByText('pref:system')).toBeInTheDocument()
    expect(screen.getByText('resolved:dark')).toBeInTheDocument()
    expect(themeAttr()).toBe('dark')
  })

  it('follows the OS live while set to system', () => {
    setup({ version: 1, theme: 'system', parentNames: { a: '', b: '' } })
    expect(themeAttr()).toBe('light')

    // The user changes their OS theme with the app open.
    act(() => setPrefersDark(true))

    expect(screen.getByText('resolved:dark')).toBeInTheDocument()
    expect(themeAttr()).toBe('dark')
  })

  it('stops following the OS once a theme is pinned', () => {
    setup({ version: 1, theme: 'light', parentNames: { a: '', b: '' } })

    act(() => setPrefersDark(true))

    // An explicit choice outranks the OS; otherwise "light" would be unusable on a
    // dark-mode machine.
    expect(screen.getByText('resolved:light')).toBeInTheDocument()
    expect(themeAttr()).toBe('light')
  })

  it('persists a change through the repository', () => {
    const repo = createMemoryPreferences()
    usePreferencesStore.getState().hydrate(repo)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    act(() => {
      screen.getByRole('button', { name: 'pin light' }).click()
    })

    // Written through on change, not on unmount — a crash or a force-quit must not lose it.
    expect(repo.load().theme).toBe('light')
    expect(themeAttr()).toBe('light')
  })
})
