/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  getBackendUrl: vi.fn(() => 'http://backend'),
}))

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return { ...actual, getBackendUrl: hoisted.getBackendUrl }
})

import handler from '~/pages/api/getNomicMapForQueries'

describe('getNomicMapForQueries API', () => {
  it('returns 200 with parsed map data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ map_id: 'm', map_link: 'https://atlas.example.com' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { course_name: 'CS101', map_type: 'all' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      map_id: 'm',
      map_link: 'https://atlas.example.com',
    })
  })

  it('returns 500 when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        query: { course_name: 'CS101', map_type: 'all' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
