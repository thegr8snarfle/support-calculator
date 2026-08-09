/**
 * Statute *documents* — the human-readable source PDFs a rule set was transcribed
 * from or amends. This is deliberately separate from `RuleSetSource`
 * (`src/types/rules.ts`): that field records the provenance of one rule set's
 * transcribed *data* and is part of the calculation trust boundary, while a
 * `StatuteDocument` never supplies a number the engine reads — C.R.S. Title 14, for
 * instance, doesn't even contain the schedule. Keeping the two apart means adding or
 * re-curating a reference document never touches the Zod-validated calculation
 * boundary in `src/services/rules/`.
 */

/** Whether a document is the base statute a rule set implements, or an amendment to it. */
export type StatuteDocumentRole = 'base-statute' | 'amendment'

/** Where the document was originally fetched from and when. */
export type StatuteDocumentSource = {
  url: string
  /** ISO date the file was downloaded. */
  retrieved: string
  note?: string
}

/** The bundled, downloadable copy of the document. */
export type StatuteDocumentFile = {
  /** Same-origin public path, e.g. served from `apps/web/public/`. */
  path: string
  /** Suggested filename for the browser's download prompt. */
  filename: string
  mimeType: 'application/pdf'
}

export type StatuteDocument = {
  id: string
  /** Postal-style jurisdiction code, e.g. `"CO"` — joins against `SupportRuleSet.jurisdiction.code`. */
  jurisdictionCode: string
  title: string
  description: string
  role: StatuteDocumentRole
  /** e.g. `"HB 25-1159"`; matches a rule set's `effective.enactedBy` when this is the enacting amendment. */
  enactedBy?: string
  /**
   * Which of a rule set's `citations` topics this document informs (e.g. `"schedule"`).
   * A plain string, not a literal union, since `SupportRuleSet['citations']` is an open
   * `Record<string, string>` with no fixed key set.
   */
  informsCitationTopics: string[]
  file: StatuteDocumentFile
  source: StatuteDocumentSource
}
