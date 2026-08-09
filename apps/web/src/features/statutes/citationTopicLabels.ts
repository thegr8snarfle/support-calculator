/**
 * Human labels for a rule set's `citations` topic keys. Presentation-only copy, kept
 * out of `services/rules` — the citations map itself is calculation data, this is UI
 * text describing it.
 */
const CITATION_TOPIC_LABELS: Record<string, string> = {
  primary: 'Controlling statute',
  schedule: 'Basic obligation schedule',
  parentingTimeTable: 'Parenting-time credit table',
  sharedParentingAdjustment: 'Shared-parenting adjustment',
  lowIncome: 'Low-income adjustments',
  selfSupportReserve: 'Self-support reserve',
  highIncome: 'High-income (above-schedule) guidance',
}

/** Humanize a camelCase key as a fallback, e.g. `"lowIncome"` → `"Low income"`. */
function humanizeKey(topic: string): string {
  const spaced = topic.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** A citation topic's display label — falls back to a humanized key for an unmapped topic. */
export function humanizeCitationTopic(topic: string): string {
  return CITATION_TOPIC_LABELS[topic] ?? humanizeKey(topic)
}
