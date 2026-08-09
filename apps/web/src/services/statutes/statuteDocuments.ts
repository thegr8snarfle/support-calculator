import type { StatuteDocument } from '../../types/statutes'
import type { SupportRuleSet } from '../../types/rules'

/**
 * The curated statute documents behind the bundled Colorado 2026 rule set. Hand-picked
 * and downloaded once (`apps/web/public/statutes/`), not fetched at runtime — unlike
 * `services/rules`, there is no anticipated remote/MCP source for this list, so it
 * stays a plain synchronous module rather than an async repository port. If that
 * changes, wrap it behind a port the same way `RulesRepository` wraps rule sets.
 */
export const STATUTE_DOCUMENTS: StatuteDocument[] = [
  {
    id: 'co-title-14-2024',
    jurisdictionCode: 'CO',
    title: 'C.R.S. Title 14 — Domestic Matters (2024)',
    role: 'base-statute',
    informsCitationTopics: ['primary'],
    description:
      'The statutory chapter §14-10-115 sits within. Does not contain the schedule ' +
      'itself — §14-10-115(7)(b) is a publisher placeholder in this edition, ' +
      'superseded by HB 25-1159 below.',
    file: {
      path: '/statutes/co-title-14-2024.pdf',
      filename: 'CRS-Title-14-2024.pdf',
      mimeType: 'application/pdf',
    },
    source: {
      url: 'https://content.leg.colorado.gov/sites/default/files/images/olls/crs2024-title-14.pdf',
      retrieved: '2026-08-09',
    },
  },
  {
    id: 'co-hb25-1159-final-act',
    jurisdictionCode: 'CO',
    title: 'HB 25-1159 — Final Act',
    role: 'amendment',
    enactedBy: 'HB 25-1159',
    informsCitationTopics: [
      'schedule',
      'parentingTimeTable',
      'sharedParentingAdjustment',
      'lowIncome',
      'selfSupportReserve',
      'highIncome',
    ],
    description:
      'The enacted amendment supplying the 2026 schedule, the continuous parenting-time ' +
      "credit table, low-income bands and the self-support reserve formula this " +
      "calculator's engine reads as data.",
    file: {
      path: '/statutes/co-hb25-1159-final-act.pdf',
      filename: 'HB25-1159-Final-Act.pdf',
      mimeType: 'application/pdf',
    },
    source: {
      url: 'https://leg.colorado.gov/bill_files/85404/download',
      // Same file, same retrieval date already recorded in co/2026.json's source block —
      // this is the one document the rule-set transcription itself came from.
      retrieved: '2026-08-02',
      note:
        'Machine-readable; the Signed Act PDF (bill_files/40922) is a scan with no ' +
        'extractable text — do not substitute it.',
    },
  },
]

/** All curated documents, optionally filtered to one jurisdiction. */
export function getStatuteDocuments(jurisdictionCode?: string): StatuteDocument[] {
  if (!jurisdictionCode) return STATUTE_DOCUMENTS
  return STATUTE_DOCUMENTS.filter((doc) => doc.jurisdictionCode === jurisdictionCode)
}

/**
 * Documents relevant to a loaded rule set, joined by jurisdiction code only. Correct
 * while exactly one CO vintage is bundled — TODO(task 2, statute version switching):
 * once a second CO rule set exists, this needs a vintage-specific filter too (e.g.
 * matching `enactedBy`), not just jurisdiction.
 */
export function getDocumentsForRuleSet(
  rules: Pick<SupportRuleSet, 'jurisdiction'>,
): StatuteDocument[] {
  return getStatuteDocuments(rules.jurisdiction.code)
}

/** Documents that inform a given rule-set citation topic (e.g. `"schedule"`). */
export function getDocumentsForCitationTopic(
  topic: string,
  jurisdictionCode?: string,
): StatuteDocument[] {
  return getStatuteDocuments(jurisdictionCode).filter((doc) =>
    doc.informsCitationTopics.includes(topic),
  )
}
