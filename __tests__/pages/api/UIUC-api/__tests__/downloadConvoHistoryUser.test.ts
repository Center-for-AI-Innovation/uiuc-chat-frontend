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
      'content-disposition': 'attachment; filename="x.zip"',
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

  it('returns 400 when projectName is not a string', async () => {
    const res = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: ['CS101'] },
        user: { email: 'a@b.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
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

  it('propagates backend non-ok status codes', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'content-type': 'application/json' },
      }),
    )

    const res = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: 'CS101' },
        user: { email: 'a@b.com' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Backend error'),
      }),
    )
    fetchSpy.mockRestore()
  })

  it('returns 500 when backend response has no body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, {
        status: 200,
        headers: { 'content-type': 'application/zip' },
      }),
    )

    const res = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: 'CS101' },
        user: { email: 'a@b.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'No response body received' }),
    )
    fetchSpy.mockRestore()
  })

  it('returns 504 on TimeoutError and 408 on AbortError', async () => {
    const timeoutErr = Object.assign(new Error('took too long'), {
      name: 'TimeoutError',
    })
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' })

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(timeoutErr)
      .mockRejectedValueOnce(abortErr)

    const res1 = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: 'CS101' },
        user: { email: 'a@b.com' },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(504)

    const res2 = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: 'CS101' },
        user: { email: 'a@b.com' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(408)

    fetchSpy.mockRestore()
  })

  it('returns 500 on generic errors', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('boom'))

    const res = createWritableRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { projectName: 'CS101' },
        user: { email: 'a@b.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal server error while exporting documents',
      }),
    )
    fetchSpy.mockRestore()
  })
})
