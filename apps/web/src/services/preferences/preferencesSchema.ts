/**
 * The trust boundary for persisted preferences.
 *
 * `localStorage` is **untrusted input**, exactly like a remote statute payload. Anyone can
 * edit it in devtools, an older build can leave a shape this one does not understand, and a
 * half-written value can survive a crash. So every read is parsed, and anything that does
 * not match falls back to defaults instead of being coerced or thrown.
 *
 * Mirrors `ruleSetSchema.ts`: Zod at the edge, plain types inside.
 */
import { z } from 'zod'
import { DEFAULT_PREFERENCES, type Preferences } from '../../types/preferences'

/**
 * The persisted shape.
 *
 * `version` is a literal, not a number: a record written by a future build with `version: 2`
 * must fail this parse and fall back, rather than being read with v2 semantics by v1 code.
 * When a v2 ships, this becomes a discriminated union plus a migration step.
 *
 * `parentNames` has a `.default()`, unlike every other field — a deliberate, narrow exception
 * to "no partial merge" below. That invariant guards against trusting a *corrupt* record; a
 * record written by the previous build, before this field existed, is not corrupt, just older.
 * Defaulting the one new key lets it keep its `theme` instead of losing it to a field it never
 * had a chance to set.
 */
export const preferencesSchema = z.object({
  version: z.literal(1),
  theme: z.enum(['light', 'dark', 'system']),
  parentNames: z.object({ a: z.string(), b: z.string() }).default({ a: '', b: '' }),
})

/**
 * Parse a raw stored value into `Preferences`, falling back to defaults on anything
 * unexpected.
 *
 * Never throws — a corrupt preference must not be able to stop the app from booting, which
 * is a real risk given this is read during the first render.
 *
 * @param raw The JSON string read from storage, or `null` when nothing is stored.
 * @returns Valid preferences: either the parsed record or {@link DEFAULT_PREFERENCES}.
 */
export function parsePreferences(raw: string | null): Preferences {
  // Nothing stored yet — first run on this origin. Not an error.
  if (raw === null) return DEFAULT_PREFERENCES

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    // Truncated or hand-mangled JSON. Discard it; the next save overwrites.
    return DEFAULT_PREFERENCES
  }

  const result = preferencesSchema.safeParse(json)

  // Known-good shape, or defaults. No partial merge: a record that fails validation has
  // already told us we cannot reason about its contents, so trusting *some* of its fields
  // would be trusting the same source that just proved untrustworthy.
  return result.success ? result.data : DEFAULT_PREFERENCES
}
