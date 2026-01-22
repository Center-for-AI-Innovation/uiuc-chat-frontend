import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useAppendToDocGroup,
  useCreateDocumentGroup,
  useFetchEnabledDocGroups,
  useGetDocumentGroups,
  useRemoveFromDocGroup,
  useUpdateDocGroup,
} from '../docGroupsQueries'
import type { CourseDocument, DocumentGroup } from '~/types/courseMaterials'

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({ user: { profile: { sub: 'user-123' } } }),
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const courseName = 'TEST101'

function makeDoc(overrides: Partial<CourseDocument> = {}): CourseDocument {
  return {
    id: 'd1',
    course_name: courseName,
    readable_filename: 'Doc',
    url: 'https://example.com/doc',
    s3_path: '',
    created_at: new Date().toISOString(),
    base_url: 'https://example.com',
    doc_groups: [],
    error: '',
    ...overrides,
  }
}

function createDeferred<T = unknown>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('docGroupsQueries hooks', () => {
  it('useGetDocumentGroups fetches and returns document groups', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [{ name: 'g1', enabled: true, course_name: courseName, doc_count: 0 }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useGetDocumentGroups(courseName), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { name: 'g1', enabled: true, course_name: courseName, doc_count: 0 },
    ])
  })

  it('useFetchEnabledDocGroups calls fetchEnabledDocGroups action', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [{ name: 'g1', enabled: true, course_name: courseName, doc_count: 0 }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useFetchEnabledDocGroups(courseName), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { name: 'g1', enabled: true, course_name: courseName, doc_count: 0 },
    ])

    const [, options] = fetchSpy.mock.calls[0] as any
    expect(JSON.parse(options.body)).toMatchObject({
      action: 'fetchEnabledDocGroups',
      courseName: courseName,
      userId: 'user-123',
    })
  })

  it('useCreateDocumentGroup optimistically adds group and updates documents', async () => {
    const deferred = createDeferred<Response>()
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(deferred.promise as any)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const page = 0
    const record = makeDoc({ url: 'https://example.com/a' })
    const groups: DocumentGroup[] = [
      { name: 'g1', enabled: true, course_name: courseName, doc_count: 0 },
    ]
    const docsState = { final_docs: [record], total_count: 1 }
    queryClient.setQueryData(['documentGroups', courseName], groups)
    queryClient.setQueryData(['documents', courseName, page], docsState)

    const { result } = renderHook(
      () => useCreateDocumentGroup(courseName, queryClient, page),
      { wrapper: Wrapper },
    )

    const promise = result.current.mutateAsync({ doc_group_name: 'g2' })

    await waitFor(() =>
      expect(queryClient.getQueryData(['documentGroups', courseName])).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'g1' }),
          expect.objectContaining({ name: 'g2', enabled: true }),
        ]),
      ),
    )
    await waitFor(() =>
      expect(queryClient.getQueryData(['documents', courseName, page])).toEqual({
        final_docs: [{ ...record, doc_groups: ['g2'] }],
        total_count: 1,
      }),
    )

    deferred.resolve(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    await expect(promise).resolves.toBeTruthy()
  })

  it('useCreateDocumentGroup rolls back on error response', async () => {
    const deferred = createDeferred<Response>()
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(deferred.promise as any)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const page = 0
    const record = makeDoc({ url: 'https://example.com/a' })
    const groups: DocumentGroup[] = [
      { name: 'g1', enabled: true, course_name: courseName, doc_count: 0 },
    ]
    const docsState = { final_docs: [record], total_count: 1 }
    queryClient.setQueryData(['documentGroups', courseName], groups)
    queryClient.setQueryData(['documents', courseName, page], docsState)

    const { result } = renderHook(
      () => useCreateDocumentGroup(courseName, queryClient, page),
      { wrapper: Wrapper },
    )

    const promise = result.current.mutateAsync({ doc_group_name: 'g2' })

    // Optimistic update happens first
    await waitFor(() =>
      expect(queryClient.getQueryData(['documentGroups', courseName])).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'g2' })]),
      ),
    )

    deferred.resolve(new Response('nope', { status: 500 }))
    await expect(promise).rejects.toThrow('Failed to create document group')

    await waitFor(() =>
      expect(queryClient.getQueryData(['documentGroups', courseName])).toEqual(
        groups,
      ),
    )
    await waitFor(() =>
      expect(queryClient.getQueryData(['documents', courseName, page])).toEqual(
        docsState,
      ),
    )
  })

  it('useAppendToDocGroup optimistically updates doc_count and document doc_groups', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const page = 0
    const record = makeDoc({ url: 'https://example.com/a' })
    const groups: DocumentGroup[] = [
      { name: 'g1', enabled: true, course_name: courseName, doc_count: 0 },
    ]
    queryClient.setQueryData(['documentGroups', courseName], groups)
    queryClient.setQueryData(['documents', courseName, page], {
      final_docs: [record],
      total_count: 1,
    })

    const { result } = renderHook(
      () => useAppendToDocGroup(courseName, queryClient, page),
      { wrapper: Wrapper },
    )

    const promise = result.current.mutateAsync({ record, appendedGroup: 'g1' })

    // Optimistic updates
    await waitFor(() =>
      expect(queryClient.getQueryData(['documentGroups', courseName])).toEqual([
        { ...groups[0]!, doc_count: 1 },
      ]),
    )
    await waitFor(() =>
      expect(queryClient.getQueryData(['documents', courseName, page])).toEqual({
        final_docs: [{ ...record, doc_groups: ['g1'] }],
        total_count: 1,
      }),
    )

    await expect(promise).resolves.toBeTruthy()
  })

  it('useUpdateDocGroup toggles enabled optimistically and rolls back on error', async () => {
    const deferred = createDeferred<Response>()
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(deferred.promise as any)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const groups: DocumentGroup[] = [
      { name: 'g1', enabled: true, course_name: courseName, doc_count: 0 },
    ]
    queryClient.setQueryData(['documentGroups', courseName], groups)

    const { result } = renderHook(
      () => useUpdateDocGroup(courseName, queryClient),
      { wrapper: Wrapper },
    )

    const promise = result.current.mutateAsync({
      doc_group_obj: groups[0]!,
      enabled: false,
    })

    await waitFor(() =>
      expect(queryClient.getQueryData(['documentGroups', courseName])).toEqual([
        { ...groups[0]!, enabled: false },
      ]),
    )

    deferred.resolve(new Response('nope', { status: 500 }))
    await expect(promise).rejects.toThrow('Failed to update document group status')

    await waitFor(() =>
      expect(queryClient.getQueryData(['documentGroups', courseName])).toEqual(
        groups,
      ),
    )
  })

  it('useRemoveFromDocGroup rolls back on error', async () => {
    const deferred = createDeferred<Response>()
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(deferred.promise as any)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const page = 0
    const record = makeDoc({ url: 'https://example.com/a', doc_groups: ['g1'] })
    const groups: DocumentGroup[] = [
      { name: 'g1', enabled: true, course_name: courseName, doc_count: 1 },
    ]
    const docsState = {
      final_docs: [record],
      total_count: 1,
    }
    queryClient.setQueryData(['documentGroups', courseName], groups)
    queryClient.setQueryData(['documents', courseName, page], docsState)

    const { result } = renderHook(
      () => useRemoveFromDocGroup(courseName, queryClient, page),
      { wrapper: Wrapper },
    )

    const promise = result.current.mutateAsync({ record, removedGroup: 'g1' })

    // Optimistic update: removed group + decremented count
    await waitFor(() =>
      expect(queryClient.getQueryData(['documentGroups', courseName])).toEqual([
        { ...groups[0]!, doc_count: 0 },
      ]),
    )
    await waitFor(() =>
      expect(queryClient.getQueryData(['documents', courseName, page])).toEqual({
        final_docs: [{ ...record, doc_groups: [] }],
        total_count: 1,
      }),
    )

    deferred.resolve(new Response('nope', { status: 500 }))
    await expect(promise).rejects.toThrow('Failed to remove document group')

    // Rollback restores original
    await waitFor(() =>
      expect(queryClient.getQueryData(['documentGroups', courseName])).toEqual(
        groups,
      ),
    )
    await waitFor(() =>
      expect(queryClient.getQueryData(['documents', courseName, page])).toEqual(
        docsState,
      ),
    )
  })
})
