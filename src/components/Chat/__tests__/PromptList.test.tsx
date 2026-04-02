import React, { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { PromptList } from '../PromptList'

const prompts = [
  { id: '1', name: 'Summarize', description: '', content: '', folderId: null },
  { id: '2', name: 'Translate', description: '', content: '', folderId: null },
]

describe('PromptList', () => {
  const defaultProps = {
    prompts,
    activePromptIndex: 0,
    onSelect: vi.fn(),
    onMouseOver: vi.fn(),
    promptListRef: createRef<HTMLUListElement>(),
  }

  it('renders all prompts', () => {
    render(<PromptList {...defaultProps} />)
    expect(screen.getByText('Summarize')).toBeInTheDocument()
    expect(screen.getByText('Translate')).toBeInTheDocument()
  })

  it('calls onSelect and prevents default on click', () => {
    const onSelect = vi.fn()
    render(<PromptList {...defaultProps} onSelect={onSelect} />)

    const option = screen.getByText('Summarize')
    fireEvent.click(option)

    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('calls onSelect on Enter key', () => {
    const onSelect = vi.fn()
    render(<PromptList {...defaultProps} onSelect={onSelect} />)

    const option = screen.getByText('Summarize')
    fireEvent.keyDown(option, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('calls onSelect on Space key', () => {
    const onSelect = vi.fn()
    render(<PromptList {...defaultProps} onSelect={onSelect} />)

    const option = screen.getByText('Summarize')
    fireEvent.keyDown(option, { key: ' ' })

    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('does not call onSelect on other keys', () => {
    const onSelect = vi.fn()
    render(<PromptList {...defaultProps} onSelect={onSelect} />)

    const option = screen.getByText('Summarize')
    fireEvent.keyDown(option, { key: 'Escape' })

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('calls onMouseOver with correct index on hover', () => {
    const onMouseOver = vi.fn()
    render(<PromptList {...defaultProps} onMouseOver={onMouseOver} />)

    fireEvent.mouseEnter(screen.getByText('Translate'))
    expect(onMouseOver).toHaveBeenCalledWith(1)
  })

  it('sets aria-selected on active prompt', () => {
    render(<PromptList {...defaultProps} activePromptIndex={1} />)

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })
})
