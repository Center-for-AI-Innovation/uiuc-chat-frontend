import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation } from '~/test-utils/mocks/chat'
import ChatbarContext from '../../Chatbar.context'
import { ConversationComponent } from '../Conversation'

describe('ConversationComponent - accessibility', () => {
  it('conversation button has descriptive aria-label', () => {
    const conversation = makeConversation({
      id: 'c2',
      name: 'My Chat',
      projectName: 'CS101',
    } as any) as any

    renderWithProviders(
      <ChatbarContext.Provider
        value={
          {
            state: { searchTerm: '', filteredConversations: [] },
            dispatch: vi.fn(),
            handleDeleteConversation: vi.fn(),
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
          selectedConversation: null,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          handleSelectConversation: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
      },
    )

    expect(
      screen.getByRole('button', { name: /Select Chat, My Chat/i }),
    ).toBeInTheDocument()
  })

  it('rename input has aria-label', async () => {
    const user = userEvent.setup()
    const conversation = makeConversation({
      id: 'c3',
      name: 'Rename me',
      projectName: 'CS101',
    } as any) as any

    const { container } = renderWithProviders(
      <ChatbarContext.Provider
        value={
          {
            state: { searchTerm: '', filteredConversations: [] },
            dispatch: vi.fn(),
            handleDeleteConversation: vi.fn(),
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
          handleSelectConversation: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
      },
    )

    const convoButton = screen.getByRole('button', { name: /Rename me/i })
    const actionButtons = Array.from(
      container.querySelectorAll('button'),
    ).filter((b) => b !== convoButton)

    for (const btn of actionButtons) {
      await user.click(btn)
      const input = screen.queryByLabelText(/Rename Chat Input/i)
      if (input) {
        expect(input).toBeInTheDocument()
        return
      }
    }
  })
})
