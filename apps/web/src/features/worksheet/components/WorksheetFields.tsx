/**
 * Store-bound input fields for the worksheet.
 *
 * These are the only worksheet components that talk to the store; the layout
 * primitives (`FieldRow`, `Card`, …) stay purely presentational. Each field carries
 * an explicit accessible name because `FieldRow`'s label is a plain element with no
 * `htmlFor` association — that name is also what the e2e specs locate inputs by.
 */
import { CurrencyInput } from '../../../components/ui/CurrencyInput'
import { NumberInput } from '../../../components/ui/NumberInput'
import { parseCount, parseUsd } from '../../../lib/format'
import { useNumericField } from '../hooks/useNumericField'

const formatPlain = (v: number): string => (v === 0 ? '' : String(v))

export type MoneyFieldProps = {
  label: string
  value: number
  onCommit: (next: number) => void
}

/** A dollar amount bound to the store. */
export function MoneyField({ label, value, onCommit }: MoneyFieldProps) {
  const field = useNumericField(value, onCommit, parseUsd, formatPlain)
  return (
    <CurrencyInput
      aria-label={label}
      placeholder="0"
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={field.error}
    />
  )
}

export type CountFieldProps = {
  label: string
  value: number
  onCommit: (next: number) => void
}

/** A whole-number count (overnights) bound to the store. */
export function CountField({ label, value, onCommit }: CountFieldProps) {
  const field = useNumericField(value, onCommit, parseCount, (v) => String(v))
  return (
    <NumberInput
      aria-label={label}
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={field.error}
    />
  )
}
