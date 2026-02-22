import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  return { axiosGet: vi.fn() }
})

vi.mock('axios', () => ({
  default: { get: hoisted.axiosGet },
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

import handler from '~/pages/api/UIUC-api/downloadConvoHistory'

describe('UIUC-api/downloadConvoHistory', () => {
  it('validates method and course_name', async () => {
    const res1 = createMockRes()
    await handler(createMockReq({ method: 'POST' }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(405)

    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: {} }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)
  })

  it('handles JSON and ZIP responses', async () => {
    hoisted.axiosGet.mockResolvedValueOnce({
      headers: { 'content-type': 'application/json' },
      data: Buffer.from(JSON.stringify({ response: 'Download from S3' })),
    })
    const res1 = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)

    hoisted.axiosGet.mockResolvedValueOnce({
      headers: { 'content-type': 'application/zip' },
      data: Buffer.from('zip'),
    })
    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.send).toHaveBeenCalled()
  })

  it('handles JSON response that is not the S3 download case', async () => {
    hoisted.axiosGet.mockResolvedValueOnce({
      headers: { 'content-type': 'application/json' },
      data: Buffer.from(JSON.stringify({ response: 'Not S3' })),
    })
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Your conversation history is ready for download.',
      }),
    )
  })

  it('handles unexpected content types from the backend', async () => {
    hoisted.axiosGet.mockResolvedValueOnce({
      headers: { 'content-type': 'text/plain' },
      data: Buffer.from('nope'),
    })
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Unexpected response format'),
      }),
    )
  })

  it('returns 500 when axios throws', async () => {
    hoisted.axiosGet.mockRejectedValueOnce(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error exporting conversation history.',
      }),
    )
  })
})
