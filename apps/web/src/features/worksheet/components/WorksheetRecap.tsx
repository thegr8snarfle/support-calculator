import { FieldRow } from '../../../components/ui/FieldRow'
import { PartyHeader } from '../../../components/ui/PartyHeader'
import { RecapCard } from '../../../components/ui/RecapCard'
import { RecapValue } from '../../../components/ui/RecapValue'
import { ParentingTimeBar } from './ParentingTimeBar'
import { WORKSHEET_SECTIONS } from '../sections'
import { useWorksheetStore } from '../store/worksheetStore'
import { useRules } from '../hooks/useRules'
import { formatUsd } from '../../../lib/format'

export type WorksheetRecapProps = {
  /**
   * When provided, each recap card shows an "Edit" affordance that calls this with the
   * target worksheet section id. Omit for a read-only recap (the printable Results page).
   */
  onEdit?: (sectionId: string) => void
}

/**
 * Read-only, grouped recap of everything the worksheet collects, read from the
 * worksheet store. Shared by the Review step (with Edit links back to the worksheet)
 * and the Results step (read-only) so the two recaps can never drift apart.
 */
export function WorksheetRecap({ onEdit }: WorksheetRecapProps) {
  const input = useWorksheetStore((s) => s.input)
  const { rules } = useRules()
  const { parties, childrenCount, income, parentingTime, addOns } = input
  const incomeLines = rules?.incomeLines ?? []
  const addOnLines = rules?.addOnLines ?? []

  // Carries the documentation/agreement advisory onto Review *and* the printable Results
  // page — the latter being the artefact a user is most likely to take to a hearing.
  const anyAttributed = Object.values(addOns).some(
    (entry) => entry.paidBy !== undefined && entry.amount > 0,
  )

  const edit = (sectionId: string, label: string) =>
    onEdit ? <EditLink label={label} onClick={() => onEdit(sectionId)} /> : undefined

  return (
    <>
      {/* 1 · Children */}
      <RecapCard step={1} title="Children in this case" action={edit(WORKSHEET_SECTIONS.children, 'children')}>
        <FieldRow
          label="Children eligible for support"
          divider={false}
          wide={<RecapValue>{childrenCount}</RecapValue>}
        />
      </RecapCard>

      {/* 2 · Monthly income */}
      <RecapCard step={2} title="Monthly income" action={edit(WORKSHEET_SECTIONS.income, 'monthly income')}>
        <PartyHeader nameA={parties.a.name} nameB={parties.b.name} />
        {incomeLines.map((line, i) => {
          const row = income[line.id] ?? { a: 0, b: 0 }
          return (
            <FieldRow
              key={line.id}
              label={line.label}
              hint={line.hint}
              divider={i !== 0}
              a={<RecapValue muted={row.a === 0}>{formatUsd(row.a)}</RecapValue>}
              b={<RecapValue muted={row.b === 0}>{formatUsd(row.b)}</RecapValue>}
            />
          )
        })}
      </RecapCard>

      {/* 3 · Parenting time */}
      <RecapCard step={3} title="Parenting time" action={edit(WORKSHEET_SECTIONS.parenting, 'parenting time')}>
        <ParentingTimeBar
          nameA={parties.a.name}
          nameB={parties.b.name}
          nightsA={parentingTime.a}
          nightsB={parentingTime.b}
          yearNights={rules?.yearNights}
        />
      </RecapCard>

      {/* 4 · Monthly shared costs */}
      <RecapCard step={4} title="Monthly shared costs" action={edit(WORKSHEET_SECTIONS.costs, 'shared costs')}>
        {addOnLines.map((line, i) => {
          const entry = addOns[line.id]
          // Only a line with money on it can be carried, matching the engine's rule that a
          // $0 attribution is not a credit.
          const carrier =
            entry?.paidBy !== undefined && entry.amount > 0
              ? parties[entry.paidBy].name
              : null
          return (
            <FieldRow
              key={line.id}
              label={line.label}
              hint={line.hint}
              divider={i !== 0}
              wide={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {carrier && (
                    <span className="rounded-pill bg-primary-weak px-2 py-0.5 text-[11px] font-semibold text-primary">
                      Paid by {carrier}
                    </span>
                  )}
                  <RecapValue>{formatUsd(entry?.amount ?? 0)}</RecapValue>
                </div>
              }
            />
          )
        })}
        {anyAttributed && (
          <p className="mt-3 text-[12px] text-text-muted" role="note">
            Costs marked as paid by one parent are credited to them in full, and must be
            documented and agreed by both parents or ordered by the court.
          </p>
        )}
      </RecapCard>
    </>
  )
}

type EditLinkProps = {
  /** Labels the control for assistive tech, e.g. "Edit monthly income". */
  label: string
  onClick: () => void
}

/** The "Edit" affordance in a recap card header (jumps to the worksheet section). */
function EditLink({ label, onClick }: EditLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Edit ${label}`}
      className="flex-none text-[13px] font-semibold text-primary rounded-sm px-1 py-0.5 hover:underline focus-ring cursor-pointer"
    >
      Edit
    </button>
  )
}
