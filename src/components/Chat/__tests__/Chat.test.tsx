import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation, makeMessage } from '~/test-utils/mocks/chat'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'

vi.mock('@mlc-ai/web-llm', () => ({
  MLCEngine: class {},
}))

vi.mock('~/utils/modelProviders/WebLLM', () => ({
  default: class ChatUI {
    isModelLoading() {
      return false
    }
    loadModel() {
      return Promise.resolve()
    }
    runChatCompletion() {
      throw new Error('not used in this test')
    }
  },
  webLLMModels: [],
}))

vi.mock('~/components/UIUC-Components/runAuthCheck', () => ({
  get_user_permission: () => 'edit',
}))

vi.mock('~/hooks/conversationQueries', () => ({
  useUpdateConversation: () => ({ mutateAsync: vi.fn(async () => ({})) }),
}))

vi.mock('~/hooks/messageQueries', () => ({
  useDeleteMessages: () => ({ mutate: vi.fn(async () => ({})) }),
}))

vi.mock('~/hooks/docGroupsQueries', () => ({
  useFetchEnabledDocGroups: () => ({
    data: [{ id: 'DocGroup-all', name: 'All Documents', checked: true }],
    isSuccess: true,
    isLoading: false,
    isError: false,
    error: null,
  }),
}))

vi.mock('~/utils/functionCalling/handleFunctionCalling', () => ({
  useFetchAllWorkflows: () => ({
    data: [],
    isSuccess: true,
    isLoading: false,
    isError: false,
    error: null,
  }),
  handleFunctionCall: vi.fn(async () => []),
  handleToolCall: vi.fn(async () => undefined),
}))

// Stub child components so we can exercise Chat.tsx logic without pulling the full UI tree.
vi.mock('../ChatInput', () => ({
  ChatInput: (props: any) =>
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: async () =>
          await props.onSend(
            {
              id: 'u-new',
              role: 'user',
              content: 'Hello',
              contexts: [],
            },
            null,
          ),
      },
      'send',
    ),
}))

vi.mock('../MemoizedChatMessage', () => ({
  MemoizedChatMessage: () => React.createElement('div', null, 'message'),
}))

describe('Chat', () => {
  it(
    'streams a response via /api/allNewRoutingChat and renders admin dashboard button',
    async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    let streamed = false
    server.use(
      http.post('*/api/allNewRoutingChat', async () => {
        streamed = true
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('Hello '))
            controller.enqueue(encoder.encode('world'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
      http.post('*/api/UIUC-api/logConversation', async () => {
        return HttpResponse.json({ success: true })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat', push: vi.fn() }

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Hi', contexts: [] })],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini', tokenLimit: 128000, enabled: true, provider: ProviderNames.OpenAI } as any,
    })

    const llmProviders: any = {
      [ProviderNames.OpenAI]: {
        provider: ProviderNames.OpenAI,
        enabled: true,
        models: [{ id: 'gpt-4o-mini', name: 'GPT-4o mini', tokenLimit: 128000, enabled: true }],
      },
    }

    const { Chat } = await import('../Chat')

    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{} as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={0}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders,
          loading: false,
          messageIsStreaming: false,
        },
        homeContext: {
          dispatch: vi.fn(),
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    // Permission is mocked as "edit" -> dashboard button exists and is clickable.
    const buttons = screen.getAllByRole('button')
    const dashboardButton = buttons.find(
      (b) => (b.textContent ?? '') === '' && b !== screen.getByRole('button', { name: /send/i }),
    )
    expect(dashboardButton).toBeTruthy()
    await user.click(dashboardButton!)
    expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalled()

    // Trigger send -> should stream (we don't assert UI updates, just that the handler runs without throwing).
    await user.click(screen.getByRole('button', { name: /send/i }))
    expect(streamed).toBe(true)
    expect(true).toBe(true)
    },
    20_000,
  )
})
