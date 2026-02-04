import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchAllCourseNames } from '../queries/useFetchAllCourseNames'
import { useFetchCourseExists } from '../queries/useFetchCourseExists'
import { useFetchCourseMetadata } from '../queries/useFetchCourseMetadata'
import { useFetchMaintenanceDetails } from '../queries/useFetchMaintenanceDetails'
import { useFetchMaintenanceMode } from '../queries/useFetchMaintenanceMode'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('course + maintenance query hooks', () => {
  it('useFetchCourseMetadata parses is_private when it is a string', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          course_metadata: { is_private: 'TrUe', course_name: 'CS101' },
        }),
        { status: 200 },
      ),
    )

    const { result } = renderHook(
      () => useFetchCourseMetadata({ courseName: 'CS101' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({ is_private: true })
  })

  it('useFetchCourseMetadata surfaces errors when response is non-ok', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response('nope', { status: 500, statusText: 'Nope' }),
      )
      .mockResolvedValueOnce(
        new Response('nope', { status: 500, statusText: 'Nope' }),
      )

    const { result } = renderHook(
      () => useFetchCourseMetadata({ courseName: 'CS101' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('useFetchCourseMetadata surfaces API-level errors when success=false', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, message: 'bad' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, message: 'bad' }), {
          status: 200,
        }),
      )

    const { result } = renderHook(
      () => useFetchCourseMetadata({ courseName: 'CS101' }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('useFetchCourseExists returns exists from API and does not run when courseName is empty', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ exists: true }), { status: 200 }),
      )

    const { result } = renderHook(
      () => useFetchCourseExists({ courseName: 'CS101' }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(true)

    renderHook(() => useFetchCourseExists({ courseName: '' as any }), {
      wrapper: Wrapper,
    })
    await Promise.resolve()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('useFetchMaintenanceMode and useFetchMaintenanceDetails fetch and return expected fields', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ isMaintenanceMode: false }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            isMaintenanceMode: true,
            maintenanceBodyText: 'body',
            maintenanceTitleText: 'title',
          }),
          { status: 200 },
        ),
      )

    const { result: mode } = renderHook(() => useFetchMaintenanceMode(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(mode.current.isSuccess).toBe(true))
    expect(mode.current.data).toBe(false)

    const { result: details } = renderHook(() => useFetchMaintenanceDetails(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(details.current.isSuccess).toBe(true))
    expect(details.current.data).toMatchObject({
      isMaintenanceMode: true,
      maintenanceBodyText: 'body',
      maintenanceTitleText: 'title',
    })
  })

  it('useFetchMaintenanceMode surfaces errors when response is non-ok', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    })
    const Wrapper = createWrapper(queryClient)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('no', { status: 500 }))
      .mockResolvedValueOnce(new Response('no', { status: 500 }))

    const { result } = renderHook(() => useFetchMaintenanceMode(), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('useFetchAllCourseNames returns array and respects enabled=false', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ all_course_names: ['CS101'] }), {
        status: 200,
      }),
    )

    const { result } = renderHook(() => useFetchAllCourseNames(), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['CS101'])

    renderHook(() => useFetchAllCourseNames({ enabled: false }), {
      wrapper: Wrapper,
    })
    await Promise.resolve()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
