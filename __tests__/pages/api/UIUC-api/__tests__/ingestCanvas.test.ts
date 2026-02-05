import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

import handler from '~/pages/api/UIUC-api/ingestCanvas'

describe('UIUC-api/ingestCanvas', () => {
  it('returns 405 for non-POST', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when required body params are missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { courseName: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('sends email, calls canvas ingest, and returns backend status', async () => {
    process.env.INGEST_URL = 'http://ingest/ingest'

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('email', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ task_id: 't1' }), {
          status: 202,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          courseName: 'CS101',
          canvas_url: 'http://canvas',
          selectedCanvasOptions: ['files', 'pages'],
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(202)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    fetchSpy.mockRestore()
  })
})
