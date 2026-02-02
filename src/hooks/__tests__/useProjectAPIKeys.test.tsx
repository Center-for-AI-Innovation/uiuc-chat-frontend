import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useGetProjectLLMProviders,
  useSetProjectLLMProviders,
} from '../useProjectAPIKeys'
import { ProviderNames, type AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function makeProviders(): AllLLMProviders {
  const base: Record<string, any> = {}
  for (const provider of Object.values(ProviderNames)) {
    base[provider] = { provider, enabled: false, models: [] }
  }
  return base as unknown as AllLLMProviders
}

describe('useProjectAPIKeys hooks', () => {
  it('useGetProjectLLMProviders fetches providers', async () => {
    const providers = makeProviders()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(providers), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const { result } = renderHook(
      () => useGetProjectLLMProviders({ projectName: 'proj' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(providers)
  })

  it('useGetProjectLLMProviders throws on non-ok responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response('nope', { status: 500 })),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    })
    const Wrapper = createWrapper(queryClient)

    const { result } = renderHook(
      () => useGetProjectLLMProviders({ projectName: 'proj' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 2000,
    })
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('useSetProjectLLMProviders debounces server writes', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useSetProjectLLMProviders(queryClient), {
      wrapper: Wrapper,
    })

    const variables = { projectName: 'proj', llmProviders: makeProviders() }

    const p1 = result.current.mutateAsync(variables)
    const p2 = result.current.mutateAsync(variables)

    // Not fired yet due to debounce
    expect(fetchSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)

    await expect(Promise.all([p1, p2])).resolves.toBeTruthy()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/UIUC-api/upsertLLMProviders',
      expect.objectContaining({ method: 'POST' }),
    )

    vi.useRealTimers()
  })

  it('useSetProjectLLMProviders rejects pending promises and invalidates on error', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response('nope', { status: 500 })),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['projectLLMProviders', 'proj'], makeProviders())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

    const Wrapper = createWrapper(queryClient)
    const { result } = renderHook(() => useSetProjectLLMProviders(queryClient), {
      wrapper: Wrapper,
    })

    const variables = { projectName: 'proj', llmProviders: makeProviders() }
    const p1 = result.current.mutateAsync(variables)
    const p2 = result.current.mutateAsync(variables)
    const pending = Promise.all([p1, p2])
    pending.catch(() => {})

    await vi.advanceTimersByTimeAsync(1000)

    await expect(pending).rejects.toThrow(/failed to set llm settings/i)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['projectLLMProviders', 'proj'],
      expect.anything(),
    )
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['projectLLMProviders', 'proj'],
    })

    vi.useRealTimers()
  })

  it('useSetProjectLLMProviders does not resolve promises from later mutations with an earlier in-flight request', async () => {
    vi.useFakeTimers()

    let resolveFirst: (r: Response) => void
    let resolveSecond: (r: Response) => void
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirst = resolve
    })
    const secondResponse = new Promise<Response>((resolve) => {
      resolveSecond = resolve
    })

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementationOnce(() => firstResponse)
      .mockImplementationOnce(() => secondResponse)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)
    const { result } = renderHook(() => useSetProjectLLMProviders(queryClient), {
      wrapper: Wrapper,
    })

    const variables1 = { projectName: 'proj', llmProviders: makeProviders() }
    const variables2 = { projectName: 'proj', llmProviders: makeProviders() }

    const p1 = result.current.mutateAsync(variables1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const p2 = result.current.mutateAsync(variables2)
    const settle2 = vi.fn()
    p2.then(settle2, settle2)

    await vi.advanceTimersByTimeAsync(1000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    resolveFirst!(
      new Response(JSON.stringify({ ok: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    await expect(p1).resolves.toEqual({ ok: 1 })
    await Promise.resolve()
    expect(settle2).not.toHaveBeenCalled()

    resolveSecond!(
      new Response(JSON.stringify({ ok: 2 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    await expect(p2).resolves.toEqual({ ok: 2 })

    vi.useRealTimers()
  })
})
