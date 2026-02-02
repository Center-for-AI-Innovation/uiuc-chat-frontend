/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  uuid: vi.fn(() => 'file-upload-id'),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (handler: any) => handler,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

vi.mock('uuid', () => ({
  v4: hoisted.uuid,
}))

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
}))

vi.mock('~/db/dbClient', () => ({
  db: {
    select: hoisted.select,
    insert: hoisted.insert,
    update: hoisted.update,
  },
  conversations: {
    id: { name: 'id' },
    user_email: { name: 'user_email' },
  },
  fileUploads: {
    id: { name: 'id' },
  },
}))

import handler from '~/pages/api/UIUC-api/chat-file-upload'

describe('UIUC-api chat-file-upload', () => {
  beforeEach(() => {
    hoisted.select.mockReset()
    hoisted.insert.mockReset()
    hoisted.update.mockReset()
    hoisted.uuid.mockClear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 405 for non-POST', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when required params are missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { courseName: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 500 when creating a missing conversation fails', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValueOnce([]),
        }),
      }),
    }))

    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockRejectedValueOnce(new Error('convFail')),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          conversationId: 'c1',
          courseName: 'CS101',
          user_id: 'u@example.com',
          s3Key: 'courses/CS101/file.txt',
          fileName: 'file.txt',
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create conversation' })
  })

  it('returns 500 when backend processing is not ok', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValueOnce([{ id: 'c1', user_email: 'u@example.com' }]),
        }),
      }),
    }))

    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockResolvedValueOnce(undefined),
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: 'boom',
        text: vi.fn(async () => 'error body'),
      })) as any,
    )

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          conversationId: 'c1',
          courseName: 'CS101',
          user_id: 'u@example.com',
          s3Key: 'courses/CS101/file.txt',
          fileName: 'file.txt',
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('returns 200 on success even if updating upload status fails', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValueOnce([{ id: 'c1', user_email: 'u@example.com' }]),
        }),
      }),
    }))

    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockResolvedValueOnce(undefined),
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: vi.fn(async () => ({ chunks_created: 2 })),
      })) as any,
    )

    hoisted.update.mockReturnValueOnce({
      set: () => ({
        where: vi.fn().mockRejectedValueOnce(new Error('updateFail')),
      }),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          conversationId: 'c1',
          courseName: 'CS101',
          user_id: 'u@example.com',
          s3Key: 'courses/CS101/file.txt',
          fileName: 'file.txt',
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        fileUploadId: 'file-upload-id',
        chunks_created: 2,
      }),
    )
  })
})

