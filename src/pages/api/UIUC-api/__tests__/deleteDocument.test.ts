import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

import handler from '../deleteDocument'

describe('UIUC-api/deleteDocument', () => {
  it('validates method and required params', async () => {
    const res1 = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(405)

    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'DELETE', query: {} }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)

    const res3 = createMockRes()
    await handler(
      createMockReq({ method: 'DELETE', query: { course_name: 'CS101' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(400)
  })

  it('propagates backend status and returns 200 with data on success', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const res1 = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        query: { course_name: 'CS101', s3_path: 's3://x' },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(500)

    const res2 = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        query: { course_name: 'CS101', url: 'http://x' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)

    fetchSpy.mockRestore()
  })
})

