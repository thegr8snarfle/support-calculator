/**
 * Vitest setup — runs before every test file.
 *
 * Adds jest-dom's DOM matchers (`toBeInTheDocument`, `toHaveValue`, …) and clears
 * React Testing Library's rendered trees between tests so component/hook suites
 * stay isolated.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

/**
 * `matchMedia` stub — jsdom does not implement it.
 *
 * `ThemeProvider` subscribes to `(prefers-color-scheme: dark)`, so without this every test
 * that renders the app shell throws. The stub reports light and records its listeners, so a
 * test can drive an OS theme change via {@link setPrefersDark}.
 */
type MediaListener = (event: MediaQueryListEvent) => void

const listeners = new Set<MediaListener>()
let prefersDark = false

/**
 * Simulate the OS flipping its color scheme, notifying anything subscribed.
 *
 * @param value Whether the OS should now report a dark color scheme.
 */
export function setPrefersDark(value: boolean): void {
  prefersDark = value
  // Only the dark-scheme query is modelled, so every listener is a listener for it.
  for (const listener of listeners) {
    listener({ matches: value } as MediaQueryListEvent)
  }
}

beforeEach(() => {
  // Reset between tests: a leaked `true` would make an unrelated suite render in dark.
  prefersDark = false
  listeners.clear()

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList =>
      ({
        media: query,
        // The app only ever asks about dark, so a single flag backs every query.
        get matches() {
          return prefersDark
        },
        onchange: null,
        addEventListener: (_: string, listener: MediaListener) => {
          listeners.add(listener)
        },
        removeEventListener: (_: string, listener: MediaListener) => {
          listeners.delete(listener)
        },
        // Legacy API, unused by the app but part of the interface.
        addListener: (listener: MediaListener) => {
          listeners.add(listener)
        },
        removeListener: (listener: MediaListener) => {
          listeners.delete(listener)
        },
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  })
})

afterEach(() => {
  cleanup()
  // The provider writes `data-theme` to the real document, which persists across tests in a
  // file. Clearing it keeps each test's assertions about the attribute honest.
  document.documentElement.removeAttribute('data-theme')
})
