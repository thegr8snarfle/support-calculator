/**
 * Keyboard and ARIA behaviour of the `radiogroup` variant.
 *
 * Worth pinning because the variant exists specifically to correct an accessibility bug —
 * the component shipped with `tablist`/`tab` roles, which announce "you are viewing this
 * panel" for what is actually a value the user is choosing.
 */
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedToggle } from './SegmentedToggle'

const OPTIONS = [
  { label: 'Shared', value: 'shared' },
  { label: 'Taylor', value: 'a' },
  { label: 'Blake', value: 'b' },
]

describe('SegmentedToggle — radiogroup variant', () => {
  it('exposes radio roles and the checked state', () => {
    render(
      <SegmentedToggle
        variant="radiogroup"
        options={OPTIONS}
        value="a"
        aria-label="Who pays childcare"
      />,
    )
    expect(screen.getByRole('radiogroup', { name: 'Who pays childcare' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Taylor' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Blake' })).not.toBeChecked()
  })

  it('is a single tab stop, entered at the selected option', () => {
    render(<SegmentedToggle variant="radiogroup" options={OPTIONS} value="b" />)
    expect(screen.getByRole('radio', { name: 'Blake' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Shared' })).toHaveAttribute('tabindex', '-1')
  })

  it('selects with the arrow keys, moving focus with the selection', async () => {
    const user = userEvent.setup()
    // A stateful host, because the component is controlled: with a bare spy the value
    // never advances and the test would assert against a frozen render rather than the
    // behaviour a user actually gets.
    function Host() {
      const [value, setValue] = useState('shared')
      return (
        <SegmentedToggle
          variant="radiogroup"
          options={OPTIONS}
          value={value}
          onChange={setValue}
        />
      )
    }
    render(<Host />)

    await user.click(screen.getByRole('radio', { name: 'Shared' }))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Taylor' })).toBeChecked()
    // Focus follows selection, or the next press would start from the old segment.
    expect(screen.getByRole('radio', { name: 'Taylor' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Blake' })).toBeChecked()

    // Wraps past the last option back to the first.
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Shared' })).toBeChecked()

    // And backwards, wrapping the other way.
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Blake' })).toBeChecked()
  })

  it('ignores keys it does not own', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SegmentedToggle
        variant="radiogroup"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('radio', { name: 'Taylor' }))
    onChange.mockClear()
    await user.keyboard('{Home}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps tab roles in the default variant', () => {
    // The original behaviour has to survive for any future tab use.
    render(<SegmentedToggle options={OPTIONS} value="a" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Taylor' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
