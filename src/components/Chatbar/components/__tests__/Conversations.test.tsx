import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation } from '~/test-utils/mocks/chat'
import ChatbarContext from '../../Chatbar.context'
import { Conversations } from '../Conversations'

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props),
  },
}))

const defaultChatbarValue = {
  state: { searchTerm: '', filteredConversations: [] },
  dispatch: vi.fn(),
  handleDeleteConversation: vi.fn(),
  handleClearConversations: vi.fn(),
  handleExportData: vi.fn(),
  handleApiKeyChange: vi.fn(),
  isExporting: false,
} as any

describe('Conversations', () => {
  it('renders only conversations without folderId and calls onLoadMore when sentinel is observed', () => {
    const onLoadMore = vi.fn()
    const conv1 = makeConversation({
      id: 'c1',
      name: 'Conv 1',
      projectName: 'CS101',
    }) as any
    const conv2 = makeConversation({
      id: 'c2',
      name: 'Conv 2',
      projectName: 'CS101',
      folderId: 'f1',
    }) as any
    const conv3 = makeConversation({
      id: 'c3',
      name: 'Conv 3',
      projectName: 'CS101',
    }) as any

    let observerCallback: (entries: { isIntersecting: boolean }[]) => void
    const observe = vi.fn()
    const unobserve = vi.fn()
    const disconnect = vi.fn()

    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((callback: (e: { isIntersecting: boolean }[]) => void) => {
        observerCallback = callback
        return { observe, unobserve, disconnect }
      }),
    )

    renderWithProviders(
      <ChatbarContext.Provider value={defaultChatbarValue}>
        <Conversations
          conversations={[conv1, conv2, conv3]}
          onLoadMore={onLoadMore}
        />
      </ChatbarContext.Provider>,
      {
        homeState: { selectedConversation: conv1, messageIsStreaming: false },
        homeContext: {
          handleSelectConversation: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
      },
    )

    expect(screen.getByRole('button', { name: /Conv 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Conv 3/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Conv 2/i }),
    ).not.toBeInTheDocument()

    const sentinel = document.querySelector('.h-1')
    expect(sentinel).toBeTruthy()
    expect(observe).toHaveBeenCalledWith(sentinel)

    observerCallback!([{ isIntersecting: true }])
    expect(onLoadMore).toHaveBeenCalled()
  })
})
