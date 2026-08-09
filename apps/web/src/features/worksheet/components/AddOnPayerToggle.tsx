import { SegmentedToggle } from '../../../components/ui/SegmentedToggle'
import type { Party } from '../../../types/common'

export type AddOnPayerToggleProps = {
  /** The shared-cost line this toggle belongs to, e.g. "Health insurance". */
  lineLabel: string
  nameA: string
  nameB: string
  /** The carrying parent, or `undefined` when the cost is shared pro-rata. */
  value?: Party
  /** Called with the new carrier, or `undefined` to clear back to shared. */
  onChange: (party?: Party) => void
  /** Validation message for this control, if any. */
  error?: string
}

/** Sentinel for "no attribution" — a `SegmentedToggle` value must be a string. */
const SHARED = 'shared'

/**
 * "Who pays this?" for one shared-cost line: **Shared** (split pro-rata, the default) or
 * one of the two parents, who is then credited the full monthly amount.
 *
 * Parent names rather than "Parent A / Parent B" because the whole worksheet addresses the
 * user by name, and a credit is the row where getting the direction wrong matters most.
 */
export function AddOnPayerToggle({
  lineLabel,
  nameA,
  nameB,
  value,
  onChange,
  error,
}: AddOnPayerToggleProps) {
  const options = [
    { label: 'Shared', value: SHARED },
    { label: nameA, value: 'a' },
    { label: nameB, value: 'b' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] text-text-subtle">Paid by</span>
      <SegmentedToggle
        variant="radiogroup"
        options={options}
        value={value ?? SHARED}
        // The sentinel never escapes this component: the store models "shared" as an
        // absent `paidBy`, so it is translated back at the boundary rather than leaking a
        // magic string into the domain types.
        onChange={(next) => onChange(next === SHARED ? undefined : (next as Party))}
        aria-label={`Who pays ${lineLabel}`}
      />
      {error && (
        <span role="alert" className="text-[12px] text-alert">
          {error}
        </span>
      )}
    </div>
  )
}
