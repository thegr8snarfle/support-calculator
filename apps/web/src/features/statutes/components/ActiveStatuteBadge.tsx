// Imports the hook directly rather than the `worksheet` barrel: the barrel re-exports
// `WorksheetPage`, which renders this component, so going through `../../worksheet`
// would be a circular import between the two feature barrels.
import { useRules } from '../../worksheet/hooks/useRules'
import { formatIsoDateLong } from '../../../lib/format'

/**
 * Read-only badge naming the statute version currently applied to the worksheet.
 * Purely informational — no click target, no link — per "not editable by the user
 * yet." Reaching the full statute library is only via the header's entry point.
 */
export function ActiveStatuteBadge() {
  const { rules } = useRules()
  if (!rules) return null

  return (
    <div className="inline-flex items-center gap-2 rounded-pill border border-border px-3 py-[5px] text-[12px] text-text-muted mb-4">
      <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full bg-positive" />
      <span>
        {rules.jurisdiction.name} — {rules.citations.primary}, effective{' '}
        {formatIsoDateLong(rules.effective.from)}
        {rules.effective.enactedBy && <> ({rules.effective.enactedBy})</>}
      </span>
    </div>
  )
}
