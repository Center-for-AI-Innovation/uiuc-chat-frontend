import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act, waitFor } from '@testing-library/react'

import { useQueryRewrite } from '../queries/useQueryRewrite'
import { useRunAgent } from '../queries/useRunAgent'
import { useLogConversation } from '../queries/useLogConversation'
import type { ChatBody, Conversation } from '~/types/chat'
import type { AgentRunRequest } from '~/types/agentStream'
import { logConversationToServer } from '@/hooks/__internal__/conversation'

vi.mock('~/hooks/useAgentStream', () => ({
  runAgentStream: vi.fn(),
}))

vi.mock('@/hooks/__internal__/conversation', () => ({
  logConversationToServer: vi.fn(),
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('react-query agent + orchestration hooks', () => {
  const originalFetch = globalThis.fetch
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    // @ts-expect-error - allow overriding fetch in test
    globalThis.fetch = fetchMock
  })

  afterEach(() => {
    // @ts-expect-error - restore fetch in test
    globalThis.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('useQueryRewrite posts to /api/queryRewrite and returns the Response', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)

    const okResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    fetchMock.mockResolvedValueOnce(okResponse)

    const body = {
      key: 'k',
      course_name: 'CS101',
      stream: false,
      mode: 'chat',
    } satisfies ChatBody

    const { result } = renderHook(() => useQueryRewrite(), { wrapper: Wrapper })
    let response: Response | undefined

    await act(async () => {
      response = await result.current.mutateAsync(body)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/queryRewrite',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    expect(response).toBe(okResponse)
  })

  it('useQueryRewrite throws a titled Error when the response is not ok', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ title: 'Bad', error: 'Nope' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const body = {
      key: 'k',
      course_name: 'CS101',
      stream: false,
      mode: 'chat',
    } satisfies ChatBody

    const { result } = renderHook(() => useQueryRewrite(), { wrapper: Wrapper })

    await expect(result.current.mutateAsync(body)).rejects.toMatchObject({
      message: 'Nope',
      title: 'Bad',
    })
  })

  it('useRunAgent runs the stream with an AbortSignal and abort() cancels it', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)

    const { runAgentStream } = await import('~/hooks/useAgentStream')

    let capturedSignal: AbortSignal | undefined
    let resolveRun!: () => void
    const runPromise = new Promise<void>((resolve) => {
      resolveRun = resolve
    })

    ;(runAgentStream as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (
        _request: AgentRunRequest,
        _callbacks: any,
        signal?: AbortSignal,
      ) => {
        capturedSignal = signal
        return runPromise
      },
    )

    const { result } = renderHook(() => useRunAgent(), { wrapper: Wrapper })
    const request = { courseName: 'CS101', conversationId: 'c1' } as any

    act(() => {
      result.current.mutate({
        request,
        callbacks: {},
      })
    })

    await waitFor(() => expect(runAgentStream).toHaveBeenCalled())
    expect(capturedSignal).toBeDefined()
    expect(capturedSignal?.aborted).toBe(false)

    act(() => {
      result.current.abort()
    })
    expect(capturedSignal?.aborted).toBe(true)

    resolveRun()
    await waitFor(() => expect(result.current.isPending).toBe(false))
  })

  it('useLogConversation calls logConversationToServer with course_name', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)

    ;(
      logConversationToServer as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(true)

    const conversation = { id: 'c1' } as unknown as Conversation
    const { result } = renderHook(() => useLogConversation('CS101'), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync(conversation)
    })

    expect(logConversationToServer).toHaveBeenCalledWith(conversation, 'CS101')
  })
})
