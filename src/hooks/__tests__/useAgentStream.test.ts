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

  it('dispatches selection start and done events', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createStreamResponse([
        {
          type: 'selection',
          stepNumber: 1,
          status: 'running',
        },
        {
          type: 'selection',
          stepNumber: 1,
          status: 'done',
          selectedTools: [
            { id: 't1', name: 'search', readableName: 'Search', arguments: {} },
          ],
        },
      ]),
    ) as typeof fetch

    const onSelectionStart = vi.fn()
    const onSelectionDone = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      { onSelectionStart, onSelectionDone },
    )

    expect(onSelectionStart).toHaveBeenCalledWith(1)
    expect(onSelectionDone).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ type: 'selection', status: 'done' }),
    )
  })

  it('dispatches tool start and done events', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createStreamResponse([
        {
          type: 'tool',
          stepNumber: 2,
          status: 'running',
          toolName: 'calculator',
          readableToolName: 'Calculator',
        },
        {
          type: 'tool',
          stepNumber: 2,
          status: 'done',
          toolName: 'calculator',
          readableToolName: 'Calculator',
          outputText: '42',
          outputImageUrls: ['https://example.com/chart.png'],
        },
      ]),
    ) as typeof fetch

    const onToolStart = vi.fn()
    const onToolDone = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      { onToolStart, onToolDone },
    )

    expect(onToolStart).toHaveBeenCalledWith(2, 'calculator', 'Calculator')
    expect(onToolDone).toHaveBeenCalledWith(
      2,
      'calculator',
      { text: '42', imageUrls: ['https://example.com/chart.png'] },
      undefined,
    )
  })

  it('dispatches tool done with error message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createStreamResponse([
        {
          type: 'tool',
          stepNumber: 1,
          status: 'error',
          toolName: 'broken',
          readableToolName: 'Broken Tool',
          errorMessage: 'Tool crashed',
        },
      ]),
    ) as typeof fetch

    const onToolDone = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      { onToolDone },
    )

    expect(onToolDone).toHaveBeenCalledWith(
      1,
      'broken',
      undefined,
      'Tool crashed',
    )
  })

  it('dispatches final_tokens events', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createStreamResponse([
        { type: 'final_tokens', delta: 'Hello', done: false },
        { type: 'final_tokens', delta: ' world', done: true },
      ]),
    ) as typeof fetch

    const onFinalTokens = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      { onFinalTokens },
    )

    expect(onFinalTokens).toHaveBeenCalledTimes(2)
    expect(onFinalTokens).toHaveBeenCalledWith('Hello', false)
    expect(onFinalTokens).toHaveBeenCalledWith(' world', true)
  })

  it('dispatches agent_events_update events', async () => {
    const agentEvents = [
      { type: 'retrieval', stepNumber: 1, status: 'done', query: 'test' },
    ]

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createStreamResponse([
          { type: 'agent_events_update', agentEvents, messageId: 'msg-1' },
        ]),
      ) as typeof fetch

    const onAgentEventsUpdate = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      { onAgentEventsUpdate },
    )

    expect(onAgentEventsUpdate).toHaveBeenCalledWith(agentEvents, 'msg-1')
  })

  it('dispatches tools_update events', async () => {
    const tools = [
      {
        id: 't1',
        name: 'search',
        readableName: 'Search',
        description: 'Search tool',
      },
    ]

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createStreamResponse([
          { type: 'tools_update', tools, messageId: 'msg-1' },
        ]),
      ) as typeof fetch

    const onToolsUpdate = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      { onToolsUpdate },
    )

    expect(onToolsUpdate).toHaveBeenCalledWith(tools, 'msg-1')
  })

  it('dispatches contexts_metadata events', async () => {
    const metadata = [
      { s3_path: 's3://bucket/file.pdf', readable_filename: 'file.pdf' },
    ]

    globalThis.fetch = vi.fn().mockResolvedValue(
      createStreamResponse([
        {
          type: 'contexts_metadata',
          messageId: 'msg-1',
          contextsMetadata: metadata,
          totalContexts: 1,
        },
      ]),
    ) as typeof fetch

    const onContextsMetadata = vi.fn()

    await runAgentStream(
      {
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      },
      { onContextsMetadata },
    )

    expect(onContextsMetadata).toHaveBeenCalledWith('msg-1', metadata, 1)
  })

  it('dispatches error events from the stream', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createStreamResponse([
        {
          type: 'error',
          message: 'Step failed',
          stepNumber: 2,
          recoverable: true,
        },
      ]),
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

    expect(onError).toHaveBeenCalledWith('Step failed', 2, true)
  })

  it('reports null body through onError', async () => {
    const response = new Response(null, { status: 200 })
    // Override body to null
    Object.defineProperty(response, 'body', { value: null })

    globalThis.fetch = vi.fn().mockResolvedValue(response) as typeof fetch

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

    expect(onError).toHaveBeenCalledWith('No response body', undefined, false)
  })

  it('handles fetch throwing a non-Error through onError', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue('network down') as typeof fetch

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

    expect(onError).toHaveBeenCalledWith('Unknown error', undefined, false)
  })

  it('silently ignores AbortError', async () => {
    const abortError = new DOMException(
      'The operation was aborted',
      'AbortError',
    )
    globalThis.fetch = vi.fn().mockRejectedValue(abortError) as typeof fetch

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

    expect(onError).not.toHaveBeenCalled()
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
