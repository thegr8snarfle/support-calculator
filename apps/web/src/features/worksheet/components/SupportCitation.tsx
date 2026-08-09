import { useRules } from '../hooks/useRules'
import { formatIsoDateLong } from '../../../lib/format'

/**
 * The standard estimate/guideline disclaimer shown wherever a support figure appears
 * (the results rail and the Results page). Reads the loaded rule set directly so this
 * copy can never drift from the statute version actually driving the calculation —
 * see also `ActiveStatuteBadge` (`features/statutes`), which shows the same figures
 * as a standing worksheet indicator rather than a footnote.
 */
export function SupportCitation() {
  const { rules } = useRules()

  if (!rules) {
    return (
      <>
        Estimate only, using Colorado&rsquo;s unified child-support guideline. Courts may
        deviate. Not legal advice.
      </>
    )
  }

  return (
    <>
      Estimate only, using Colorado&rsquo;s unified child-support guideline (
      <code className="text-text-muted">{rules.citations.primary}</code>, schedule effective{' '}
      {formatIsoDateLong(rules.effective.from)}). Courts may deviate. Not legal advice.
    </>
  )
}
