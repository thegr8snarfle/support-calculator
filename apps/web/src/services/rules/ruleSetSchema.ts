/**
 * Trust boundary for statute data.
 *
 * Every rule set is validated through this schema regardless of where it came from,
 * so the bundled JSON exercises exactly the same path an untrusted remote payload
 * (see `mcpRulesRepository`) will take. Validation failures throw with the failing
 * field path, following the descriptive-error idiom of `config/appConfig.ts`.
 */
import { z } from 'zod'
import type { SupportRuleSet } from '../../types/rules'

const money = z.number().finite().nonnegative()
const pct = z.number().min(0).max(100)

const periodFormula = z.object({
  hoursPerWeek: z.number().positive(),
  weeksPerYear: z.number().positive(),
  monthsPerYear: z.number().positive(),
})

export const ruleSetSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    jurisdiction: z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      // Optional: a jurisdiction's first rule set has no prior version to describe.
      changes: z.object({ comments: z.string() }).optional(),
    }),
    effective: z.object({ from: z.string().min(1), enactedBy: z.string().optional() }),
    citations: z.record(z.string(), z.string()),
    source: z
      .object({
        document: z.string(),
        url: z.string().optional(),
        retrieved: z.string().optional(),
        note: z.string().optional(),
      })
      .optional(),
    period: z.literal('monthly'),
    currency: z.string().min(1),
    yearNights: z.number().int().positive(),
    incomeLines: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          hint: z.string().optional(),
          effect: z.union([z.literal('add'), z.literal('subtract')]),
          citation: z.string().optional(),
        }),
      )
      .min(1),
    addOnLines: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        hint: z.string().optional(),
        citation: z.string().optional(),
      }),
    ),
    schedule: z.object({
      maxChildren: z.number().int().positive(),
      incomeStep: z.number().positive(),
      interpolate: z.boolean(),
      rows: z
        .array(
          z.object({
            combinedIncome: money,
            obligations: z.array(money),
          }),
        )
        .min(2),
    }),
    parentingTimeCredit: z.object({
      table: z
        .array(z.object({ overnights: z.number().nonnegative(), creditPct: pct }))
        .min(2),
    }),
    selfSupportReserve: z.object({
      formula: periodFormula,
      stateMinimumWageHourly: z.number().positive(),
      fullTimeFormula: periodFormula,
    }),
    lowIncome: z.object({
      minimumOrderIncomeCeiling: money,
      minimumOrderAmount: money,
      reducedObligationByChildren: z.array(money).min(1),
      capPctOfObligorIncomeLowBand: pct,
      capPctOfObligorIncomeFullTimeBand: pct,
      reserveDifferencePctByChildren: z.array(pct).min(1),
    }),
    rounding: z.object({ mode: z.literal('nearest'), unit: z.number().positive() }),
  })
  // Structural invariants the engine relies on. These caught real extraction bugs
  // while transcribing the schedule, so they stay as permanent guards.
  .refine(
    (r) => r.schedule.rows.every((row) => row.obligations.length === r.schedule.maxChildren),
    { message: 'every schedule row must have exactly `maxChildren` obligation columns' },
  )
  .refine(
    (r) =>
      r.schedule.rows.every(
        (row, i) => i === 0 || row.combinedIncome > r.schedule.rows[i - 1].combinedIncome,
      ),
    { message: 'schedule rows must be sorted by strictly increasing combinedIncome' },
  )
  .refine(
    (r) =>
      r.parentingTimeCredit.table.every(
        (row, i) => i === 0 || row.overnights > r.parentingTimeCredit.table[i - 1].overnights,
      ),
    { message: 'parenting-time credit table must be sorted by increasing overnights' },
  )

/**
 * Validate an unknown payload into a {@link SupportRuleSet}.
 * Throws an `Error` naming the failing path(s) — never returns partial data.
 */
export function parseRuleSet(raw: unknown): SupportRuleSet {
  const result = ruleSetSchema.safeParse(raw)
  if (!result.success) {
    const detail = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ')
    throw new Error(`Invalid support rule set — ${detail}`)
  }
  return result.data as SupportRuleSet
}
