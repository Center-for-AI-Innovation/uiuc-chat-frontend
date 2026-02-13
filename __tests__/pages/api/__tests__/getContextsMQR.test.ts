/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  axiosGet: vi.fn(),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('axios', () => ({
  default: { get: hoisted.axiosGet },
}))

import handler from '~/pages/api/getContextsMQR'

describe('getContextsMQR API', () => {
  it('returns 405 for non-GET methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when required query params are missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 500 when RAILWAY_MQR_URL is not set', async () => {
    const old = process.env.RAILWAY_MQR_URL
    delete process.env.RAILWAY_MQR_URL

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: {
          course_name: 'CS101',
          search_query: 'q',
          conversation_id: 'c1',
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)

    process.env.RAILWAY_MQR_URL = old
  })

  it('returns 200 with axios data', async () => {
    process.env.RAILWAY_MQR_URL = 'http://mqr'
    hoisted.axiosGet.mockResolvedValueOnce({ data: [{ id: 1 }] })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: {
          course_name: 'CS101',
          search_query: 'q',
          conversation_id: 'c1',
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }])
  })

  it('returns 500 when axios throws', async () => {
    process.env.RAILWAY_MQR_URL = 'http://mqr'
    hoisted.axiosGet.mockRejectedValueOnce(new Error('boom'))

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: {
          course_name: 'CS101',
          search_query: 'q',
          conversation_id: 'c1',
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
