import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

import handler from '~/pages/api/UIUC-api/ingest'

describe('UIUC-api/ingest', () => {
  it('returns 405 for non-POST', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when body params are missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { courseName: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('submits to ingest and returns response body', async () => {
    process.env.INGEST_URL = 'http://ingest/ingest'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ task_id: 't1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          uniqueFileName: 'u',
          courseName: 'CS101',
          readableFilename: 'r.pdf',
          forceEmbeddings: true,
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(fetchSpy).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
