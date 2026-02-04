/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const returning = vi.fn()
  const where = vi.fn(() => ({ returning }))
  const del = vi.fn(() => ({ where }))

  const messages = {
    id: { name: 'id' },
    conversation_id: { name: 'conversation_id' },
  }
  const conversations = {
    id: { name: 'id' },
    user_email: { name: 'user_email' },
  }

  return { db: { delete: del }, messages, conversations, returning, del, where }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
  messages: hoisted.messages,
  conversations: hoisted.conversations,
}))

vi.mock('drizzle-orm', () => ({
  and: () => ({}),
  inArray: () => ({}),
  sql: () => ({}),
}))

import handler from '~/pages/api/deleteMessages'

describe('deleteMessages API', () => {
  it('returns 405 for non-DELETE methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when messageIds are missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { messageIds: [], course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when course_name is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { messageIds: ['m1'] },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when user identifier is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        body: { messageIds: ['m1'], course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 403 when nothing is deleted', async () => {
    hoisted.returning.mockResolvedValueOnce([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { messageIds: ['m1'], course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 200 when messages are deleted', async () => {
    hoisted.returning.mockResolvedValueOnce([{ id: 'm1' }])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { messageIds: ['m1'], course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 500 when db throws', async () => {
    hoisted.where.mockImplementationOnce(() => {
      throw new Error('boom')
    })
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        user: { email: 'u@example.com' },
        body: { messageIds: ['m1'], course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
