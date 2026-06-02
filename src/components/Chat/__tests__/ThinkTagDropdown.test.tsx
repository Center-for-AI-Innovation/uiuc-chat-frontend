import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { ThinkTagDropdown, extractThinkTagContent } from '../ThinkTagDropdown'

describe('ThinkTagDropdown', () => {
  it('renders content and header', () => {
    render(<ThinkTagDropdown content="Thinking about this..." />)
    expect(screen.getByText("AI's Thought Process")).toBeInTheDocument()
    expect(screen.getByText('Thinking about this...')).toBeInTheDocument()
  })

  it('starts expanded by default', () => {
    render(<ThinkTagDropdown content="test" />)
    const header = screen.getByRole('button')
    expect(header).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapses when header is clicked', () => {
    render(<ThinkTagDropdown content="test" />)
    const header = screen.getByRole('button')

    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles on Enter key', () => {
    render(<ThinkTagDropdown content="test" />)
    const header = screen.getByRole('button')

    fireEvent.keyDown(header, { key: 'Enter' })
    expect(header).toHaveAttribute('aria-expanded', 'false')

    fireEvent.keyDown(header, { key: 'Enter' })
    expect(header).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggles on Space key', () => {
    render(<ThinkTagDropdown content="test" />)
    const header = screen.getByRole('button')

    fireEvent.keyDown(header, { key: ' ' })
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('collapses on Escape key when expanded', () => {
    render(<ThinkTagDropdown content="test" />)
    const header = screen.getByRole('button')

    // Start expanded, press Escape
    expect(header).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(header, { key: 'Escape' })
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not expand on Escape key when collapsed', () => {
    render(<ThinkTagDropdown content="test" />)
    const header = screen.getByRole('button')

    // Collapse first
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')

    // Escape should not expand
    fireEvent.keyDown(header, { key: 'Escape' })
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders with streaming prop without error', () => {
    const { container } = render(
      <ThinkTagDropdown content="test" isStreaming={true} />,
    )
    // Component should render without crashing when streaming
    expect(container.querySelector('.think-tag-dropdown')).toBeInTheDocument()
  })

  it('renders multiline content', () => {
    const { container } = render(<ThinkTagDropdown content={'line1\nline2'} />)
    // Content should contain br elements for newlines
    const brs = container.querySelectorAll('br')
    expect(brs.length).toBeGreaterThanOrEqual(1)
  })
})

describe('extractThinkTagContent', () => {
  it('extracts content from complete think tags', () => {
    const result = extractThinkTagContent(
      '<think>my thoughts</think>remaining content',
    )
    expect(result.thoughts).toBe('my thoughts')
    expect(result.remainingContent).toBe('remaining content')
  })

  it('handles incomplete think tags (streaming)', () => {
    const result = extractThinkTagContent('<think>partial thoughts')
    expect(result.thoughts).toBe('partial thoughts')
    expect(result.remainingContent).toBe('')
  })

  it('returns null thoughts for non-think content', () => {
    const result = extractThinkTagContent('regular content')
    expect(result.thoughts).toBeNull()
    expect(result.remainingContent).toBe('regular content')
  })
})
