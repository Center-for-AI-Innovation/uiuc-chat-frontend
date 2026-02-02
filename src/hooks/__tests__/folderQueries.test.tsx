import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useCreateFolder,
  useDeleteFolder,
  useFetchFolders,
  useUpdateFolder,
} from '../folderQueries'
import type { FolderWithConversation } from '~/types/folder'

vi.mock('~/utils/app/folders', () => ({
  fetchFolders: vi.fn(),
  saveFolderToServer: vi.fn(),
  deleteFolderFromServer: vi.fn(),
}))

const { fetchFolders, saveFolderToServer, deleteFolderFromServer } = await import(
  '~/utils/app/folders'
)

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const courseName = 'TEST101'
const userEmail = 'user@example.com'

function makeFolder(overrides: Partial<FolderWithConversation> = {}): FolderWithConversation {
  return {
    id: 'folder-1',
    name: 'Folder',
    type: 'chat',
    conversations: [],
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

describe('folderQueries hooks', () => {
  it('useFetchFolders does not run when user_email is falsy', async () => {
    ;(fetchFolders as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    renderHook(() => useFetchFolders('', courseName), { wrapper: Wrapper })
    await Promise.resolve()

    expect(fetchFolders).not.toHaveBeenCalled()
  })

  it('useFetchFolders calls fetchFolders when enabled', async () => {
    const folders = [makeFolder({ id: 'a' })]
    ;(fetchFolders as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(folders)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const { result } = renderHook(() => useFetchFolders(userEmail, courseName), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(folders)
    expect(fetchFolders).toHaveBeenCalledWith(courseName, userEmail)
  })

  it('useCreateFolder optimistically adds folder and rolls back on error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const existing = [makeFolder({ id: 'existing' })]
    queryClient.setQueryData(['folders', courseName], existing)

    const newFolder = makeFolder({ id: 'new' })
    const deferred = createDeferred()
    ;(saveFolderToServer as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      deferred.promise as any,
    )

    const { result } = renderHook(
      () => useCreateFolder(userEmail, queryClient, courseName),
      { wrapper: Wrapper },
    )

    const promise = result.current.mutateAsync(newFolder)
    await waitFor(() =>
      expect(queryClient.getQueryData(['folders', courseName])).toEqual([
        newFolder,
        ...existing,
      ]),
    )

    deferred.reject(new Error('fail'))
    await expect(promise).rejects.toThrow('fail')
    expect(queryClient.getQueryData(['folders', courseName])).toEqual(existing)
  })

  it('useUpdateFolder optimistically updates folder and rolls back on error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const folder = makeFolder({ id: 'a', name: 'Old' })
    queryClient.setQueryData(['folders', courseName], [folder])

    const updated = { ...folder, name: 'New' }
    const deferred = createDeferred()
    ;(saveFolderToServer as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      deferred.promise as any,
    )

    const { result } = renderHook(
      () => useUpdateFolder(userEmail, queryClient, courseName),
      { wrapper: Wrapper },
    )

    const promise = result.current.mutateAsync(updated)
    await waitFor(() =>
      expect(queryClient.getQueryData(['folders', courseName])).toEqual([updated]),
    )

    deferred.reject(new Error('fail'))
    await expect(promise).rejects.toThrow('fail')
    expect(queryClient.getQueryData(['folders', courseName])).toEqual([folder])
  })

  it('useDeleteFolder optimistically removes folder and rolls back on error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const Wrapper = createWrapper(queryClient)

    const folder = makeFolder({ id: 'a' })
    const other = makeFolder({ id: 'b' })
    queryClient.setQueryData(['folders', courseName], [folder, other])

    const deferred = createDeferred()
    ;(deleteFolderFromServer as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      deferred.promise as any,
    )

    const { result } = renderHook(
      () => useDeleteFolder(userEmail, queryClient, courseName),
      { wrapper: Wrapper },
    )

    const promise = result.current.mutateAsync(folder)
    await waitFor(() =>
      expect(queryClient.getQueryData(['folders', courseName])).toEqual([other]),
    )

    deferred.reject(new Error('fail'))
    await expect(promise).rejects.toThrow('fail')
    expect(queryClient.getQueryData(['folders', courseName])).toEqual([folder, other])
  })
})
