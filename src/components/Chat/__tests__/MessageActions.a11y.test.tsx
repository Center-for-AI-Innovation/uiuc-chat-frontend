import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeMessage } from '~/test-utils/mocks/chat'
import { MessageActions } from '../MessageActions'

describe('MessageActions - accessibility', () => {
  const renderActions = (overrides: Record<string, any> = {}) => {
    const defaultProps = {
      message: makeMessage({
        id: 'a1',
        role: 'assistant' as const,
        content: 'Hello',
      }),
      messageIndex: 0,
      isLastMessage: true,
      onRegenerate: vi.fn(),
      onFeedback: vi.fn(),
      onOpenFeedbackModal: vi.fn(),
      ...overrides,
    }
    return {
      ...renderWithProviders(<MessageActions {...defaultProps} />),
      props: defaultProps,
    }
  }

  it('copy button has aria-label="Copy message"', () => {
    renderActions()
    expect(
      screen.getByRole('button', { name: /Copy message/i }),
    ).toBeInTheDocument()
  })

  it('thumbs up button has aria-label and aria-pressed="false" initially', () => {
    renderActions()
    const btn = screen.getByRole('button', { name: /Good Response/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('thumbs up button toggles aria-pressed on click', async () => {
    const user = userEvent.setup()
    renderActions()
    const btn = screen.getByRole('button', { name: /Good Response/i })
    await user.click(btn)

    // After clicking, aria-pressed should be true and label should change
    const updatedBtn = screen.getByRole('button', {
      name: /Remove Good Response/i,
    })
    expect(updatedBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('thumbs down button has aria-label and aria-pressed="false" initially', () => {
    renderActions()
    const btn = screen.getByRole('button', { name: /Bad Response/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('regenerate button has aria-label="Regenerate Response"', () => {
    renderActions()
    expect(
      screen.getByRole('button', { name: /Regenerate Response/i }),
    ).toBeInTheDocument()
  })

  it('all buttons are keyboard-focusable', () => {
    const { container } = renderActions()
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
    buttons.forEach((btn) => {
      // tabIndex should be 0 (not -1)
      expect(btn.tabIndex).toBe(0)
    })
  })
})
