/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  fetch: vi.fn(),
  invalidate: vi.fn(async () => {}),
  getBackendUrl: vi.fn(() => 'https://backend.example'),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/utils/connectionManager', () => ({
  connectionManager: { invalidate: hoisted.invalidate },
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: hoisted.getBackendUrl,
}))

beforeEach(() => {
  hoisted.fetch.mockReset()
  hoisted.invalidate.mockClear()
  globalThis.fetch = hoisted.fetch as any
})

import handler from '~/pages/api/UIUC-api/projectConnections'

function jsonResp(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }
}

describe('projectConnections proxy', () => {
  it('GET forwards to backend and does NOT invalidate cache', async () => {
    hoisted.fetch.mockResolvedValueOnce(
      jsonResp(200, { found: true, project_name: 'p' }),
    )
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { project_name: 'p' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })

  it('GET returns 400 when project_name is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'GET', query: {} }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
    expect(hoisted.fetch).not.toHaveBeenCalled()
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })

  it('POST invalidates cache for the body project_name on success', async () => {
    hoisted.fetch.mockResolvedValueOnce(
      jsonResp(200, { success: true, project_name: 'p1', project_id: 1 }),
    )
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { project_name: 'p1', s3_config: { bucket_name: 'b' } },
      }) as any,
      res as any,
    )
    expect(hoisted.invalidate).toHaveBeenCalledExactlyOnceWith('p1')
  })

  it('POST does NOT invalidate when the backend returns non-2xx', async () => {
    hoisted.fetch.mockResolvedValueOnce(jsonResp(400, { error: 'bad' }))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { project_name: 'p1', s3_config: {} },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })

  it('DELETE without type forwards row delete and invalidates', async () => {
    hoisted.fetch.mockResolvedValueOnce(jsonResp(200, { success: true }))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        query: { project_name: 'p2' },
      }) as any,
      res as any,
    )
    expect(hoisted.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/project-connections\?project_name=p2$/),
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(hoisted.invalidate).toHaveBeenCalledExactlyOnceWith('p2')
  })

  it('DELETE with type=qdrant forwards type query and invalidates', async () => {
    hoisted.fetch.mockResolvedValueOnce(
      jsonResp(200, { success: true, cleared: 'qdrant' }),
    )
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'DELETE',
        query: { project_name: 'p2', type: 'qdrant' },
      }) as any,
      res as any,
    )
    expect(hoisted.fetch).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/api\/project-connections\?project_name=p2&type=qdrant$/,
      ),
      expect.anything(),
    )
    expect(hoisted.invalidate).toHaveBeenCalledExactlyOnceWith('p2')
  })

  it('DELETE returns 400 when project_name is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'DELETE', query: {} }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
    expect(hoisted.fetch).not.toHaveBeenCalled()
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })

  it('PATCH /active invalidates on success', async () => {
    hoisted.fetch.mockResolvedValueOnce(
      jsonResp(200, { success: true, project_name: 'p3', is_active: false }),
    )
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'PATCH',
        body: { project_name: 'p3', is_active: false },
      }) as any,
      res as any,
    )
    expect(hoisted.fetch).toHaveBeenCalledWith(
      'https://backend.example/api/project-connections/active',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(hoisted.invalidate).toHaveBeenCalledExactlyOnceWith('p3')
  })

  it('PATCH does NOT invalidate when backend returns 404', async () => {
    hoisted.fetch.mockResolvedValueOnce(
      jsonResp(404, { error: 'no such project' }),
    )
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'PATCH',
        body: { project_name: 'p3', is_active: false },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(404)
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })

  it('returns 405 for unknown methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'PUT' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })

  it('swallows invalidate() failures so the proxy still returns the upstream response', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    hoisted.fetch.mockResolvedValueOnce(
      jsonResp(200, { success: true, project_name: 'p' }),
    )
    hoisted.invalidate.mockRejectedValueOnce(new Error('redis down'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { project_name: 'p' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('falls back to course_name when project_name is absent on GET/DELETE', async () => {
    hoisted.fetch.mockResolvedValueOnce(jsonResp(200, { found: false }))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { course_name: 'fallback' },
      }) as any,
      res as any,
    )
    expect(hoisted.fetch).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/api\/project-connections\?project_name=fallback$/,
      ),
      expect.anything(),
    )
  })
})
