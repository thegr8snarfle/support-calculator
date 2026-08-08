/**
 * Binds a numeric store value to a text input.
 *
 * While the user is typing we hold a local *draft* string, so a field can be emptied
 * or hold a partial entry ("4,") without the store fighting the caret. The draft is
 * cleared on blur, after which the displayed value derives straight from the store —
 * which is why this needs no effect and no re-sync: an external change (reset, or
 * another control) is reflected the moment the field isn't being edited.
 *
 * Invalid input surfaces `error` rather than silently coercing to 0 — a support
 * figure quietly reading as zero is the kind of wrong that looks right.
 */
import { useState } from 'react'

export type NumericFieldBinding = {
  value: string
  onChange: (event: { target: { value: string } }) => void
  onBlur: () => void
  error: boolean
}

export function useNumericField(
  storeValue: number,
  commit: (next: number) => void,
  parse: (raw: string) => number | null,
  format: (value: number) => string = (v) => String(v),
): NumericFieldBinding {
  const [draft, setDraft] = useState<string | null>(null)

  const value = draft ?? format(storeValue)
  const parsed = parse(value)
  const error = value.trim() !== '' && parsed === null

  return {
    value,
    onChange: (event) => {
      const next = event.target.value
      setDraft(next)
      const n = parse(next)
      if (n !== null) commit(n)
      else if (next.trim() === '') commit(0)
    },
    onBlur: () => setDraft(null),
    error,
  }
}
