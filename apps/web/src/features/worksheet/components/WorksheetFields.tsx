/**
 * Store-bound input fields for the worksheet.
 *
 * These are the only worksheet components that talk to the store; the layout primitives
 * (`FieldRow`, `Card`, …) stay purely presentational. Each field carries an explicit
 * accessible name because `FieldRow`'s label is a plain element with no `htmlFor`
 * association — that name is also what the e2e specs locate inputs by.
 *
 * Fields stay **prop-driven** for their error text rather than reading `useValidation()`
 * themselves. They already receive `label`/`value`/`onCommit` from `WorksheetPage`, which
 * does the map lookup once per input; reading context here would buy nothing and would tie
 * a shared-looking component to the worksheet feature.
 */
import { useId } from 'react'
import type { ReactNode } from 'react'
import { CurrencyInput } from '../../../components/ui/CurrencyInput'
import { ErrorTip } from '../../../components/ui/ErrorTip'
import { NumberInput } from '../../../components/ui/NumberInput'
import { parseCount, parseUsd } from '../../../lib/format'
import { useNumericField } from '../hooks/useNumericField'

const formatPlain = (v: number): string => (v === 0 ? '' : String(v))

/** Shown when the field holds text that isn't a number at all. */
const PARSE_ERROR_MESSAGE = 'Enter a number.'

/**
 * Resolve the single message a field should display.
 *
 * A field can be wrong in two independent ways at once — unparseable text held in the local
 * draft, and a validation error derived from the store — so precedence has to be explicit.
 * **The parse error wins:** you cannot range-check what you cannot parse, and telling
 * someone their overnights don't add to 365 while the box reads "abc" is noise.
 *
 * @param parseError - Whether the local draft is unparseable (from `useNumericField`).
 * @param validationError - The message from `useValidation`, if this field has one.
 * @returns The message to render, or `undefined` when the field is fine.
 */
function resolveMessage(
  parseError: boolean,
  validationError: string | undefined,
): string | undefined {
  if (parseError) return PARSE_ERROR_MESSAGE
  return validationError
}

/**
 * Wraps an input so its error bubble can position against it.
 *
 * `group` drives the CSS-only hover/focus reveal inside `ErrorTip`; `relative` is what the
 * bubble anchors to.
 */
function FieldShell({ children }: { children: ReactNode }) {
  return <span className="group relative block">{children}</span>
}

export type MoneyFieldProps = {
  label: string
  value: number
  onCommit: (next: number) => void
  /**
   * Canonical field id from `fieldIds` (`domain/support/validate.ts`), applied as the
   * input's DOM `id` so the validation summary can move focus straight to it.
   */
  fieldId: string
  /** Validation message for this input, from `useValidation().fieldErrors`. */
  error?: string
}

/** A dollar amount bound to the store. */
export function MoneyField({ label, value, onCommit, fieldId, error }: MoneyFieldProps) {
  const field = useNumericField(value, onCommit, parseUsd, formatPlain)
  const tipId = useId()
  const message = resolveMessage(field.error, error)

  return (
    <FieldShell>
      <CurrencyInput
        id={fieldId}
        aria-label={label}
        placeholder="0"
        value={field.value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        error={message !== undefined}
        // Only point at the bubble when there is one to read; a dangling reference is
        // announced as empty by some screen readers.
        aria-describedby={message !== undefined ? tipId : undefined}
      />
      {message !== undefined && <ErrorTip id={tipId} message={message} />}
    </FieldShell>
  )
}

export type CountFieldProps = {
  label: string
  value: number
  onCommit: (next: number) => void
  /**
   * Canonical field id from `fieldIds` (`domain/support/validate.ts`), applied as the
   * input's DOM `id` so the validation summary can move focus straight to it.
   */
  fieldId: string
  /** Validation message for this input, from `useValidation().fieldErrors`. */
  error?: string
}

/** A whole-number count (overnights) bound to the store. */
export function CountField({ label, value, onCommit, fieldId, error }: CountFieldProps) {
  const field = useNumericField(value, onCommit, parseCount, (v) => String(v))
  const tipId = useId()
  const message = resolveMessage(field.error, error)

  return (
    <FieldShell>
      <NumberInput
        id={fieldId}
        aria-label={label}
        value={field.value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        error={message !== undefined}
        aria-describedby={message !== undefined ? tipId : undefined}
      />
      {message !== undefined && <ErrorTip id={tipId} message={message} />}
    </FieldShell>
  )
}
