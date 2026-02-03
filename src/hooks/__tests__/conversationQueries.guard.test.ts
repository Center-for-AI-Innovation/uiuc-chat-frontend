import { describe, expect, it, vi } from 'vitest'

describe('conversationQueries queryFn guards', () => {
  it('throws when useFetchConversationHistory queryFn is invoked with invalid courseName', async () => {
    vi.resetModules()

    const captured: { opts?: any } = {}

    vi.doMock('@tanstack/react-query', () => ({
      useInfiniteQuery: (opts: any) => {
        captured.opts = opts
        return { options: opts }
      },
      useQuery: (opts: any) => ({ options: opts }),
      useMutation: (opts: any) => ({ options: opts }),
    }))

    vi.doMock('~/utils/app/conversation', () => ({
      fetchConversationHistory: vi.fn(),
      fetchLastConversation: vi.fn(),
      saveConversationToServer: vi.fn(),
      deleteConversationFromServer: vi.fn(),
      deleteAllConversationsFromServer: vi.fn(),
    }))

    const { useFetchConversationHistory } = await import(
      '../conversationQueries'
    )

    useFetchConversationHistory(undefined, 'q', '')

    expect(() => captured.opts.queryFn({ pageParam: 0 })).toThrowError(
      'Invalid course name',
    )
  })
})
