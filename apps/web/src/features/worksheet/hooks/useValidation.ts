/**
 * Context + consumer hook for worksheet validation.
 *
 * Split from `ValidationProvider.tsx` for the same reason `useStepFlow.ts` is split from
 * `StepFlowProvider.tsx`: `react-refresh/only-export-components` flags a module that exports
 * both a component and non-component values.
 *
 * Validation is shared through context rather than recomputed per consumer because it runs on
 * every keystroke and has many readers (each field, the summary, the rail, and two hooks).
 * One provider means one `validateWorksheet` call per input change.
 */
import { createContext, useContext } from 'react'
import type { ValidationError } from '../../../types/support'

/** Everything the validation layer publishes to the component graph. */
export type WorksheetValidation = {
  /** Blocking errors in form order — the validation summary renders this directly. */
  errors: ValidationError[]
  /**
   * Field id → message, from `errorsByField`. Lets an input look up its own error in
   * constant time instead of scanning `errors` once per field.
   */
  fieldErrors: Record<string, string>
  /** Convenience for the common check; equivalent to `errors.length > 0`. */
  hasErrors: boolean
}

/**
 * Undefined outside a provider, which `useValidation` turns into a thrown error rather than
 * letting a component silently render as if the worksheet were valid.
 */
export const ValidationContext = createContext<WorksheetValidation | undefined>(undefined)

/**
 * Read the current worksheet validation state.
 *
 * Safe to call from anywhere under `ValidationProvider` — fields, the summary, the results
 * rail, or another hook. No prop drilling and no duplicated computation.
 *
 * @returns The shared validation state for the current worksheet input.
 * @throws If called outside a `ValidationProvider`. Failing loudly matters here: a silent
 *   fallback would report "no errors" and re-open the gate this layer exists to close.
 */
export function useValidation(): WorksheetValidation {
  const value = useContext(ValidationContext)

  if (value === undefined) {
    throw new Error('useValidation must be used within a ValidationProvider')
  }

  return value
}
