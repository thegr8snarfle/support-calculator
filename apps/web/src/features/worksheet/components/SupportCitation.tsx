import { SUPPORT_STATUTE } from '../../../mocks'

/**
 * The standard estimate/guideline disclaimer shown wherever a support figure appears
 * (the results rail and the Results page). Copy lives here so the citation stays
 * consistent; the controlling statute comes from the shared fixtures.
 */
export function SupportCitation() {
  return (
    <>
      Estimate only, using Colorado&rsquo;s unified child-support guideline (
      <code className="text-text-muted">{SUPPORT_STATUTE}</code>, schedule effective
      March 1, 2026). Courts may deviate. Not legal advice.
    </>
  )
}
