/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const select = vi.fn()
  const insert = vi.fn()
  const del = vi.fn()

  const messages = {
    id: { name: 'id' },
    created_at: { name: 'created_at' },
    conversation_id: { name: 'conversation_id' },
  }

  return { db: { select, insert, delete: del }, select, insert, del, messages }
})

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
  messages: hoisted.messages,
}))

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
  desc: () => ({}),
  gt: () => ({}),
  asc: () => ({}),
  and: () => ({}),
  inArray: () => ({}),
}))

vi.mock('@/pages/api/conversation', () => ({
  convertChatToDBMessage: (message: any, conversationId: string) => ({
    id: message.id,
    role: message.role,
    content_text: String(message.content ?? ''),
    conversation_id: conversationId,
    created_at: message.created_at ?? new Date('2024-01-01T00:00:00Z').toISOString(),
    updated_at: message.updated_at ?? undefined,
  }),
}))

import handler from '../upsert'

describe('messages/upsert API', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('sets created_at after latest message timestamp for new messages', async () => {
    // existingMessage query
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    }))
    // latestMessage query
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: vi.fn().mockResolvedValueOnce([
              { created_at: new Date('2024-01-01T00:00:00Z') },
            ]),
          }),
        }),
      }),
    }))

    const valuesSpy = vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValueOnce(undefined),
    })
    hoisted.insert.mockReturnValueOnce({ values: valuesSpy })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          message: { id: 'm1', role: 'user', content: 'hi' },
          conversationId: 'c1',
          user_email: 'u@example.com',
          course_name: 'CS101',
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const inserted = valuesSpy.mock.calls[0]?.[0]?.[0]
    expect(inserted.created_at.toISOString()).toBe('2024-01-01T00:00:01.000Z')
  })

  it('deletes following messages when editing an existing message', async () => {
    // existingMessage query
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValueOnce([
            { created_at: new Date('2024-01-01T00:00:00Z') },
          ]),
        }),
      }),
    }))
    // latestMessage query
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      }),
    }))

    const valuesSpy = vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValueOnce(undefined),
    })
    hoisted.insert.mockReturnValueOnce({ values: valuesSpy })

    // followingMessages query
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: vi.fn().mockResolvedValueOnce([{ id: 'm2' }, { id: 'm3' }]),
        }),
      }),
    }))

    hoisted.del.mockReturnValueOnce({
      where: vi.fn().mockResolvedValueOnce(undefined),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          message: { id: 'm1', role: 'user', content: 'edit' },
          conversationId: 'c1',
          user_email: 'u@example.com',
          course_name: 'CS101',
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.del).toHaveBeenCalled()
  })

  it('returns 500 when insert fails', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValueOnce([]) }) }),
    }))
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({ where: () => ({ orderBy: () => ({ limit: vi.fn().mockResolvedValueOnce([]) }) }) }),
    }))

    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockRejectedValueOnce(new Error('boom')),
      }),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { message: { id: 'm1', role: 'user', content: 'hi' }, conversationId: 'c1' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('uses null updated_at and Date(0) fallback when existing message has no created_at', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValueOnce([{}]),
        }),
      }),
    }))
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      }),
    }))

    const valuesSpy = vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValueOnce(undefined),
    })
    hoisted.insert.mockReturnValueOnce({ values: valuesSpy })

    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    }))

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          message: { id: 'm1', role: 'user', content: 'edit without updated_at' },
          conversationId: 'c1',
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const inserted = valuesSpy.mock.calls[0]?.[0]?.[0]
    expect(inserted.updated_at).toBeNull()
  })

  it('returns 500 when deleting following messages fails', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValueOnce([
            { created_at: new Date('2024-01-01T00:00:00Z') },
          ]),
        }),
      }),
    }))
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      }),
    }))

    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValueOnce(undefined),
      }),
    })

    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: vi.fn().mockResolvedValueOnce([{ id: 'm2' }]),
        }),
      }),
    }))

    hoisted.del.mockReturnValueOnce({
      where: vi.fn().mockRejectedValueOnce(new Error('deleteBoom')),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          message: { id: 'm1', role: 'user', content: 'edit' },
          conversationId: 'c1',
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('returns 500 when handler throws unexpectedly', async () => {
    hoisted.select.mockImplementationOnce(() => {
      throw new Error('boom')
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { message: { id: 'm1', role: 'user', content: 'hi' }, conversationId: 'c1' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
