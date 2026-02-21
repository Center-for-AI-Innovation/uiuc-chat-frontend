/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  fetchContextsViaDrizzleVectorSearch: vi.fn(),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest:
    () => (h: (req: any, res: any) => Promise<void>) =>
      h,
}))

vi.mock('~/server/fetchContextsForVectorSearch', () => ({
  fetchContextsViaDrizzleVectorSearch:
    hoisted.fetchContextsViaDrizzleVectorSearch,
}))

import getContextsHandler from '~/pages/api/getContexts'

describe('getContexts API', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = createMockRes()
    await getContextsHandler(
      createMockReq({ method: 'GET' }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' })
  })

  it('returns 400 when course_name is missing', async () => {
    const res = createMockRes()
    await getContextsHandler(
      createMockReq({
        method: 'POST',
        body: { search_query: 'q' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'course_name and search_query are required',
    })
    expect(hoisted.fetchContextsViaDrizzleVectorSearch).not.toHaveBeenCalled()
  })

  it('returns 400 when search_query is missing', async () => {
    const res = createMockRes()
    await getContextsHandler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'course_name and search_query are required',
    })
    expect(hoisted.fetchContextsViaDrizzleVectorSearch).not.toHaveBeenCalled()
  })

  it('returns 200 with contexts when fetchContextsViaDrizzleVectorSearch succeeds', async () => {
    const data = [
      { id: '1', text: 'context 1', metadata: {} },
      { id: '2', text: 'context 2', metadata: {} },
    ]
    hoisted.fetchContextsViaDrizzleVectorSearch.mockResolvedValueOnce(data)

    const res = createMockRes()
    await getContextsHandler(
      createMockReq({
        method: 'POST',
        body: {
          course_name: 'CS225',
          search_query: 'binary trees',
          doc_groups: ['lectures'],
          conversation_id: 'conv-1',
          top_n: 50,
        },
      }) as any,
      res as any,
    )

    expect(hoisted.fetchContextsViaDrizzleVectorSearch).toHaveBeenCalledWith(
      'CS225',
      'binary trees',
      ['lectures'],
      'conv-1',
      50,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(data)
  })

  it('passes default doc_groups and top_n when omitted from body', async () => {
    hoisted.fetchContextsViaDrizzleVectorSearch.mockResolvedValueOnce([])

    const res = createMockRes()
    await getContextsHandler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101', search_query: 'hello' },
      }) as any,
      res as any,
    )

    expect(hoisted.fetchContextsViaDrizzleVectorSearch).toHaveBeenCalledWith(
      'CS101',
      'hello',
      [],
      undefined,
      100,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 500 when fetchContextsViaDrizzleVectorSearch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    hoisted.fetchContextsViaDrizzleVectorSearch.mockRejectedValueOnce(
      new Error('db error'),
    )

    const res = createMockRes()
    await getContextsHandler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101', search_query: 'q' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error while fetching contexts',
      data: [],
    })
  })
})
