import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { InfiniteData } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useDeleteAllConversations } from '../queries/useDeleteAllConversations'
import { useDeleteConversation } from '../queries/useDeleteConversation'
import { useFetchConversationHistory } from '../queries/useFetchConversationHistory'
import { useFetchLastConversation } from '../queries/useFetchLastConversation'
import { useUpdateConversation } from '../queries/useUpdateConversation'
import type { Conversation, ConversationPage } from '~/types/chat'
import type { FolderWithConversation } from '~/types/folder'
import {
  deleteAllConversationsFromServer,
  deleteConversationFromServer,
  fetchConversationHistory,
  fetchLastConversation,
  saveConversationToServer,
} from '@/hooks/__internal__/conversation'

vi.mock('@/hooks/__internal__/conversation', () => ({
  fetchConversationHistory: vi.fn(),
  fetchLastConversation: vi.fn(),
  saveConversationToServer: vi.fn(),
  deleteConversationFromServer: vi.fn(),
  deleteAllConversationsFromServer: vi.fn(),
}))

function createDeferred<T = unknown>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function makeInfiniteConversationHistory(
  conversations: Conversation[],
): InfiniteData<ConversationPage> {
  return { pages: [{ conversations, nextCursor: null }], pageParams: [0] }
}

describe('useFetchConversationHistory', () => {
  it('does not run when courseName is invalid', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)
    ;(
      fetchConversationHistory as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      conversations: [],
      nextCursor: null,
    })

    renderHook(
      () => useFetchConversationHistory('user@example.com', 'q', undefined),
      { wrapper: Wrapper },
    )

    await Promise.resolve()
    expect(fetchConversationHistory).not.toHaveBeenCalled()
  })

  it('calls fetchConversationHistory with normalized search term and pageParam', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)
    ;(
      fetchConversationHistory as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      conversations: [],
      nextCursor: null,
    })

    const { result } = renderHook(
      () => useFetchConversationHistory('user@example.com', '', 'CS101'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchConversationHistory).toHaveBeenCalledWith(
      '',
      'CS101',
      0,
      'user@example.com',
    )
  })
})

describe('useFetchLastConversation', () => {
  it('does not run until courseName is truthy', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)

    renderHook(() => useFetchLastConversation(''), { wrapper: Wrapper })
    await Promise.resolve()
    expect(fetchLastConversation).not.toHaveBeenCalled()
  })

  it('fetches last conversation when enabled', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)
    ;(
      fetchLastConversation as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({ id: 'c1' } as any)

    const { result } = renderHook(
      () => useFetchLastConversation('CS101', 'u@example.com'),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchLastConversation).toHaveBeenCalledWith('CS101', 'u@example.com')
    expect(result.current.data).toMatchObject({ id: 'c1' })
  })
})

describe('useUpdateConversation', () => {
  it('optimistically updates conversation in conversation history and folders', async () => {
    const deferred = createDeferred()
    ;(
      saveConversationToServer as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValueOnce(deferred.promise as any)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)

    const courseName = 'CS101'
    const conversationHistoryKey = [
      'conversationHistory',
      courseName,
      '',
    ] as const
    const foldersKey = ['folders', courseName] as const

    const originalConversation: Conversation = {
      id: 'c1',
      name: 'Old',
      messages: [],
      model: { id: 'gpt-4o', name: 'm', enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: 'f1',
      userEmail: 'u@example.com',
    }
    const updatedConversation: Conversation = {
      ...originalConversation,
      name: 'New',
    }

    queryClient.setQueryData(
      conversationHistoryKey,
      makeInfiniteConversationHistory([originalConversation]),
    )
    const folders: FolderWithConversation[] = [
      {
        id: 'f1',
        name: 'Folder',
        type: 'chat',
        conversations: [originalConversation],
      } as any,
    ]
    queryClient.setQueryData(foldersKey, folders)

    const { result } = renderHook(
      () => useUpdateConversation('u@example.com', queryClient, courseName),
      { wrapper: Wrapper },
    )

    const mutatePromise = result.current.mutateAsync({
      conversation: updatedConversation,
      message: null,
    })

    await waitFor(() => {
      const data = queryClient.getQueryData<InfiniteData<ConversationPage>>(
        conversationHistoryKey,
      )
      expect(data?.pages[0]?.conversations[0]?.name).toBe('New')
    })
    await waitFor(() => {
      const f = queryClient.getQueryData<FolderWithConversation[]>(foldersKey)
      expect(f?.[0]?.conversations?.[0]?.name).toBe('New')
    })

    deferred.resolve({ ok: true })
    await expect(mutatePromise).resolves.toBeTruthy()
  })

  it('rolls back optimistic update when save fails', async () => {
    const deferred = createDeferred()
    ;(
      saveConversationToServer as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValueOnce(deferred.promise as any)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)

    const courseName = 'CS101'
    const conversationHistoryKey = [
      'conversationHistory',
      courseName,
      '',
    ] as const

    const originalConversation: Conversation = {
      id: 'c1',
      name: 'Old',
      messages: [],
      model: { id: 'gpt-4o', name: 'm', enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: null,
      userEmail: 'u@example.com',
    }
    const updatedConversation: Conversation = {
      ...originalConversation,
      name: 'New',
    }
    const originalHistory = makeInfiniteConversationHistory([
      originalConversation,
    ])
    queryClient.setQueryData(conversationHistoryKey, originalHistory)

    const { result } = renderHook(
      () => useUpdateConversation('u@example.com', queryClient, courseName),
      { wrapper: Wrapper },
    )

    const mutatePromise = result.current.mutateAsync({
      conversation: updatedConversation,
      message: null,
    })

    await waitFor(() => {
      const data = queryClient.getQueryData<InfiniteData<ConversationPage>>(
        conversationHistoryKey,
      )
      expect(data?.pages[0]?.conversations[0]?.name).toBe('New')
    })

    deferred.reject(new Error('boom'))
    await expect(mutatePromise).rejects.toThrow('boom')

    await waitFor(() => {
      const data = queryClient.getQueryData<InfiniteData<ConversationPage>>(
        conversationHistoryKey,
      )
      expect(data).toEqual(originalHistory)
    })
  })
})

describe('useDeleteConversation', () => {
  it('optimistically removes a conversation and rolls back on error', async () => {
    const deferred = createDeferred()
    ;(
      deleteConversationFromServer as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValueOnce(deferred.promise as any)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = createWrapper(queryClient)

    const courseName = 'CS101'
    const searchTerm = ''
    const conversationHistoryKey = [
      'conversationHistory',
      courseName,
      searchTerm,
    ] as const

    const keep: Conversation = {
      id: 'c-keep',
      name: 'Keep',
      messages: [],
      model: { id: 'gpt-4o', name: 'm', enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: null,
      userEmail: 'u@example.com',
    }
    const toDelete: Conversation = { ...keep, id: 'c-del', name: 'Delete' }
    const originalHistory = makeInfiniteConversationHistory([keep, toDelete])
    queryClient.setQueryData(conversationHistoryKey, originalHistory)

    const { result } = renderHook(
      () =>
        useDeleteConversation(
          'u@example.com',
          queryClient,
          courseName,
          searchTerm,
        ),
      { wrapper: Wrapper },
    )

    const mutatePromise = result.current.mutateAsync(toDelete)

    await waitFor(() => {
      const data = queryClient.getQueryData<InfiniteData<ConversationPage>>(
        conversationHistoryKey,
      )
      expect(data?.pages[0]?.conversations.map((c) => c.id)).toEqual(['c-keep'])
    })

    deferred.reject(new Error('nope'))
    await expect(mutatePromise).rejects.toThrow('nope')

    await waitFor(() => {
      const data = queryClient.getQueryData<InfiniteData<ConversationPage>>(
        conversationHistoryKey,
      )
      expect(data).toEqual(originalHistory)
    })
  })
})

describe('useDeleteAllConversations', () => {
  it('optimistically clears conversation history and invalidates after settle', async () => {
    const deferred = createDeferred()
    ;(
      deleteAllConversationsFromServer as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValueOnce(deferred.promise as any)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const Wrapper = createWrapper(queryClient)

    const courseName = 'CS101'
    const conversationHistoryKey = [
      'conversationHistory',
      courseName,
      '',
    ] as const

    const originalHistory = makeInfiniteConversationHistory([
      {
        id: 'c1',
        name: 'One',
        messages: [],
        model: { id: 'gpt-4o', name: 'm', enabled: true } as any,
        prompt: '',
        temperature: 0.5,
        folderId: null,
        userEmail: 'u@example.com',
      },
    ])
    queryClient.setQueryData(conversationHistoryKey, originalHistory)

    const { result } = renderHook(
      () => useDeleteAllConversations(queryClient, 'u@example.com', courseName),
      { wrapper: Wrapper },
    )

    const mutatePromise = result.current.mutateAsync()

    await waitFor(() => {
      const data = queryClient.getQueryData<InfiniteData<ConversationPage>>(
        conversationHistoryKey,
      )
      expect(data?.pages[0]?.conversations).toEqual([])
    })

    deferred.resolve({ ok: true })
    await expect(mutatePromise).resolves.toBeTruthy()

    await new Promise((r) => setTimeout(r, 350))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: conversationHistoryKey,
    })
  })
})
