import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/app/clean', () => ({
  cleanConversationHistory: vi.fn(() => ({
    conversations: [],
    nextCursor: null,
  })),
}))

vi.mock('~/utils/httpHeaders', () => ({
  createHeaders: vi.fn(() => ({})),
}))

import {
  fetchConversationHistory,
  logConversationToServer,
} from '@/hooks/__internal__/conversation'
import type { Conversation } from '~/types/chat'

const makeConversation = (
  overrides: Partial<Conversation> = {},
): Conversation => ({
  id: 'conv-1',
  name: 'Test Conversation',
  messages: [],
  model: { id: 'gpt-4o-mini', name: 'GPT-4o mini' } as Conversation['model'],
  prompt: '',
  temperature: 0.3,
  folderId: null,
  ...overrides,
})

describe('hooks/__internal__/conversation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

describe('logConversationToServer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends conversation to the server and returns parsed JSON', async () => {
    const responseBody = { success: true }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => responseBody,
      })),
    )

    const conversation = makeConversation()
    const result = await logConversationToServer(conversation, 'CS101')

    expect(result).toEqual(responseBody)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/UIUC-api/logConversation',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_name: 'CS101',
          conversation,
        }),
      }),
    )
  })

  it('throws when the server returns a non-ok response with error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid conversation format' }),
      })),
    )

    const conversation = makeConversation()
    await expect(
      logConversationToServer(conversation, 'CS101'),
    ).rejects.toThrow('Error logging conversation: Invalid conversation format')
  })

  it('throws with statusText when json parse fails on error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('not json')
        },
      })),
    )

    const conversation = makeConversation()
    await expect(
      logConversationToServer(conversation, 'CS101'),
    ).rejects.toThrow('Error logging conversation: Internal Server Error')
  })

  it('returns null when ok response body is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => {
          throw new Error('not json')
        },
      })),
    )

    const conversation = makeConversation()
    const result = await logConversationToServer(conversation, 'CS101')

    expect(result).toBeNull()
  })
})
