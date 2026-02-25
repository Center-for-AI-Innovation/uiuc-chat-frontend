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

  it('handles non-S3 JSON response and unexpected content type', async () => {
    hoisted.axiosGet.mockResolvedValueOnce({
      headers: { 'content-type': 'application/json' },
      data: Buffer.from(JSON.stringify({ response: 'Ready now' })),
    })
    const res1 = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS102' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)
    expect(res1.json).toHaveBeenCalledWith({
      message: 'Your conversation history is ready for download.',
    })

    hoisted.axiosGet.mockResolvedValueOnce({
      headers: { 'content-type': 'text/plain' },
      data: Buffer.from('plain'),
    })
    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS103' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(500)
    expect(res2.json).toHaveBeenCalledWith({
      message: 'Unexpected response format from backend: text/plain',
    })
  })

  it('returns 500 when axios throws', async () => {
    hoisted.axiosGet.mockRejectedValueOnce(new Error('network fail'))
    const res = createMockRes()

    await handler(
      createMockReq({ method: 'GET', query: { course_name: 'CS104' } }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error exporting conversation history.',
    })
  })
})
