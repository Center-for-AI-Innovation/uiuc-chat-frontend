/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (fn: any) => fn,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

import handler, { runN8nFlowBackend } from '~/pages/api/UIUC-api/runN8nFlow'

describe('UIUC-api runN8nFlow', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('runN8nFlowBackend returns JSON response on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn(async () => ({ ok: true })),
      })) as any,
    )

    await expect(runN8nFlowBackend('k', 'n', { a: 1 })).resolves.toEqual({ ok: true })
  })

  it('runN8nFlowBackend throws an error message from JSON payload when not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn(async () => ({ error: 'bad' })),
        text: vi.fn(async () => '<html/>'),
      })) as any,
    )

    await expect(runN8nFlowBackend('k', 'n', { a: 1 })).rejects.toThrow('bad')
  })

  it('runN8nFlowBackend throws an HTML-specific error when content-type is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers({ 'content-type': 'text/html' }),
        json: vi.fn(async () => ({})),
        text: vi.fn(async () => '<html>oops</html>'),
      })) as any,
    )

    await expect(runN8nFlowBackend('k', 'n', { a: 1 })).rejects.toThrow('HTML')
  })

  it('runN8nFlowBackend throws a timeout hint on AbortError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const error: any = new Error('aborted')
        error.name = 'AbortError'
        throw error
      }) as any,
    )

    await expect(runN8nFlowBackend('k', 'n', { a: 1 })).rejects.toThrow('timed out')
  })

  it('handler returns 405/400/200/408/500 for various cases', async () => {
    const res0 = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res0 as any)
    expect(res0.status).toHaveBeenCalledWith(405)

    const res1 = createMockRes()
    await handler(createMockReq({ method: 'POST', body: {} }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(400)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn(async () => ({ result: true })),
      })) as any,
    )
    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { api_key: 'k', name: 'n', data: { a: 1 } } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith({ result: true })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const error: any = new Error('timed out')
        error.name = 'AbortError'
        throw error
      }) as any,
    )
    const res3 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { api_key: 'k', name: 'n', data: { a: 1 } } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(408)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: 'boom',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn(async () => ({ error: 'boom' })),
        text: vi.fn(async () => ''),
      })) as any,
    )
    const res4 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { api_key: 'k', name: 'n', data: { a: 1 } } }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(500)
  })
})

