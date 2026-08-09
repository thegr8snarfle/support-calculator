/**
 * Validator tests.
 *
 * Run against the **real shipped rule set** rather than a toy fixture, matching the engine
 * tests: a bad statute transcription should fail here too. Where a test needs to prove that
 * a bound comes from data rather than a hardcoded literal, it mutates a clone of the rule
 * set and asserts the message moves with it.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { errorsByField, fieldIds, validateWorksheet } from './validate'
import { DEFAULT_INPUT } from '../../mocks/supportFixtures'
import { createStaticRulesRepository } from '../../services/rules/staticRulesRepository'
import type { SupportRuleSet } from '../../types/rules'
import type { ValidationError, WorksheetInput } from '../../types/support'

let rules: SupportRuleSet

beforeAll(async () => {
  rules = await createStaticRulesRepository().getRuleSet({ jurisdiction: 'CO' })
})

/** A valid worksheet, with the given fields overridden. */
function worksheet(patch: Partial<WorksheetInput> = {}): WorksheetInput {
  return { ...structuredClone(DEFAULT_INPUT), ...patch }
}

/** Ids of the errors returned, for concise assertions. */
function idsOf(errors: ValidationError[]): string[] {
  return errors.map((e) => e.id)
}

describe('validateWorksheet', () => {
  it('accepts the seed worksheet', () => {
    expect(validateWorksheet(worksheet(), rules)).toEqual([])
  })

  describe('overnights', () => {
    it('rejects a count above the parenting year', () => {
      const errors = validateWorksheet(
        worksheet({ parentingTime: { a: 900, b: 146 } }),
        rules,
      )
      expect(idsOf(errors)).toContain('parentingTime.a.range')
      expect(errors[0].message).toContain('between 0 and 365')
    })

    it('rejects a negative count', () => {
      const errors = validateWorksheet(
        worksheet({ parentingTime: { a: -5, b: 146 } }),
        rules,
      )
      expect(idsOf(errors)).toContain('parentingTime.a.range')
    })

    it('flags BOTH inputs when the total is wrong', () => {
      // The case per-field checks structurally cannot catch: two individually legal values
      // that are impossible together. This is the bug that produced a confident $0.
      const errors = validateWorksheet(
        worksheet({ parentingTime: { a: 365, b: 365 } }),
        rules,
      )
      const total = errors.find((e) => e.id === 'parentingTime.total')
      expect(total).toBeDefined()
      expect(total?.fields).toEqual([fieldIds.nights('a'), fieldIds.nights('b')])
    })

    it('says which way the total is off', () => {
      const over = validateWorksheet(worksheet({ parentingTime: { a: 200, b: 200 } }), rules)
      expect(over[0].message).toContain('add up to 400')
      expect(over[0].message).toContain('Remove 35 nights')

      const under = validateWorksheet(worksheet({ parentingTime: { a: 100, b: 100 } }), rules)
      expect(under[0].message).toContain('Add 165 nights')
    })

    it('singularizes a one-night discrepancy', () => {
      const errors = validateWorksheet(worksheet({ parentingTime: { a: 220, b: 146 } }), rules)
      expect(errors[0].message).toContain('Remove 1 night from')
    })

    it('suppresses the total error while a field is individually out of range', () => {
      // Otherwise one input carries two competing messages for a single mistake.
      const errors = validateWorksheet(
        worksheet({ parentingTime: { a: 900, b: 146 } }),
        rules,
      )
      expect(idsOf(errors)).not.toContain('parentingTime.total')
    })

    it('reads the bound from the rule set, not a hardcoded 365', () => {
      const leapYear: SupportRuleSet = { ...rules, yearNights: 366 }

      // 366 is out of range under the real rules but fine under these.
      expect(
        validateWorksheet(worksheet({ parentingTime: { a: 366, b: 0 } }), leapYear).map(
          (e) => e.id,
        ),
      ).not.toContain('parentingTime.a.range')

      // And the total must now reach 366, so the previously-valid split fails.
      const errors = validateWorksheet(worksheet({ parentingTime: { a: 219, b: 146 } }), leapYear)
      expect(idsOf(errors)).toContain('parentingTime.total')
      expect(errors[0].message).toContain('366')
    })
  })

  describe('parent names', () => {
    it('rejects a blank name', () => {
      const input = worksheet()
      input.parties.a.name = ''
      const errors = validateWorksheet(input, rules)
      expect(idsOf(errors)).toContain('parties.a.name.required')
      expect(errors[0].fields).toEqual([fieldIds.partyName('a')])
    })

    it('rejects a whitespace-only name', () => {
      const input = worksheet()
      input.parties.b.name = '   '
      expect(idsOf(validateWorksheet(input, rules))).toContain('parties.b.name.required')
    })

    it('accepts a real name', () => {
      const input = worksheet()
      input.parties.a.name = 'Jane'
      input.parties.b.name = 'John'
      expect(validateWorksheet(input, rules)).toEqual([])
    })
  })

  describe('children', () => {
    it('rejects zero children', () => {
      expect(idsOf(validateWorksheet(worksheet({ childrenCount: 0 }), rules))).toContain(
        'childrenCount.range',
      )
    })

    it('rejects more children than the schedule covers', () => {
      const errors = validateWorksheet(
        worksheet({ childrenCount: rules.schedule.maxChildren + 1 }),
        rules,
      )
      expect(idsOf(errors)).toContain('childrenCount.range')
      expect(errors[0].message).toContain(String(rules.schedule.maxChildren))
    })
  })

  describe('amounts', () => {
    it('rejects a negative income amount', () => {
      const input = worksheet()
      input.income.gross.a = -100
      const errors = validateWorksheet(input, rules)
      expect(errors[0].fields).toEqual([fieldIds.income('gross', 'a')])
    })

    it('rejects a non-finite income amount', () => {
      const input = worksheet()
      input.income.gross.b = Number.NaN
      expect(validateWorksheet(input, rules)).toHaveLength(1)
    })

    it('rejects a negative add-on', () => {
      const input = worksheet()
      const lineId = rules.addOnLines[0].id
      input.addOns[lineId] = { amount: -1 }
      const errors = validateWorksheet(input, rules)
      expect(errors[0].fields).toEqual([fieldIds.addOn(lineId)])
    })

    it('rejects a payer named on a line with no amount', () => {
      // A contradiction the user can actually resolve, so it blocks — unlike the
      // documentation advisory, which is a warning because there is nothing to edit.
      const input = worksheet()
      const lineId = rules.addOnLines[0].id
      input.addOns[lineId] = { amount: 0, paidBy: 'b' }
      const errors = validateWorksheet(input, rules)
      expect(errors).toHaveLength(1)
      expect(errors[0].id).toBe(`addOns.${lineId}.payerWithoutAmount`)
      // Highlights both the amount and the toggle: either one is a valid fix.
      expect(errors[0].fields).toEqual([fieldIds.addOn(lineId), fieldIds.addOnPayer(lineId)])
    })

    it('accepts an attributed line that has an amount', () => {
      const input = worksheet()
      const lineId = rules.addOnLines[0].id
      input.addOns[lineId] = { amount: 250, paidBy: 'a' }
      expect(validateWorksheet(input, rules)).toEqual([])
    })

    it('reports only the amount error when an attributed line is also unparseable', () => {
      // Two errors on one row would compete for the same tooltip; fix the number first.
      const input = worksheet()
      const lineId = rules.addOnLines[0].id
      input.addOns[lineId] = { amount: Number.NaN, paidBy: 'b' }
      const errors = validateWorksheet(input, rules)
      expect(errors).toHaveLength(1)
      expect(errors[0].id).toBe(`addOns.${lineId}.invalid`)
    })

    it('treats an unentered line as valid, not invalid', () => {
      const input = worksheet()
      delete input.addOns[rules.addOnLines[0].id]
      expect(validateWorksheet(input, rules)).toEqual([])
    })
  })

  it('returns errors in form order so the summary reads top to bottom', () => {
    const input = worksheet({ childrenCount: 0, parentingTime: { a: 900, b: 900 } })
    input.parties.a.name = ''
    input.income.gross.a = -1
    expect(idsOf(validateWorksheet(input, rules))).toEqual([
      'parties.a.name.required',
      'childrenCount.range',
      'income.gross.a.invalid',
      'parentingTime.a.range',
      'parentingTime.b.range',
    ])
  })
})

describe('errorsByField', () => {
  it('maps every field of a multi-field error', () => {
    const errors = validateWorksheet(worksheet({ parentingTime: { a: 365, b: 365 } }), rules)
    const byField = errorsByField(errors)
    expect(byField[fieldIds.nights('a')]).toBe(byField[fieldIds.nights('b')])
    expect(byField[fieldIds.nights('a')]).toContain('add up to 730')
  })

  it('keeps the first error when two target the same field', () => {
    const byField = errorsByField([
      { id: 'first', message: 'first', fields: ['x'] },
      { id: 'second', message: 'second', fields: ['x'] },
    ])
    expect(byField.x).toBe('first')
  })

  it('omits fields with no error', () => {
    expect(errorsByField([])).toEqual({})
  })
})
