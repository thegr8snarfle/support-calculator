/**
 * A list of everything currently blocking the worksheet, shown above the form.
 *
 * The per-field `ErrorTip` is the primary affordance, but a tooltip alone is not enough:
 * it needs hover or focus to appear, so on touch it is effectively invisible, and an error
 * scrolled off screen is unreachable. This summary is the counterpart — always visible,
 * enumerable by a screen reader, and each row moves focus to the offending input.
 *
 * Reads `useValidation()` directly rather than taking props: it is worksheet-specific and
 * sits several levels below the page, so drilling would gain nothing.
 */
import { FieldError } from '../../../components/ui/FieldError'
import { useValidation } from '../hooks/useValidation'

/**
 * Move keyboard focus to the input a given error belongs to.
 *
 * Fields carry their canonical `fieldIds` value as their DOM `id`, so this is a direct
 * lookup. `getElementById` rather than `querySelector` because those ids contain dots
 * (`parentingTime.a`), which would need escaping in a CSS selector.
 *
 * @param fieldId - Canonical field id; the first entry of `ValidationError.fields`.
 */
function focusField(fieldId: string): void {
  const el = document.getElementById(fieldId)
  if (!el) return

  // Scroll first, then focus without letting the browser scroll again — otherwise a field
  // near the bottom of a long worksheet lands under the sticky rail.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
}

export function ValidationSummary() {
  const { errors } = useValidation()

  // Render nothing at all when the worksheet is clean — an empty "no problems" box is
  // visual noise on what is, most of the time, a valid form.
  if (errors.length === 0) return null

  return (
    <div
      // `alert` announces the block when it appears. It is not `aria-live="assertive"` on
      // the individual rows: re-announcing the whole list on every keystroke while someone
      // is mid-correction is hostile.
      role="alert"
      aria-labelledby="validation-summary-heading"
      className="mb-6 rounded-lg border border-alert bg-alert-weak p-4"
    >
      <h2
        id="validation-summary-heading"
        className="mb-2 text-[14px] font-semibold text-alert"
      >
        {errors.length === 1
          ? 'Fix this before continuing'
          : `Fix these ${errors.length} things before continuing`}
      </h2>

      <ul className="grid gap-1">
        {errors.map((error) => (
          <li key={error.id}>
            <button
              type="button"
              // Form-level errors carry no fields; those rows are plain text, not links to
              // nowhere.
              onClick={
                error.fields.length > 0 ? () => focusField(error.fields[0]) : undefined
              }
              disabled={error.fields.length === 0}
              className="focus-ring rounded-sm text-left enabled:hover:underline disabled:cursor-default"
            >
              <FieldError>{error.message}</FieldError>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
