import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation } from '~/test-utils/mocks/chat'
import ChatbarContext from '../../Chatbar.context'
import { ConversationComponent } from '../Conversation'

describe('ConversationComponent', () => {
  it('selects, renames, and deletes a conversation', async () => {
    const user = userEvent.setup()
    const conversation = makeConversation({
      id: 'c1',
      name: 'Old name',
      projectName: 'CS101',
    } as any) as any

    const handleSelectConversation = vi.fn()
    const handleUpdateConversation = vi.fn()
    const handleDeleteConversation = vi.fn()

    const { container } = renderWithProviders(
      <ChatbarContext.Provider
        value={
          {
            state: { searchTerm: '', filteredConversations: [] },
            dispatch: vi.fn(),
            handleDeleteConversation,
            handleClearConversations: vi.fn(),
            handleExportData: vi.fn(),
            handleApiKeyChange: vi.fn(),
            isExporting: false,
          } as any
        }
      >
        <ConversationComponent conversation={conversation} />
      </ChatbarContext.Provider>,
      {
        homeState: {
          selectedConversation: conversation,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          handleSelectConversation,
          handleUpdateConversation,
        } as any,
      },
    )

    await user.click(screen.getByRole('button', { name: /old name/i }))
    expect(handleSelectConversation).toHaveBeenCalledWith(conversation)

    // rename flow
    const convoButton = screen.getByRole('button', { name: /old name/i })
    const actionButtons = Array.from(
      container.querySelectorAll('button'),
    ).filter((b) => b !== convoButton)
    let input: HTMLElement | null = null
    if (actionButtons[0]) await user.click(actionButtons[0])
    input = screen.queryByRole('textbox')
    if (!input && actionButtons[1]) {
      await user.click(actionButtons[1])
      input = screen.queryByRole('textbox')
    }
    expect(input).toBeTruthy()
    await user.clear(input)
    await user.type(input, 'New name{enter}')
    expect(handleUpdateConversation).toHaveBeenCalledWith(conversation, {
      key: 'name',
      value: 'New name',
    })

    // delete flow
    const postRenameButtons = Array.from(
      container.querySelectorAll('button'),
    ).filter((b) => b !== convoButton)
    const deleteButton = postRenameButtons.at(-1)
    expect(deleteButton).toBeTruthy()
    await user.click(deleteButton!)

    const confirmButtons = Array.from(
      container.querySelectorAll('button'),
    ).filter((b) => b !== convoButton)
    // Click all action buttons in confirm state; only the confirm button triggers delete.
    for (const btn of confirmButtons) {
      await user.click(btn)
      if (handleDeleteConversation.mock.calls.length > 0) break
    }
    expect(handleDeleteConversation).toHaveBeenCalledWith(conversation)
  })
})
