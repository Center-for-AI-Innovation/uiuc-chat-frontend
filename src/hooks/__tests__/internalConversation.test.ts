import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/app/clean', () => ({
  cleanConversationHistory: vi.fn(() => ({
    conversations: [],
    nextCursor: null,
  })),
}))

vi.mock('~/utils/httpHeaders', () => ({
  createHeaders: vi.fn(() => ({})),
}))

import { fetchConversationHistory } from '@/hooks/__internal__/conversation'

describe('hooks/__internal__/conversation', () => {
  it('parses nextCursor from string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ conversations: [], nextCursor: '2' }),
      })),
    )

    const res = await fetchConversationHistory('', '', 0)
    expect(res.nextCursor).toBe(2)
  })

  it('coerces invalid nextCursor to null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ conversations: [], nextCursor: {} }),
      })),
    )

    const res = await fetchConversationHistory('', '', 0)
    expect(res.nextCursor).toBeNull()
  })
})
