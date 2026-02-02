import { describe, expect, it, vi } from 'vitest'
import { createMockReq } from '~/test-utils/nextApi'

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

import handler from '~/pages/api/UIUC-api/downloadConvoHistoryUser'

function createStreamingResponse() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('a'))
      controller.enqueue(encoder.encode('b'))
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': 'attachment; filename=\"x.zip\"',
    },
  })
}

function createWritableRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.setHeader = vi.fn().mockReturnValue(res)
  res.write = vi.fn().mockReturnValue(res)
  res.end = vi.fn().mockReturnValue(res)
  return res
}

describe('UIUC-api/downloadConvoHistoryUser', () => {
  it('validates method and inputs', async () => {
    const res1 = createWritableRes()
    await handler(createMockReq({ method: 'POST' }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(405)

    const res2 = createWritableRes()
    await handler(
      createMockReq({ method: 'GET', query: { projectName: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)

    const res3 = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: 'CS101' },
        user: { email: 'not-an-email' },
      }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(400)

    const res4 = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: '!!!' },
        user: { email: 'a@b.com' },
      }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(400)
  })

  it('streams backend response to res on success', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(createStreamingResponse())

    const res = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: 'CS101' },
        user: { email: 'a@b.com' },
      }) as any,
      res as any,
    )
    expect(res.setHeader).toHaveBeenCalled()
    expect(res.write).toHaveBeenCalled()
    expect(res.end).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

