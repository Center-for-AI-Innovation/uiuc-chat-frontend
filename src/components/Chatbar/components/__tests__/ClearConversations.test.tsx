import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { ClearConversations } from '../ClearConversations'

describe('ClearConversations', () => {
  it('shows Clear conversations button and enters confirm state on click', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()

    renderWithProviders(<ClearConversations onClearConversations={onClear} />)

    const clearBtn = screen.getByRole('button', {
      name: /Clear conversations/i,
    })
    await user.click(clearBtn)
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument()
    expect(onClear).not.toHaveBeenCalled()
  })

  it('calls onClearConversations when user confirms with check icon', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()

    renderWithProviders(<ClearConversations onClearConversations={onClear} />)
    await user.click(
      screen.getByRole('button', { name: /Clear conversations/i }),
    )
    const confirmRow = screen
      .getByText(/Are you sure/i)
      .closest('div')?.parentElement
    const iconContainer = confirmRow?.querySelector('[class*="40px"]')
    const checkIcon = iconContainer?.children[0]
    expect(checkIcon).toBeTruthy()
    await user.click(checkIcon as HTMLElement)
    expect(onClear).toHaveBeenCalled()
  })

  it('cancels confirm state when user clicks X icon', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()

    renderWithProviders(<ClearConversations onClearConversations={onClear} />)
    await user.click(
      screen.getByRole('button', { name: /Clear conversations/i }),
    )
    const confirmRow = screen
      .getByText(/Are you sure/i)
      .closest('div')?.parentElement
    const iconContainer = confirmRow?.querySelector('[class*="40px"]')
    const xIcon = iconContainer?.children[1]
    expect(xIcon).toBeTruthy()
    await user.click(xIcon as HTMLElement)
    expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument()
    expect(onClear).not.toHaveBeenCalled()
  })
})
