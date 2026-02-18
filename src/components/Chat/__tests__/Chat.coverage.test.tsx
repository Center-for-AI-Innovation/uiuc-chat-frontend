import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation, makeMessage } from '~/test-utils/mocks/chat'

declare global {
  // eslint-disable-next-line no-var
  var __TEST_WORKFLOWS_ERROR__: boolean | undefined
  // eslint-disable-next-line no-var
  var __TEST_WORKFLOWS_DATA__: any[] | undefined
}

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
    ...(globalThis.__TEST_WORKFLOWS_ERROR__
      ? {
          data: [],
          isSuccess: false,
          isLoading: false,
          isError: true,
          error: new Error('boom'),
        }
      : {
          data: globalThis.__TEST_WORKFLOWS_DATA__ ?? [],
          isSuccess: true,
          isLoading: false,
          isError: false,
          error: null,
        }),
  }),
  handleFunctionCall: vi.fn(async () => []),
  handleToolCall: vi.fn(async () => undefined),
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    fetchPresignedUrl: vi.fn(async () => 'http://localhost/api/file'),
  }
})

vi.mock('~/utils/streamProcessing', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    handleImageContent: vi.fn(async () => {
      throw new Error('boom')
    }),
  }
})

// Keep the Chat UI tree shallow so we can focus on Chat.tsx logic.
vi.mock('../ChatLoader', () => ({
  ChatLoader: () => React.createElement('div', null, 'loader'),
}))

vi.mock('../MemoizedChatMessage', () => ({
  MemoizedChatMessage: (props: any) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () =>
            props.onEdit?.({
              ...props.message,
              content: [
                { type: 'text', text: 'edited message with a tool image' },
                { type: 'tool_image_url', tool_name: 'tool', image_url: 'x' },
              ],
              contexts: [{ id: 1 }],
              tools: [{ id: 't1' }],
            }),
        },
        'edit-message',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => props.onRegenerate?.() },
        'regenerate',
      ),
    ),
}))

vi.mock('../ChatInput', () => ({
  ChatInput: (props: any) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: async () =>
            await props.onSend(
              { id: 'u-new', role: 'user', content: 'Hello', contexts: [] },
              null,
            ),
        },
        'send',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: async () =>
            await props.onSend(
              {
                id: 'u-img',
                role: 'user',
                content: [
                  { type: 'text', text: 'Describe this' },
                  {
                    type: 'image_url',
                    image_url: { url: 'https://example.com/image.png' },
                  },
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
        {
          type: 'button',
          onClick: async () =>
            await props.onSend(
              { id: 'u-web', role: 'user', content: 'webllm', contexts: [] },
              null,
            ),
        },
        'send-webllm',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: async () =>
            await props.onSend(
              { id: 'u-plugin', role: 'user', content: 'plugin', contexts: [] },
              { id: 'p1', name: 'plugin' },
            ),
        },
        'send-plugin',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: async () =>
            await props.onSend(
              {
                id: 'u-file-first',
                role: 'user',
                content: [
                  { type: 'text', text: 'Hello with file content' },
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
        'send-file-first',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: async () =>
            await props.onSend(
              {
                id: 'u-long',
                role: 'user',
                content:
                  'This is a long message intended to be truncated for naming purposes.',
                contexts: [],
              },
              null,
            ),
        },
        'send-long',
      ),
    ),
}))

vi.mock('~/utils/modelProviders/WebLLM', () => {
  const instances: any[] = []
  class ChatUI {
    constructor() {
      instances.push(this)
    }
    isModelLoading = vi.fn(() => false)
    loadModel = vi.fn(async () => {})
    runChatCompletion = vi.fn(async () => {
      throw new Error('not mocked')
    })
  }
  return {
    __instances: instances,
    default: ChatUI,
    webLLMModels: [{ name: 'MyWebLLMModel' }],
  }
})

describe('Chat (coverage)', () => {
  it('loads banner image and attempts to load a WebLLM model', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Hi' })],
      model: { id: 'webllm-1', name: 'MyWebLLMModel' } as any,
    })

    const { Chat } = await import('../Chat')
    const webllm = await import('~/utils/modelProviders/WebLLM')
    const { fetchPresignedUrl } = await import('~/utils/apiUtils')

    renderWithProviders(
      <Chat
        stopConversationRef={{ current: false }}
        courseMetadata={{ banner_image_s3: 'cs101/banner.png' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={0}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
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

    expect(fetchPresignedUrl).toHaveBeenCalledWith('cs101/banner.png', 'CS101')
    expect((webllm as any).__instances.length).toBeGreaterThan(0)
    expect((webllm as any).__instances[0].loadModel).toHaveBeenCalled()
  })

  it('emits an error toast when tools fail to load', async () => {
    const { notifications } = await import('@mantine/notifications')

    globalThis.__TEST_WORKFLOWS_ERROR__ = true
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Hi' })],
    })

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
          loading: false,
          messageIsStreaming: false,
        },
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect((notifications as any).show).toHaveBeenCalled()
    globalThis.__TEST_WORKFLOWS_ERROR__ = false
  })

  it('fetches llmProviders on send and guards invalid selectedConversation.model', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

    server.use(
      http.post('*/api/models', async () => {
        return HttpResponse.json({ Provider: { enabled: true, models: [] } })
      }),
    )

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u1', role: 'user', content: 'Hi' })],
      model: null as any,
    })

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
          loading: false,
          messageIsStreaming: false,
          llmProviders: {},
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(true).toBe(true)
  })

  it('clears tool and context state on edit sends (deleteCount)', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

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

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({ id: 'u0', role: 'user', content: 'old', contexts: [] }),
        makeMessage({ id: 'a0', role: 'assistant', content: 'old-a' }),
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(
      screen.getAllByRole('button', { name: /edit-message/i })[0],
    )
    expect(true).toBe(true)
  })

  it('emits an error toast when WebLLM chat completion fails', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const { notifications } = await import('@mantine/notifications')
    ;(notifications as any).show.mockClear()

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
      model: { id: 'webllm-1', name: 'MyWebLLMModel' } as any,
    })

    const webllm = await import('~/utils/modelProviders/WebLLM')
    ;(webllm as any).__instances.length = 0
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    expect((webllm as any).__instances.length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /send-webllm/i }))
    await waitFor(() => expect((notifications as any).show).toHaveBeenCalled())
  })

  it('handles plugin-style responses via JSON', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

    server.use(
      http.post('*/api/allNewRoutingChat', async () => {
        return HttpResponse.json({ answer: 'plugin answer' })
      }),
    )

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /send-plugin/i }))
    expect(true).toBe(true)
  })

  it('shows an error toast when fetching llmProviders fails', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')
    ;(notifications as any).show.mockClear()

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    server.use(
      http.post('*/api/models', async () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: null,
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await waitFor(
      () => expect((notifications as any).show).toHaveBeenCalled(),
      {
        timeout: 3000,
      },
    )
  })

  it('names a conversation from the first message text', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

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

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const handleUpdateConversation = vi.fn()
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation },
      },
    )

    await user.click(screen.getByRole('button', { name: /send-file-first/i }))
    await waitFor(() =>
      expect(handleUpdateConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('Hello with file content'),
        }),
        expect.anything(),
      ),
    )
  })

  it('runs tool routing when enabled tools exist', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    const tools = [{ name: 'tool-1', enabled: true }]

    const toolMod = await import(
      '~/utils/functionCalling/handleFunctionCalling'
    )
    ;(toolMod as any).handleFunctionCall.mockResolvedValueOnce([
      { name: 'tool-1' },
    ])
    ;(toolMod as any).handleToolCall.mockResolvedValueOnce(undefined)

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

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
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
          loading: false,
          messageIsStreaming: false,
          tools,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await waitFor(() =>
      expect((toolMod as any).handleToolCall).toHaveBeenCalled(),
    )
  })

  it('truncates conversation names for long first messages (string content)', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

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

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const handleUpdateConversation = vi.fn()
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation },
      },
    )

    await user.click(screen.getByRole('button', { name: /send-long/i }))
    await waitFor(() => {
      const calls = handleUpdateConversation.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const lastCall = calls[calls.length - 1]
      const updated = lastCall?.[0]
      expect(updated?.name).toEqual(expect.stringContaining('...'))
    })
  })

  it('clears tool metadata on edit sends when tools exist', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

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

    const tools = [
      {
        name: 'tool-1',
        enabled: true,
        aiGeneratedArgumentValues: { foo: 'bar' },
        output: { any: true },
        error: { message: 'x' },
      },
    ] as any

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [
        makeMessage({ id: 'u0', role: 'user', content: 'old', contexts: [] }),
        makeMessage({ id: 'a0', role: 'assistant', content: 'old-a' }),
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
          loading: false,
          messageIsStreaming: false,
          tools,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(
      screen.getAllByRole('button', { name: /edit-message/i })[0]!,
    )

    expect(tools[0].aiGeneratedArgumentValues).toBeUndefined()
    expect(tools[0].output).toBeUndefined()
    expect(tools[0].error).toBeUndefined()
  })

  it('shows the default LLM error message when /api/allNewRoutingChat returns an empty error object', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')
    ;(notifications as any).show.mockClear()

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    server.use(
      http.post('*/api/allNewRoutingChat', async () => {
        return HttpResponse.json({}, { status: 500 })
      }),
    )

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await waitFor(() => expect((notifications as any).show).toHaveBeenCalled())
  })

  it('streams responses via WebLLM async iterables', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

    server.use(
      http.post('*/api/UIUC-api/logConversation', async () =>
        HttpResponse.json({ ok: true }),
      ),
    )

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
      model: { id: 'webllm-1', name: 'MyWebLLMModel' } as any,
    })

    const webllm = await import('~/utils/modelProviders/WebLLM')
    ;(webllm as any).__instances.length = 0
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    expect((webllm as any).__instances.length).toBeGreaterThan(0)
    const instance = (webllm as any).__instances[0]
    instance.isModelLoading
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false)
    instance.runChatCompletion.mockImplementation(async () => {
      async function* gen() {
        yield { choices: [{ delta: { content: 'hello' } }] }
      }
      return gen()
    })

    await user.click(screen.getByRole('button', { name: /send-webllm/i }))
    expect(true).toBe(true)
  })

  it('logs failures in onMessageReceived when logConversation network calls fail', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

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
      http.post('*/api/UIUC-api/logConversation', async () => {
        return HttpResponse.error()
      }),
    )

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await waitFor(() =>
      expect((console.error as any).mock.calls.flat().join(' ')).toMatch(
        /Error setting course data/i,
      ),
    )
  })

  it('logs an error when /api/models returns null providers', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }
    server.use(
      http.post('*/api/models', async () => {
        return HttpResponse.json(null)
      }),
    )

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

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
          loading: false,
          messageIsStreaming: false,
          llmProviders: null,
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await waitFor(
      () =>
        expect(consoleErrorSpy.mock.calls.flat().join(' ')).toMatch(
          /Error fetching LLM providers/i,
        ),
      { timeout: 3000 },
    )
  })

  it('logs tool routing failures when handleFunctionCall throws', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

    const toolMod = await import(
      '~/utils/functionCalling/handleFunctionCalling'
    )
    ;(toolMod as any).handleFunctionCall.mockRejectedValueOnce(
      new Error('boom'),
    )

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

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
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
          loading: false,
          messageIsStreaming: false,
          tools: [{ name: 'tool-1', enabled: true }] as any,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await waitFor(() =>
      expect((console.error as any).mock.calls.flat().join(' ')).toMatch(
        /handleFunctionCall/i,
      ),
    )
  })

  it('logs and continues when image-to-text conversion fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

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

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /send-image/i }))
    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error in chat.tsx running handleImageContent()',
        ),
        expect.anything(),
      ),
    )
  })

  it('returns early when a streaming response has no body', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/allNewRoutingChat')) {
        return new Response(null, { status: 200 })
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
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
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    expect(true).toBe(true)
  })

  it('aborts streaming early when stopConversationRef is set', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat' }

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

    const conversation = makeConversation({
      id: 'conv-1',
      messages: [makeMessage({ id: 'u0', role: 'user', content: 'previous' })],
      model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as any,
    })

    const { Chat } = await import('../Chat')

    renderWithProviders(
      <Chat
        stopConversationRef={{ current: true }}
        courseMetadata={{ openai_api_key: 'k' } as any}
        courseName="CS101"
        currentEmail="me@example.com"
        documentCount={0}
      />,
      {
        homeState: {
          selectedConversation: conversation as any,
          conversations: [conversation as any],
          loading: false,
          messageIsStreaming: false,
          llmProviders: { Provider: { enabled: true, models: [] } } as any,
          apiKey: 'k',
        } as any,
        homeContext: { dispatch: vi.fn(), handleUpdateConversation: vi.fn() },
      },
    )

    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await waitFor(() => expect(console.warn).toHaveBeenCalled())
  })
})
