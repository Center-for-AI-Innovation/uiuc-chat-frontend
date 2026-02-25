import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateProjectMutation } from '../queries/useCreateProject'
import { useFetchAllCourseData } from '../queries/useFetchAllCourseData'
import { useFetchProjectDocumentCount } from '../queries/useFetchProjectDocumentCount'
import { useNewsletterUnsubscribe } from '../queries/useNewsletterUnsubscribe'
import { useQueryRewrite } from '../queries/useQueryRewrite'

const createProjectSpy = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/__internal__/createProject', () => ({
  createProject: createProjectSpy,
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('additional query/mutation hooks', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    createProjectSpy.mockReset()
  })

  it('useFetchAllCourseData returns data and reports errors for non-ok responses', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ distinct_files: [{ id: '1', name: 'notes.pdf' }] }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))

    const { result: ok } = renderHook(
      () => useFetchAllCourseData({ courseName: 'CS101' }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(ok.current.isSuccess).toBe(true))
    expect(ok.current.data).toEqual({
      distinct_files: [{ id: '1', name: 'notes.pdf' }],
    })

    const { result: err } = renderHook(
      () => useFetchAllCourseData({ courseName: 'CS102' }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(err.current.isError).toBe(true))
  })

  it('useFetchProjectDocumentCount returns total_count and defaults to zero', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ total_count: 42 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({})))

    const { result: hasCount } = renderHook(
      () => useFetchProjectDocumentCount('CS101'),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(hasCount.current.isSuccess).toBe(true))
    expect(hasCount.current.data).toBe(42)

    const { result: noCount } = renderHook(
      () => useFetchProjectDocumentCount('CS102'),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(noCount.current.isSuccess).toBe(true))
    expect(noCount.current.data).toBe(0)
  })

  it('useNewsletterUnsubscribe handles success and failure responses', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response('bad', { status: 500 }))

    const { result } = renderHook(() => useNewsletterUnsubscribe(), {
      wrapper: Wrapper,
    })

    await expect(
      result.current.mutateAsync({ email: 'a@example.com' }),
    ).resolves.toEqual({ ok: true })
    await expect(
      result.current.mutateAsync({ email: 'b@example.com' }),
    ).rejects.toThrow('Network response was not ok')
  })

  it('useCreateProjectMutation forwards params and invalidates related queries', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const Wrapper = createWrapper(queryClient)

    createProjectSpy.mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => useCreateProjectMutation(), {
      wrapper: Wrapper,
    })

    await result.current.mutateAsync({
      project_name: 'CS105',
      project_description: undefined,
      project_owner_email: 'owner@example.com',
    })

    expect(createProjectSpy).toHaveBeenCalledWith(
      'CS105',
      undefined,
      'owner@example.com',
      false,
    )
    expect(invalidateSpy).toHaveBeenCalledTimes(2)
  })

  it('useQueryRewrite surfaces API errors and preserves server-provided title/message', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: 'rewrite failed', title: 'Bad Rewrite' }),
          { status: 500 },
        ),
      )
      .mockResolvedValueOnce(new Response('not-json', { status: 500 }))

    const { result } = renderHook(() => useQueryRewrite(), { wrapper: Wrapper })

    await expect(
      result.current.mutateAsync({
        model: {} as any,
        messages: [],
        key: '',
        prompt: '',
        temperature: 0,
      } as any),
    ).resolves.toBeInstanceOf(Response)

    await expect(
      result.current.mutateAsync({
        model: {} as any,
        messages: [],
        key: '',
        prompt: '',
        temperature: 0,
      } as any),
    ).rejects.toMatchObject({
      message: 'rewrite failed',
      title: 'Bad Rewrite',
    })

    await expect(
      result.current.mutateAsync({
        model: {} as any,
        messages: [],
        key: '',
        prompt: '',
        temperature: 0,
      } as any),
    ).rejects.toMatchObject({
      message: 'Failed to run query rewrite. Please try again.',
      title: 'Query Rewrite Error',
    })
  })
})
