import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

type Row = { file_type: string; file_count: number }

const hoisted = vi.hoisted(() => {
  let nextRows: Row[] = []
  let nextError: Error | null = null

  const makeChain = () => {
    const chain: any = {}
    chain.select = (..._args: unknown[]) => chain
    chain.from = (..._args: unknown[]) => chain
    chain.where = (..._args: unknown[]) => chain
    chain.groupBy = (..._args: unknown[]) => chain
    chain.then = (onFulfilled: any, onRejected?: any) =>
      (nextError ? Promise.reject(nextError) : Promise.resolve(nextRows)).then(
        onFulfilled,
        onRejected,
      )
    return chain
  }

  return {
    db: makeChain(),
    setRows: (r: Row[]) => {
      nextRows = r
    },
    setError: (e: Error | null) => {
      nextError = e
    },
    reset: () => {
      nextRows = []
      nextError = null
    },
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/db/dbClient', async () => {
  const schema = await import('~/db/schema')
  return { db: hoisted.db, documents: schema.documents }
})

import handler from '~/pages/api/UIUC-api/getDocumentSummary'

describe('UIUC-api/getDocumentSummary', () => {
  beforeEach(() => {
    hoisted.reset()
  })

  it('returns 405 for non-GET', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'me@example.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when course_name is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('aggregates rows into total_file_count and by_type', async () => {
    hoisted.setRows([
      { file_type: 'PDF', file_count: 5 },
      { file_type: 'Video', file_count: 2 },
    ])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as any).mock.calls[0][0]
    expect(payload.success).toBe(true)
    expect(payload.documentSummary.total_file_count).toBe(7)
    expect(payload.documentSummary.by_type).toEqual([
      { type: 'PDF', file_count: 5, total_size_bytes: 0 },
      { type: 'Video', file_count: 2, total_size_bytes: 0 },
    ])
  })

  it('returns an empty summary when there are no rows', async () => {
    hoisted.setRows([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as any).mock.calls[0][0]
    expect(payload.documentSummary.total_file_count).toBe(0)
    expect(payload.documentSummary.by_type).toEqual([])
  })

  it('returns 500 when the db throws', async () => {
    const consoleLog = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)
    hoisted.setError(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
    consoleLog.mockRestore()
  })
})
