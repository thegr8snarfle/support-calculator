import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Chip } from './Chip'

describe('Chip', () => {
  it('renders its content', () => {
    render(<Chip>Amendment</Chip>)
    expect(screen.getByText('Amendment')).toBeInTheDocument()
  })

  it('defaults to the neutral tone', () => {
    render(<Chip>Base statute</Chip>)
    expect(screen.getByText('Base statute').className).toContain('bg-surface-2')
  })

  it('applies the requested tone', () => {
    render(<Chip tone="positive">Applied</Chip>)
    expect(screen.getByText('Applied').className).toContain('text-positive')
  })
})
