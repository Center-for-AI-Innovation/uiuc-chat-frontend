/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const insert = vi.fn()
  const del = vi.fn()
  const findMany = vi.fn()

  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const selectLeftJoin = vi.fn(() => ({ leftJoin: selectFrom }))
  const select = vi.fn(() => ({ from: selectFrom }))
  const selectDistinct = vi.fn(() => ({ from: selectLeftJoin }))

  const folders = {
    id: { name: 'id' },
    user_email: { name: 'user_email' },
    created_at: { name: 'created_at' },
  }

  const messages = {
    id: { name: 'id' },
    conversation_id: { name: 'conversation_id' },
    created_at: { name: 'created_at' },
  }

  const conversations = {
    id: { name: 'id' },
    user_email: { name: 'user_email' },
    project_name: { name: 'project_name' },
    folder_id: { name: 'folder_id' },
  }

  const db = {
    insert,
    delete: del,
    select,
    selectDistinct,
    query: {
      folders: { findMany },
    },
  }

  return { db, folders, insert, del, findMany, messages, conversations }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
  desc: () => ({}),
  and: () => ({}),
  or: () => ({}),
  inArray: () => ({}),
  ilike: () => ({}),
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
  folders: hoisted.folders,
  conversations: hoisted.conversations,
  messages: hoisted.messages,
}))

vi.mock('~/pages/api/conversation', () => ({
  convertDBToChatConversation: vi.fn(() => ({ id: 'c1', messages: [] })),
}))

import handler from '~/pages/api/folder'

describe('folder API', () => {
  it('returns 400 when no user identifier is present', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('POST upserts folder and returns 200', async () => {
    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: { folder: { id: 'f1', name: 'Folder', type: 'chat' } },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('POST returns 500 when db insert fails', async () => {
    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockRejectedValue(new Error('boom')),
      }),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'u@example.com' },
        body: { folder: { id: 'f1', name: 'Folder', type: 'chat' } },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('GET returns folders', async () => {
    hoisted.findMany.mockResolvedValueOnce([
      {
        id: 'f1',
        name: 'Folder',
        type: 'chat',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
        conversations: [{ id: 'c1', messages: [] }],
      },
    ])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'u@example.com' },
        query: { courseName: 'TEST101' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const body = (res.json as any).mock.calls[0]?.[0]
    expect(body[0]).toMatchObject({ id: 'f1', name: 'Folder', type: 'chat' })
    const findManyArg = hoisted.findMany.mock.calls[0]?.[0]
    expect(
      findManyArg?.with?.conversations?.with?.messages?.columns
        ?.processed_content,
    ).toBe(true)
  })

  it('DELETE returns 400 when deletedFolderId is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: {},
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('DELETE returns 403 when folder does not belong to user', async () => {
    hoisted.del.mockReturnValueOnce({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { deletedFolderId: 'f1' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('DELETE returns 200 when folder is deleted', async () => {
    hoisted.del.mockReturnValueOnce({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'f1' }]),
      }),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { deletedFolderId: 'f1' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 405 for unsupported methods', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'PUT', user: { email: 'u@example.com' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })
})
