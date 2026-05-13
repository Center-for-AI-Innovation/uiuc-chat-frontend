import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { useFetchUserLastAccess } from '../queries/useFetchUserLastAccess'
import { useFetchMaintainerProfiles } from '../queries/useFetchMaintainerProfiles'
import { useFetchDocumentSummary } from '../queries/useFetchDocumentSummary'
import { useSearchChatbots } from '../queries/useSearchChatbots'
import { useFetchAllCourseMetadata } from '../queries/useFetchAllCourseMetadata'

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

function createWrapper() {
  // Several of the hooks under test hard-code `retry: 1`. Hook-level options
  // override the global retry setting, but they don't touch retryDelay, so
  // setting it to 0 here keeps the (re)tries instantaneous in the test.
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, Wrapper }
}

describe('useFetchUserLastAccess', () => {
  it('returns last_accessed_at from the API and is disabled when courseName is empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ last_accessed_at: '2026-01-01T00:00:00Z' }),
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result, rerender } = renderHook(
      ({ courseName }) => useFetchUserLastAccess({ courseName }),
      { wrapper: Wrapper, initialProps: { courseName: '' } },
    )
    expect(result.current.fetchStatus).toBe('idle')

    rerender({ courseName: 'CS101' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe('2026-01-01T00:00:00Z')
    const url = (globalThis.fetch as any).mock.calls[0][0] as string
    expect(url).toContain('/api/UIUC-api/getUserLastAccess')
    expect(url).toContain('course_name=CS101')
  })

  it('throws when the response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'kaboom',
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useFetchUserLastAccess({ courseName: 'CS101' }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(String(result.current.error)).toMatch(/user last access/)
  })
})

describe('useFetchMaintainerProfiles', () => {
  it('returns profiles[] on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        profiles: [{ email: 'a@example.com', display_name: 'A' }],
      }),
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFetchMaintainerProfiles('CS101'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { email: 'a@example.com', display_name: 'A' },
    ])
  })

  it('throws on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFetchMaintainerProfiles('CS101'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(String(result.current.error)).toMatch(/maintainer profiles/)
  })

  it('throws when success=false', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'nope', profiles: [] }),
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFetchMaintainerProfiles('CS101'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useFetchDocumentSummary', () => {
  it('returns documentSummary on success', async () => {
    const summary = { total_file_count: 3, total_size_bytes: 9, by_type: [] }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, documentSummary: summary }),
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFetchDocumentSummary('CS101'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(summary)
  })

  it('throws on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFetchDocumentSummary('CS101'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(String(result.current.error)).toMatch(/document summary/)
  })

  it('throws when success=false', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'no doc' }),
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFetchDocumentSummary('CS101'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useSearchChatbots', () => {
  it('passes filter params as URL query string and returns results', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ course_name: 'cs1' }], total: 1 }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useSearchChatbots({
          q: 'grain',
          category: 'Course',
          privacy: 'public',
          my_bots: true,
        }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBe(1)

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('q=grain')
    expect(url).toContain('category=Course')
    expect(url).toContain('privacy=public')
    expect(url).toContain('my_bots=true')
  })

  it('throws on non-ok responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSearchChatbots({ q: 'x' }), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(String(result.current.error)).toMatch(/Search failed/)
  })
})

describe('useFetchAllCourseMetadata', () => {
  it('flattens the per-course payload into {course_name, metadata}', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          CS101: {
            course_owner: 'owner@example.com',
            course_admins: [],
            is_private: false,
          },
        },
        {
          CS102: {
            course_owner: 'owner@example.com',
            course_admins: [],
            // Coerces string booleans coming back from Redis.
            is_private: 'true',
          },
        },
      ],
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFetchAllCourseMetadata(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0]?.course_name).toBe('CS101')
    expect(result.current.data?.[0]?.metadata.is_private).toBe(false)
    expect(result.current.data?.[1]?.metadata.is_private).toBe(true)
  })

  it('throws on non-ok responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
    }) as unknown as typeof fetch

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFetchAllCourseMetadata(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
