import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

import getAllCourseDataHandler from '~/pages/api/UIUC-api/getAllCourseData'
import downloadMITCourseHandler from '~/pages/api/UIUC-api/downloadMITCourse'
import getN8nWorkflowsHandler from '~/pages/api/UIUC-api/getN8nWorkflows'

describe('UIUC-api backend proxy routes', () => {
  it('getAllCourseData validates method/params and proxies fetch', async () => {
    const res1 = createMockRes()
    await getAllCourseDataHandler(createMockReq({ method: 'POST' }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(405)

    const res2 = createMockRes()
    await getAllCourseDataHandler(
      createMockReq({ method: 'GET', query: {} }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const res3 = createMockRes()
    await getAllCourseDataHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(500)

    const res4 = createMockRes()
    await getAllCourseDataHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(200)
    fetchSpy.mockRestore()
  })

  it('downloadMITCourse validates inputs and proxies fetch', async () => {
    const res1 = createMockRes()
    await downloadMITCourseHandler(createMockReq({ method: 'POST' }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(405)

    const res2 = createMockRes()
    await downloadMITCourseHandler(
      createMockReq({ method: 'GET', query: { url: 'u' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 502 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const res3 = createMockRes()
    await downloadMITCourseHandler(
      createMockReq({
        method: 'GET',
        query: { url: 'u', course_name: 'CS101', local_dir: 'd' },
      }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(502)

    const res4 = createMockRes()
    await downloadMITCourseHandler(
      createMockReq({
        method: 'GET',
        query: { url: 'u', course_name: 'CS101', local_dir: 'd' },
      }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(200)
    fetchSpy.mockRestore()
  })

  it('getN8nWorkflows validates inputs and proxies fetch', async () => {
    const res1 = createMockRes()
    await getN8nWorkflowsHandler(createMockReq({ method: 'POST' }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(405)

    const res2 = createMockRes()
    await getN8nWorkflowsHandler(
      createMockReq({ method: 'GET', query: {} }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 500, statusText: 'boom' }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ workflows: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    const res3 = createMockRes()
    await getN8nWorkflowsHandler(
      createMockReq({ method: 'GET', query: { api_key: 'k' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(500)

    const res4 = createMockRes()
    await getN8nWorkflowsHandler(
      createMockReq({ method: 'GET', query: { api_key: 'k' } }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(200)
    fetchSpy.mockRestore()
  })
})

