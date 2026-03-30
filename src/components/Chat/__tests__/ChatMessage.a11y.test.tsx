import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation, makeMessage } from '~/test-utils/mocks/chat'

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  ),
  AnimatePresence: ({ children }: any) =>
    React.createElement(React.Fragment, null, children),
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchPresignedUrl: vi.fn(async () => 'http://localhost/api/file'),
  }
})

vi.mock('@/hooks/__internal__/conversation', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    saveConversationToServer: vi.fn(async () => ({})),
  }
})

vi.mock('../FeedbackModal', () => ({
  FeedbackModal: () => null,
}))

vi.mock('../MessageActions', () => ({
  default: () => null,
}))

describe('ChatMessage - accessibility', () => {
  it('assistant message container has aria-live="polite" for streaming', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { ChatMessage, SourcesSidebarProvider } = await import(
      '../ChatMessage'
    )

    const assistantMsg = makeMessage({
      id: 'a1',
      role: 'assistant',
      content: 'Here is the answer.',
    })

    const conversation = makeConversation({
      id: 'c1',
      messages: [assistantMsg],
    })

    const { container } = renderWithProviders(
      <SourcesSidebarProvider>
        <ChatMessage
          message={assistantMsg}
          messageIndex={0}
          onEdit={vi.fn()}
          courseName="CS101"
        />
      </SourcesSidebarProvider>,
      {
        homeState: {
          selectedConversation: conversation as any,
          messageIsStreaming: true,
          loading: false,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeTruthy()
  }, 10_000)
})
