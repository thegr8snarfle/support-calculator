import { useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { FieldRow } from '../../../components/ui/FieldRow'
import { PartyHeader } from '../../../components/ui/PartyHeader'
import { NumberStepper } from '../../../components/ui/NumberStepper'
import { HelpTip } from '../../../components/ui/HelpTip'
import { FieldError } from '../../../components/ui/FieldError'
import { AddOnPayerToggle } from './AddOnPayerToggle'
import { ActiveStatuteBadge } from '../../statutes'
import { ParentingTimeBar } from './ParentingTimeBar'
import { ResultsRail } from './ResultsRail'
import { SupportCitation } from './SupportCitation'
import { CountField, MoneyField, NameField } from './WorksheetFields'
import { ValidationSummary } from './ValidationSummary'
import { WORKSHEET_SECTIONS } from '../sections'
import { useStepFlow } from '../../navigation'
import { useWorksheetStore } from '../store/worksheetStore'
import { useRules } from '../hooks/useRules'
import { useSupportEstimate } from '../hooks/useSupportEstimate'
import { useWorksheetStatus } from '../hooks/useWorksheetStatus'
import { useValidation } from '../hooks/useValidation'
import { fieldIds } from '../../../domain/support'
import { EMPTY_ESTIMATE } from '../estimateDefaults'
import { truncateName } from '../../../lib/format'
import type { Party } from '../../../types/common'
// Cross-feature import, same as `AppHeader.tsx` — parent names are remembered as a
// preference (`services/preferences`), not worksheet input, so persisting them goes
// through the preferences store rather than `worksheetStore`.
import { usePreferencesStore } from '../../preferences'

/**
 * The Colorado child-support worksheet.
 *
 * Rows are driven by the loaded rule set (`incomeLines` / `addOnLines`) rather than
 * hardcoded, so a statute amendment or a different state changes the form without
 * touching this file. Every input is bound to the worksheet store and the estimate
 * recomputes as you type.
 */
export function WorksheetPage() {
  const { next, pendingScroll, clearPendingScroll } = useStepFlow()
  const { rules, status, error } = useRules()
  const { estimate, stale } = useSupportEstimate()
  // Field-level messages, looked up per input; the summary reads the context itself.
  const { fieldErrors } = useValidation()
  // Publish worksheet validity to the step flow, which gates advancing.
  useWorksheetStatus(estimate)

  const input = useWorksheetStore((s) => s.input)
  const setPartyName = useWorksheetStore((s) => s.setPartyName)
  const setChildrenCount = useWorksheetStore((s) => s.setChildrenCount)
  const setIncome = useWorksheetStore((s) => s.setIncome)
  const setNights = useWorksheetStore((s) => s.setNights)
  const setAddOn = useWorksheetStore((s) => s.setAddOn)
  const setAddOnPayer = useWorksheetStore((s) => s.setAddOnPayer)

  const savedParentNames = usePreferencesStore((s) => s.preferences.parentNames)
  const setSavedParentName = usePreferencesStore((s) => s.setParentName)
  const clearSavedParentNames = usePreferencesStore((s) => s.clearParentNames)
  const anyNameSaved = savedParentNames.a !== '' || savedParentNames.b !== ''

  // Every keystroke updates the live worksheet (so labels elsewhere update as you type) and
  // writes through to the remembered preference in the same action — mirrors `setTheme`'s
  // "write through immediately" pattern, just with two stores instead of one.
  const handleNameChange = (party: Party, name: string) => {
    setPartyName(party, name)
    setSavedParentName(party, name)
  }

  const nameA = input.parties.a.name
  const nameB = input.parties.b.name
  // Truncated for display only — the input's own value and every aria-label below keep the
  // full name; only these two are safe to hand to layouts that can't wrap (PartyHeader,
  // ParentingTimeBar, AddOnPayerToggle, ResultsRail).
  const nameADisplay = truncateName(nameA)
  const nameBDisplay = truncateName(nameB)
  const partyDisplayName = (party: Party) => (party === 'a' ? nameADisplay : nameBDisplay)

  // Drives the standing advisory in section 4. Read from the input rather than from the
  // estimate's warnings so it still shows while the estimate is stale or the rules are
  // still loading — the advice is about what the user typed, not about the figure.
  const anyAttributed = Object.values(input.addOns).some(
    (entry) => entry.paidBy !== undefined && entry.amount > 0,
  )

  // Honor an "Edit" jump from Review: scroll the requested section into view once
  // this page has rendered, then move focus to it and clear the request.
  useEffect(() => {
    if (!pendingScroll) return
    const el = document.getElementById(pendingScroll)
    if (el) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      el.focus({ preventScroll: true })
    }
    clearPendingScroll()
  }, [pendingScroll, clearPendingScroll])

  const maxChildren = rules?.schedule.maxChildren ?? 6

  return (
    <>
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-[0.09em] uppercase text-accent-strong">
          Child Support · Unified Worksheet
        </div>
        <h1 className="font-display font-bold text-[32px] tracking-[-0.02em] my-1.5">
          Let&rsquo;s estimate monthly support.
        </h1>
        <p className="text-text-muted max-w-[56ch] m-0">
          Enter each parent&rsquo;s income, time with the children, and shared costs. Your
          estimate updates as you go — nothing is filed and nothing is saved.
        </p>
      </div>

      {status === 'error' && (
        <div role="alert" className="mb-6">
          <FieldError>{error ?? 'Could not load the support guidelines.'}</FieldError>
        </div>
      )}

      <ActiveStatuteBadge />

      <ValidationSummary className="print:hidden" />

      {estimate && estimate.warnings.length > 0 && (
        <div className="mb-6 flex flex-col gap-1" role="status">
          {estimate.warnings.map((w) => (
            <FieldError key={w}>{w}</FieldError>
          ))}
        </div>
      )}

      {/* `print:block` drops the grid at print time — printing from mid-worksheet (via the
          rail's own Print/Export button) should show the rail as a clean full-width summary,
          not a 340px sidebar squeezed next to a hidden column. */}
      <div className="grid gap-8 items-start lg:grid-cols-[1fr_340px] print:block">
        {/* LEFT: worksheet — hidden when printed; the estimate rail (right) is the summary. */}
        <div className="print:hidden">
          {/* 1. About this case */}
          <Card
            id={WORKSHEET_SECTIONS.children}
            step={1}
            title="About this case"
            hint="Names appear throughout your worksheet, review, and results."
          >
            <PartyHeader nameA={nameADisplay || 'Parent A'} nameB={nameBDisplay || 'Parent B'} />
            <FieldRow
              label="Parent's name"
              divider={false}
              a={
                <NameField
                  label={`Parent A's name`}
                  value={nameA}
                  onCommit={(v) => handleNameChange('a', v)}
                  fieldId={fieldIds.partyName('a')}
                  error={fieldErrors[fieldIds.partyName('a')]}
                />
              }
              b={
                <NameField
                  label={`Parent B's name`}
                  value={nameB}
                  onCommit={(v) => handleNameChange('b', v)}
                  fieldId={fieldIds.partyName('b')}
                  error={fieldErrors[fieldIds.partyName('b')]}
                />
              }
            />
            {anyNameSaved && (
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={clearSavedParentNames}
                  title="Forget these names so they don't fill in next time"
                  className="text-[12px] font-semibold text-primary rounded-sm px-1 py-0.5 hover:underline focus-ring cursor-pointer"
                >
                  Clear saved names
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4">
              <NumberStepper
                label="Children in this case"
                value={input.childrenCount}
                min={1}
                max={maxChildren}
                onDecrement={() => setChildrenCount(input.childrenCount - 1)}
                onIncrement={() => setChildrenCount(input.childrenCount + 1)}
              />
              <span className="text-[13px] text-text-muted">
                Only children the two parents share and who are eligible for support.
              </span>
            </div>
          </Card>

          {/* 2. Monthly income */}
          <Card
            id={WORKSHEET_SECTIONS.income}
            step={2}
            title="Monthly income"
            hint="Gross monthly amounts, before taxes."
            help={
              <HelpTip label="Use gross income before taxes and deductions — wages, salary, tips, and self-employment net income." />
            }
          >
            <PartyHeader nameA={nameADisplay} nameB={nameBDisplay} />
            {(rules?.incomeLines ?? []).map((line, i) => (
              <FieldRow
                key={line.id}
                label={line.label}
                hint={line.hint}
                divider={i !== 0}
                a={
                  <MoneyField
                    label={`${line.label} — ${nameA}`}
                    value={input.income[line.id]?.a ?? 0}
                    onCommit={(v) => setIncome(line.id, 'a', v)}
                    fieldId={fieldIds.income(line.id, 'a')}
                    error={fieldErrors[fieldIds.income(line.id, 'a')]}
                  />
                }
                b={
                  <MoneyField
                    label={`${line.label} — ${nameB}`}
                    value={input.income[line.id]?.b ?? 0}
                    onCommit={(v) => setIncome(line.id, 'b', v)}
                    fieldId={fieldIds.income(line.id, 'b')}
                    error={fieldErrors[fieldIds.income(line.id, 'b')]}
                  />
                }
              />
            ))}
          </Card>

          {/* 3. Parenting time (signature) */}
          <Card
            id={WORKSHEET_SECTIONS.parenting}
            step={3}
            title="Parenting time"
            hint={`Overnights with each parent per year (out of ${rules?.yearNights ?? 365}).`}
            help={
              <HelpTip label="Overnights are counted per the parenting-time schedule in your order." />
            }
          >
            <FieldRow
              label="Overnights per year"
              divider={false}
              a={
                <CountField
                  label={`Overnights per year — ${nameA}`}
                  value={input.parentingTime.a}
                  onCommit={(v) => setNights('a', v)}
                  fieldId={fieldIds.nights('a')}
                  error={fieldErrors[fieldIds.nights('a')]}
                />
              }
              b={
                <CountField
                  label={`Overnights per year — ${nameB}`}
                  value={input.parentingTime.b}
                  onCommit={(v) => setNights('b', v)}
                  fieldId={fieldIds.nights('b')}
                  error={fieldErrors[fieldIds.nights('b')]}
                />
              }
            />
            <ParentingTimeBar
              nameA={nameADisplay}
              nameB={nameBDisplay}
              nightsA={input.parentingTime.a}
              nightsB={input.parentingTime.b}
              yearNights={rules?.yearNights ?? 365}
            />
          </Card>

          {/* 4. Monthly shared costs */}
          <Card
            id={WORKSHEET_SECTIONS.costs}
            step={4}
            title="Monthly shared costs"
            hint="Split by income share. If one parent pays a bill in full, mark it — they get credited the whole amount."
          >
            {/* Deliberately no `PartyHeader` here, unlike sections 2 and 3. Those have two
                aligned party columns for the header to label; a shared cost is one `wide`
                field, so party dots above it would promise a column alignment that does not
                exist. The "Paid by" toggle names both parents itself. */}
            {(rules?.addOnLines ?? []).map((line, i) => {
              const entry = input.addOns[line.id]
              return (
                <FieldRow
                  key={line.id}
                  label={line.label}
                  hint={line.hint}
                  divider={i !== 0}
                  wide={
                    <MoneyField
                      label={line.label}
                      value={entry?.amount ?? 0}
                      onCommit={(v) => setAddOn(line.id, v)}
                      fieldId={fieldIds.addOn(line.id)}
                      error={fieldErrors[fieldIds.addOn(line.id)]}
                    />
                  }
                  meta={
                    <AddOnPayerToggle
                      lineLabel={line.label}
                      nameA={nameADisplay}
                      nameB={nameBDisplay}
                      value={entry?.paidBy}
                      onChange={(party) => setAddOnPayer(line.id, party)}
                      error={fieldErrors[fieldIds.addOnPayer(line.id)]}
                    />
                  }
                />
              )
            })}
            {anyAttributed && (
              <p
                className="mt-4 rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px] text-text-muted"
                role="note"
              >
                Costs marked as paid by one parent are credited to them in full. A court
                will expect documentation, and the other parent&rsquo;s agreement or a
                judge&rsquo;s order.
              </p>
            )}
          </Card>
        </div>

        {/* RIGHT: results rail */}
        <aside className="lg:sticky lg:top-6">
          <ResultsRail
            estimate={estimate ?? EMPTY_ESTIMATE}
            stale={stale}
            payer={estimate ? partyDisplayName(estimate.payer) : nameBDisplay}
            recipient={estimate ? partyDisplayName(estimate.recipient) : nameADisplay}
            nameA={nameADisplay}
            nameB={nameBDisplay}
            netLabel={`${estimate ? partyDisplayName(estimate.payer) : nameBDisplay}'s share, net`}
            onReview={next}
            citation={<SupportCitation />}
          />
        </aside>
      </div>
    </>
  )
}
