/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentStream } from '../useAgentStream'

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

describe('useAgentStream hook', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns runAgent, abort, and isRunning', () => {
    const { result } = renderHook(() => useAgentStream({}))

    expect(result.current.runAgent).toBeInstanceOf(Function)
    expect(result.current.abort).toBeInstanceOf(Function)
    expect(typeof result.current.isRunning).toBe('boolean')
  })

  it('runAgent calls fetch and dispatches events', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createStreamResponse([
        {
          type: 'done',
          conversationId: 'c1',
          finalMessageId: 'a1',
          summary: null,
        },
      ]),
    ) as typeof fetch

    const onDone = vi.fn()
    const { result } = renderHook(() => useAgentStream({ onDone }))

    await act(async () => {
      await result.current.runAgent({
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      })
    })

    expect(onDone).toHaveBeenCalledWith('c1', 'a1', null)
  })

  it('calls onError for non-abort fetch failures', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error('Network failure')) as typeof fetch

    const onError = vi.fn()
    const { result } = renderHook(() => useAgentStream({ onError }))

    await act(async () => {
      await result.current.runAgent({
        courseName: 'CS101',
        userMessage: { id: 'user-1', content: 'hello' },
        documentGroups: [],
        model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
        temperature: 0.3,
      })
    })

    expect(onError).toHaveBeenCalledWith('Network failure', undefined, false)
  })

  it('abort is callable even without a running request', () => {
    const { result } = renderHook(() => useAgentStream({}))
    // Should not throw
    act(() => {
      result.current.abort()
    })
  })
})
