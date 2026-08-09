import { useRef, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'

export type SegmentedOption = {
  label: string
  value: string
}

export type SegmentedToggleProps = {
  options: SegmentedOption[]
  value: string
  onChange?: (value: string) => void
  /**
   * Which ARIA pattern to expose.
   *
   * - `'tabs'` (default) — `tablist`/`tab`, for switching between panels.
   * - `'radiogroup'` — `radiogroup`/`radio`, for a **form choice** that is part of the data
   *   being collected. A tab announces "you are viewing this view"; a radio announces "this
   *   is the value you have chosen", which is what a worksheet field means.
   */
  variant?: 'tabs' | 'radiogroup'
  'aria-label'?: string
  /** Ids of descriptive elements, e.g. an error tooltip. Forwarded to the group. */
  'aria-describedby'?: string
}

/**
 * Pill track with a raised selected segment. For mutually exclusive choices
 * (pay period, yes/no, paid vs received, who carries a shared cost).
 *
 * In `radiogroup` mode the group is a single tab stop with **roving focus**: Tab enters at
 * the selected option and the arrow keys move between and select the others, which is the
 * expected behaviour for a radio group and keeps a three-way toggle from costing three tab
 * presses on a form that already has many fields.
 */
export function SegmentedToggle({
  options,
  value,
  onChange,
  variant = 'tabs',
  ...rest
}: SegmentedToggleProps) {
  const isRadio = variant === 'radiogroup'
  const groupRef = useRef<HTMLDivElement>(null)

  /**
   * Arrow-key navigation for the radiogroup variant.
   *
   * Selection follows focus (the standard radio-group behaviour), so moving is choosing —
   * there is no separate "commit" step. Wraps at both ends.
   *
   * @param event - The originating keyboard event on a segment button.
   * @param index - Position of the segment the event came from.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (!isRadio) return

    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (delta === 0) return

    // Otherwise Left/Right would also scroll the page or move the caret in a sibling field.
    event.preventDefault()

    const nextIndex = (index + delta + options.length) % options.length
    onChange?.(options[nextIndex].value)
    // Focus has to follow selection or the next arrow press starts from the old segment.
    const buttons = groupRef.current?.querySelectorAll('button')
    buttons?.[nextIndex]?.focus()
  }

  return (
    <div
      ref={groupRef}
      role={isRadio ? 'radiogroup' : 'tablist'}
      aria-label={rest['aria-label']}
      aria-describedby={rest['aria-describedby']}
      className="inline-flex gap-0.5 rounded-pill bg-surface-2 p-[3px]"
    >
      {options.map((opt, index) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role={isRadio ? 'radio' : 'tab'}
            // Two different state attributes: `aria-checked` is what a radio exposes,
            // `aria-selected` what a tab exposes. Using the wrong one leaves the control
            // silently stateless to a screen reader.
            {...(isRadio ? { 'aria-checked': selected } : { 'aria-selected': selected })}
            // Roving tabindex — one stop for the whole group in radiogroup mode.
            tabIndex={isRadio && !selected ? -1 : 0}
            onClick={() => onChange?.(opt.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'focus-ring rounded-pill px-3 py-[5px] text-[13px] cursor-pointer transition-colors',
              selected
                ? 'bg-surface text-text font-semibold shadow-sm'
                : 'bg-transparent text-text-muted',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
