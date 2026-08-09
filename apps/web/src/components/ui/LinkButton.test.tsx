import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LinkButton } from './LinkButton'

describe('LinkButton', () => {
  it('renders an anchor with the button look', () => {
    render(
      <LinkButton href="/statutes/foo.pdf" download="foo.pdf">
        Download PDF
      </LinkButton>,
    )
    const link = screen.getByRole('link', { name: 'Download PDF' })
    expect(link).toHaveAttribute('href', '/statutes/foo.pdf')
    expect(link).toHaveAttribute('download', 'foo.pdf')
    expect(link.className).toContain('rounded-md')
  })

  it('applies the requested variant', () => {
    render(
      <LinkButton href="https://example.com" variant="ghost">
        View source
      </LinkButton>,
    )
    expect(screen.getByRole('link', { name: 'View source' }).className).toContain('border-border')
  })
})
