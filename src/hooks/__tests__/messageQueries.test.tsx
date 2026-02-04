import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { useDeleteMessages } from '../messageQueries'
import type { Message } from '~/types/chat'

vi.mock('~/utils/app/message', () => ({
  deleteMessagesFromServer: vi.fn(),
}))

const { deleteMessagesFromServer } = await import('~/utils/app/message')

describe('useDeleteMessages', () => {
  it('maps deletedMessages to messageIds', async () => {
    ;(
      deleteMessagesFromServer as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(undefined)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () => useDeleteMessages('user@example.com', 'CS101'),
      {
        wrapper: Wrapper,
      },
    )

    const deletedMessages: Message[] = [
      { id: 'm1', role: 'user', content: 'a' },
      { id: 'm2', role: 'assistant', content: 'b' },
    ]

    await result.current.mutateAsync({ convoId: 'c1', deletedMessages })

    expect(deleteMessagesFromServer).toHaveBeenCalledWith(
      ['m1', 'm2'],
      'CS101',
      'user@example.com',
    )
  })
})
