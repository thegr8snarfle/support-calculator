/**
 * Worksheet input validation — pure, framework-free, and driven entirely by the rule set.
 *
 * This module answers one question: *is this input safe to calculate from?* It is the
 * counterpart to `calculateChildSupport`, which answers *what does it come to?* The split
 * matters because the engine is **total** — it returns a figure for almost any input — so
 * without a gate in front of it, nonsense input (365 overnights for both parents) yields a
 * confident, wrong number. Surfacing the mistake is always better than silently correcting
 * it: a clamped value hides the fact that the user and the app disagree.
 *
 * Two invariants hold throughout:
 *
 * 1. **No statutory constants.** Every bound (`yearNights`, `maxChildren`) is read off the
 *    `SupportRuleSet`, so a statute amendment or a new state changes data, never this file.
 * 2. **Blocking only.** Everything returned here stops the flow. Informative-but-calculable
 *    conditions belong on `SupportEstimate.warnings` instead — see `ValidationError`.
 */
import type { Party } from '../../types/common'
import type { SupportRuleSet } from '../../types/rules'
import type { ValidationError, WorksheetInput } from '../../types/support'

/**
 * Canonical ids for every addressable worksheet input.
 *
 * Both the validator (producing `ValidationError.fields`) and the UI (looking errors up per
 * input) go through these helpers, so the two can never drift apart over a typo'd string.
 */
export const fieldIds = {
  /**
   * One parent's name.
   * @param party - Which parent.
   */
  partyName: (party: Party): string => `parties.${party}.name`,
  /** The children-count stepper. */
  childrenCount: 'childrenCount',
  /**
   * One income cell.
   * @param lineId - `IncomeLineSpec.id` from the rule set (e.g. `'gross'`).
   * @param party - Which parent's column.
   */
  income: (lineId: string, party: Party): string => `income.${lineId}.${party}`,
  /**
   * One parent's overnights-per-year input.
   * @param party - Which parent.
   */
  nights: (party: Party): string => `parentingTime.${party}`,
  /**
   * One shared-cost input.
   * @param lineId - `AddOnLineSpec.id` from the rule set (e.g. `'childcare'`).
   */
  addOn: (lineId: string): string => `addOns.${lineId}`,
  /**
   * The "who carries this" toggle on one shared-cost line.
   * @param lineId - `AddOnLineSpec.id` from the rule set (e.g. `'childcare'`).
   */
  addOnPayer: (lineId: string): string => `addOns.${lineId}.paidBy`,
} as const

/** Parties in the order they appear on the worksheet, so errors come back left-to-right. */
const PARTIES: Party[] = ['a', 'b']

/**
 * Whether `value` is a real, non-negative number.
 *
 * Rejects `NaN`/`Infinity` as well as negatives: an unparseable field can reach the store as
 * a non-finite value, and a negative dollar amount is never meaningful on this worksheet.
 *
 * @param value - The amount to check.
 * @returns `true` when the value is safe to calculate with.
 */
function isNonNegativeAmount(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

/**
 * Validate a worksheet against the statute rule set currently loaded.
 *
 * Ordering is intentional and matches the visual order of the form (children → income →
 * overnights → add-ons), because the validation summary renders this array as-is and a list
 * that jumps around the page is harder to work through than one that reads top to bottom.
 *
 * @param input - The raw worksheet input, exactly as the user entered it (never clamped).
 * @param rules - The loaded rule set supplying every bound; no limits are hardcoded here.
 * @returns Blocking errors, in form order. Empty means the input is safe to calculate from.
 */
export function validateWorksheet(
  input: WorksheetInput,
  rules: SupportRuleSet,
): ValidationError[] {
  const errors: ValidationError[] = []

  // --- Parent names ---------------------------------------------------------------
  // First in form order: names now sit above the children count in the merged "About this
  // case" card, and every downstream sentence ("X pays Y each month") depends on both being
  // real names rather than empty strings.
  for (const party of PARTIES) {
    if (input.parties[party].name.trim() === '') {
      errors.push({
        id: `parties.${party}.name.required`,
        message: 'Enter a name for this parent.',
        fields: [fieldIds.partyName(party)],
      })
    }
  }

  // --- Children -----------------------------------------------------------------
  // Defensive only: `NumberStepper` already disables at both bounds, so this can only
  // fire if the count is ever set by some other path (a restored draft, a future URL
  // parameter). Cheap to keep, and it means the invariant does not depend on the widget.
  const children = input.childrenCount
  const maxChildren = rules.schedule.maxChildren
  if (!Number.isFinite(children) || children < 1 || children > maxChildren) {
    errors.push({
      id: 'childrenCount.range',
      message: `Enter a number of children between 1 and ${maxChildren}.`,
      fields: [fieldIds.childrenCount],
    })
  }

  // --- Income lines -------------------------------------------------------------
  // Driven by the rule set's declared lines rather than a hardcoded list, so an amended
  // statute that adds an income line gets validated without touching this file.
  for (const line of rules.incomeLines) {
    // A line the user has not reached yet is simply absent from the record; that is
    // "not filled in", not "invalid", so there is nothing to report.
    const amounts = input.income[line.id]
    if (!amounts) continue

    for (const party of PARTIES) {
      if (!isNonNegativeAmount(amounts[party])) {
        errors.push({
          id: `income.${line.id}.${party}.invalid`,
          message: `${line.label} must be a dollar amount of 0 or more.`,
          fields: [fieldIds.income(line.id, party)],
        })
      }
    }
  }

  // --- Overnights ---------------------------------------------------------------
  // Two distinct rules. The per-field range check catches "900 overnights"; the total
  // check catches the case that per-field checks structurally cannot — two individually
  // legal values (365 and 365) that are impossible together. The total rule is why
  // `ValidationError.fields` is a list: it belongs to both inputs at once, and flagging
  // only one of them would point the user at an arbitrary half of the problem.
  const yearNights = rules.yearNights
  const nights = input.parentingTime

  // Track whether either field is individually out of range. If so we skip the total
  // check: "overnights must add to 365" is noise while a field still reads 900, and two
  // errors on one input would compete for the same tooltip.
  let anyNightOutOfRange = false

  for (const party of PARTIES) {
    const value = nights[party]
    if (!Number.isFinite(value) || value < 0 || value > yearNights) {
      anyNightOutOfRange = true
      errors.push({
        id: `parentingTime.${party}.range`,
        message: `Enter a number between 0 and ${yearNights}.`,
        fields: [fieldIds.nights(party)],
      })
    }
  }

  if (!anyNightOutOfRange) {
    const total = nights.a + nights.b
    if (total !== yearNights) {
      // Say which way they are off and by how much — "adjust so they add up" leaves the
      // user doing arithmetic the app has already done.
      const delta = Math.abs(total - yearNights)
      const noun = delta === 1 ? 'night' : 'nights'
      const fix =
        total > yearNights
          ? `Remove ${delta} ${noun} from one parent.`
          : `Add ${delta} ${noun} to one parent.`
      errors.push({
        id: 'parentingTime.total',
        message: `Overnights add up to ${total}, not ${yearNights}. ${fix}`,
        fields: [fieldIds.nights('a'), fieldIds.nights('b')],
      })
    }
  }

  // --- Add-ons ------------------------------------------------------------------
  for (const line of rules.addOnLines) {
    const entry = input.addOns[line.id]
    // Same as income: absent means "not entered", which is valid.
    if (entry === undefined) continue

    if (!isNonNegativeAmount(entry.amount)) {
      errors.push({
        id: `addOns.${line.id}.invalid`,
        message: `${line.label} must be a dollar amount of 0 or more.`,
        fields: [fieldIds.addOn(line.id)],
      })
      // An attribution on an unparseable amount is not separately interesting — fix the
      // number first. Skipping avoids stacking two errors on one row.
      continue
    }

    // Naming a payer for a line worth nothing is a contradiction the user can actually
    // resolve, so unlike the advisory warning about documentation this one blocks. Left
    // alone it would also credit $0 and read as a no-op, hiding a half-finished entry.
    if (entry.paidBy !== undefined && entry.amount === 0) {
      errors.push({
        id: `addOns.${line.id}.payerWithoutAmount`,
        message:
          `${line.label} is marked as paid by one parent but has no amount. Enter the ` +
          `monthly amount, or set it back to shared.`,
        fields: [fieldIds.addOn(line.id), fieldIds.addOnPayer(line.id)],
      })
    }
  }

  return errors
}

/**
 * Index errors by the fields they belong to, so a component can look up its own error in
 * constant time instead of scanning the array once per input (there are ~10 inputs on the
 * worksheet, and this runs on every keystroke).
 *
 * When two errors target the same field the **first** wins, which — given the form-order
 * guarantee above — is the one nearest the top of the page.
 *
 * @param errors - The list from `validateWorksheet`.
 * @returns A map of field id → error message. Fields without errors are absent.
 */
export function errorsByField(errors: ValidationError[]): Record<string, string> {
  const byField: Record<string, string> = {}

  for (const error of errors) {
    for (const field of error.fields) {
      // First error wins; do not let a later rule overwrite a more relevant earlier one.
      if (byField[field] === undefined) byField[field] = error.message
    }
  }

  return byField
}
