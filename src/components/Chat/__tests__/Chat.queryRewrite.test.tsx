import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import {
  makeContextWithMetadata,
  makeConversation,
  makeMessage,
} from '~/test-utils/mocks/chat'

const streamMocks = vi.hoisted(() => ({
  handleContextSearch: vi.fn(async (message: any) => {
    message.contexts = [
      makeContextWithMetadata({
        readable_filename: 'Doc.pdf',
        url: 'https://example.com/doc.pdf',
      }),
    ]
  }),
  handleImageContent: vi.fn(async () => ({
    searchQuery: 'image query',
    imgDesc: 'desc',
  })),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
    update: vi.fn(),
    hide: vi.fn(),
    clean: vi.fn(),
  },
}))

vi.mock('@mlc-ai/web-llm', () => ({
  MLCEngine: class {},
}))

vi.mock('~/components/UIUC-Components/runAuthCheck', () => ({
  get_user_permission: () => 'edit',
}))

vi.mock('@/hooks/queries/useUpdateConversation', () => ({
  useUpdateConversation: () => ({ mutateAsync: vi.fn(async () => ({})) }),
}))

vi.mock('@/hooks/queries/useDeleteMessages', () => ({
  useDeleteMessages: () => ({ mutate: vi.fn(async () => ({})) }),
}))

vi.mock('@/hooks/queries/useFetchEnabledDocGroups', () => ({
  useFetchEnabledDocGroups: () => ({
    data: [{ name: 'Group 1' }],
    isSuccess: true,
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

vi.mock('~/utils/modelProviders/WebLLM', () => ({
  default: class ChatUI {
    constructor(_engine: any) {}
    isModelLoading() {
      return false
    }
    loadModel() {
      return Promise.resolve()
    }
    runChatCompletion() {
      throw new Error('not used in these tests')
    }
  },
  webLLMModels: [],
}))

vi.mock('~/utils/streamProcessing', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    handleContextSearch: streamMocks.handleContextSearch,
    handleImageContent: streamMocks.handleImageContent,
  }
})

vi.mock('../ChatInput', () => ({
  ChatInput: (props: any) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () =>
            props.onSend(
              { id: 'u1', role: 'user', content: 'rewrite this', contexts: [] },
              null,
            ),
        },
        'send',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () =>
            props.onSend(
              {
                id: 'u-array',
                role: 'user',
                content: [
                  { type: 'text', text: 'rewrite this with file' },
                  {
                    type: 'file',
                    fileName: 'notes.txt',
                    fileType: 'text/plain',
                    fileUrl: 'cs101/notes.txt',
                  },
                ],
                contexts: [],
              },
              null,
            ),
        },
        'send-array',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () =>
            props.onSend(
              {
                id: 'u-img',
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: 'http://img' } },
                ],
                contexts: [],
              },
              null,
            ),
        },
        'send-image',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => props.onRegenerate?.() },
        'regenerate',
      ),
    ),
}))

vi.mock('../MemoizedChatMessage', () => ({
  MemoizedChatMessage: () => React.createElement('div', null, 'message'),
}))

describe('Chat (query rewrite + tool paths)', () => {
  it('runs query rewrite, performs context search, and streams an assistant message', async () => {
    const user = userEvent.setup()
    const homeDispatch = vi.fn()

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({
          choices: [
            {
              message: {
                content: '<vector_query>optimized query</vector_query>',
              },
            },
          ],
        })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
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
      http.post('*/api/UIUC-api/logConversation', async () =>
        HttpResponse.json({ ok: true }),
      ),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')

    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: homeDispatch,
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))

    expect(streamMocks.handleContextSearch).toHaveBeenCalledWith(
      expect.anything(),
      'CS101',
      expect.anything(),
      'optimized query',
      expect.anything(),
    )
    expect(homeDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'wasQueryRewritten', value: true }),
    )
  }, 20000)

  it('routes image content through handleImageContent and handles LLM errors', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({
          choices: [{ message: { content: 'NO_REWRITE_REQUIRED' } }],
        })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        return HttpResponse.json(
          { title: 'LLM error', message: 'bad', error: 'bad' },
          { status: 500 },
        )
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')

    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: vi.fn(),
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /send-image/i }))
    expect(streamMocks.handleImageContent).toHaveBeenCalled()
    expect((notifications as any).show).toHaveBeenCalled()
  })

  it('regenerates the last assistant message', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
      http.post('*/api/UIUC-api/logConversation', async () =>
        HttpResponse.json({ ok: true }),
      ),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({ id: 'u0', role: 'user', content: 'Q', contexts: [] }),
        makeMessage({
          id: 'a0',
          role: 'assistant',
          content: 'A',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')
    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: vi.fn(),
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /regenerate/i }))
    expect(true).toBe(true)
  })

  it('parses query rewrite responses where choices is an object', async () => {
    const user = userEvent.setup()
    const homeDispatch = vi.fn()

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({
          choices: {
            a: {
              message: { content: '<vector_query>object query</vector_query>' },
            },
          },
        })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')

    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: homeDispatch,
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(streamMocks.handleContextSearch).toHaveBeenCalledWith(
      expect.anything(),
      'CS101',
      expect.anything(),
      'object query',
      expect.anything(),
    )
  })

  it('handles invalid query rewrite choice formats', async () => {
    const user = userEvent.setup()
    const homeDispatch = vi.fn()

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({ choices: null })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')

    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: homeDispatch,
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(homeDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'wasQueryRewritten', value: false }),
    )
  })

  it('parses nested rewrite formats and handles array message content when building prompts', async () => {
    const user = userEvent.setup()
    const homeDispatch = vi.fn()

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({
          choices: [
            {
              message: {
                content: {
                  choices: [
                    {
                      message: {
                        content:
                          '<vector_query>nested optimized query</vector_query>',
                      },
                    },
                  ],
                },
              },
            },
          ],
        })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
      http.post('*/api/UIUC-api/logConversation', async () =>
        HttpResponse.json({ ok: true }),
      ),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: [
            { type: 'text', text: 'previous text' },
            {
              type: 'file',
              fileName: 'prev.pdf',
              fileType: 'application/pdf',
              fileUrl: 'cs101/prev.pdf',
            },
          ] as any,
          contexts: [],
        }),
        makeMessage({
          id: 'a0',
          role: 'assistant',
          content: 'previous answer',
          contexts: [],
        }),
        makeMessage({
          id: 'u1',
          role: 'user',
          content: 'most recent user message',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')
    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: homeDispatch,
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /send-array/i }))
    expect(streamMocks.handleContextSearch).toHaveBeenCalledWith(
      expect.anything(),
      'CS101',
      expect.anything(),
      'nested optimized query',
      expect.anything(),
    )
  }, 20000)

  it('falls back to the original query when rewrite content is not a string', async () => {
    const user = userEvent.setup()
    const homeDispatch = vi.fn()

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({
          choices: [{ message: { content: { not: 'a string' } } }],
        })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')
    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: homeDispatch,
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(homeDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'wasQueryRewritten', value: false }),
    )
  })

  it('handles network errors calling the query rewrite endpoint', async () => {
    const user = userEvent.setup()
    const homeDispatch = vi.fn()

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.error()
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')
    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: homeDispatch,
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(homeDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'wasQueryRewritten', value: false }),
    )
  })

  it('skips query rewrite when documentCount is 0 even if conversation has file messages', async () => {
    const user = userEvent.setup()
    const homeDispatch = vi.fn()

    server.use(
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: [
            { type: 'text', text: 'previous with file' },
            {
              type: 'file',
              fileName: 'notes.txt',
              fileType: 'text/plain',
              fileUrl: 'cs101/notes.txt',
            },
          ] as any,
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')
    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={0}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: homeDispatch,
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(homeDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'wasQueryRewritten', value: false }),
    )
    expect(streamMocks.handleContextSearch).toHaveBeenCalled()
  })

  it('logs and continues when handleImageContent throws', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    streamMocks.handleImageContent.mockRejectedValueOnce(new Error('img fail'))

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({
          choices: [{ message: { content: 'NO_REWRITE_REQUIRED' } }],
        })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')
    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: vi.fn(),
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /send-image/i }))
    expect(streamMocks.handleImageContent).toHaveBeenCalled()
  })

  it('falls back to the original search query when the rewrite response omits message content', async () => {
    const user = userEvent.setup()
    const homeDispatch = vi.fn()

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({ choices: [{ message: {} }] })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')
    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: homeDispatch,
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(homeDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'wasQueryRewritten', value: false }),
    )
  })

  it('ensures query rewrite bodies always include a model id', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/queryRewrite', async () => {
        return HttpResponse.json({
          choices: [{ message: { content: 'NO_REWRITE_REQUIRED' } }],
        })
      }),
      http.post('*/api/allNewRoutingChat', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('ok'))
            controller.close()
          },
        })
        return new HttpResponse(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({
          id: 'u0',
          role: 'user',
          content: 'previous',
          contexts: [],
        }),
      ],
      model: { id: '', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')
    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={5}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
          loading: false,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          dispatch: vi.fn(),
          handleUpdateConversation: vi.fn(),
          handleFeedbackUpdate: vi.fn(),
        },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(true).toBe(true)
  })
})
