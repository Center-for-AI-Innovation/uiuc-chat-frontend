import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThinkTagDropdown from '../ThinkTagDropdown'

describe('ThinkTagDropdown behavior', () => {
  it('does not animate on initial render for historical chats', () => {
    render(<ThinkTagDropdown content="Thoughts" isReasoningStreaming={false} />)

    const contentRegion = document.getElementById('think-tag-content')
    expect(contentRegion).toBeInTheDocument()
    expect(contentRegion).toHaveClass(
      'think-tag-content',
      'no-animate',
      'expanded',
    )
  })

  it('auto-collapses with animation when live streaming finishes', async () => {
    const { rerender } = render(
      <ThinkTagDropdown content="Thoughts" isReasoningStreaming={true} />,
    )

    rerender(
      <ThinkTagDropdown content="Thoughts" isReasoningStreaming={false} />,
    )

    await waitFor(() => {
      const contentRegion = document.getElementById('think-tag-content')
      expect(contentRegion).toBeInTheDocument()
      expect(contentRegion).toHaveClass(
        'think-tag-content',
        'animate-auto',
        'closing',
      )
      expect(contentRegion).not.toHaveClass('expanded')
      expect(
        screen.getByRole('button', { name: /AI's Thought Process/i }),
      ).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('animates manual opening and closing with the faster variant', async () => {
    const user = userEvent.setup()
    render(<ThinkTagDropdown content="Thoughts" isReasoningStreaming={false} />)

    const toggle = screen.getByRole('button', {
      name: /AI's Thought Process/i,
    })

    await user.click(toggle)

    let contentRegion = document.getElementById('think-tag-content')
    expect(contentRegion).toBeInTheDocument()
    expect(contentRegion).toHaveClass(
      'think-tag-content',
      'animate-manual',
      'closing',
    )
    expect(contentRegion).not.toHaveClass('expanded')

    await user.click(toggle)

    contentRegion = document.getElementById('think-tag-content')
    expect(contentRegion).toBeInTheDocument()
    expect(contentRegion).toHaveClass(
      'think-tag-content',
      'animate-manual',
      'expanded',
    )
  })
})
