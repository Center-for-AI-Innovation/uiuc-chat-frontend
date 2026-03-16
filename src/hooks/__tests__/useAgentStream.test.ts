/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { runAgentStream } from '../useAgentStream'

const originalFetch = globalThis.fetch

const createStreamResponse = (events: unknown[]) => {
  const encoder = new TextEncoder()
  const body = new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      controller.close()
    },
  })

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

describe('runAgentStream', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('dispatches parsed SSE events through the provided callbacks', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createStreamResponse([
        {
          type: 'initializing',
          messageId: 'user-1',
          conversationId: 'conversation-1',
          assistantMessageId: 'assistant-1',
        },
        {
          type: 'retrieval',
          stepNumber: 1,
          status: 'running',
          query: 'transformers',
        },
        {
          type: 'retrieval',
          stepNumber: 1,
          status: 'done',
          query: 'transformers',
          contextsRetrieved: 6,
        },
        {
          type: 'done',
          conversationId: 'conversation-1',
          finalMessageId: 'assistant-1',
          summary: {
            totalContextsRetrieved: 6,
            toolsExecuted: [],
          },
        },
      ]),
    ) as typeof fetch

    const onInitializing = vi.fn()
    const onRetrievalStart = vi.fn()
    const onRetrievalDone = vi.fn()
    const onDone = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      {
        onInitializing,
        onRetrievalStart,
        onRetrievalDone,
        onDone,
      },
    )

    expect(onInitializing).toHaveBeenCalledWith(
      'user-1',
      'conversation-1',
      'assistant-1',
    )
    expect(onRetrievalStart).toHaveBeenCalledWith(1, 'transformers')
    expect(onRetrievalDone).toHaveBeenCalledWith(1, 'transformers', 6)
    expect(onDone).toHaveBeenCalledWith('conversation-1', 'assistant-1', {
      totalContextsRetrieved: 6,
      toolsExecuted: [],
    })
  })

  it('reports non-ok responses through onError', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'bad request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as typeof fetch

    const onError = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      { onError },
    )

    expect(onError).toHaveBeenCalledWith('bad request', undefined, false)
  })

  it('sends the standard persistence headers with agent requests', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(createStreamResponse([])) as typeof fetch

    await runAgentStream(
      {
        courseName: 'CS101',
        userEmail: 'user@example.com',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      {},
    )

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/agent',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-user-email': 'user@example.com',
        }),
      }),
    )
  })
})
