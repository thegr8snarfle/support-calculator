/**
 * Vitest setup — runs before every test file.
 *
 * Adds jest-dom's DOM matchers (`toBeInTheDocument`, `toHaveValue`, …) and clears
 * React Testing Library's rendered trees between tests so component/hook suites
 * stay isolated.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
