import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

type Row = { value: string; usage_count: number }

const hoisted = vi.hoisted(() => {
  let nextRows: Row[] = []
  let capturedWhere: SQL | undefined
  let capturedOrderBy: SQL | undefined
  let capturedLimit: number | undefined

  const makeDbChain = () => {
    const chain: any = {}
    chain.select = (..._args: unknown[]) => chain
    chain.from = (..._args: unknown[]) => chain
    chain.where = (predicate: SQL) => {
      capturedWhere = predicate
      return chain
    }
    chain.orderBy = (predicate: SQL) => {
      capturedOrderBy = predicate
      return chain
    }
    chain.limit = (n: number) => {
      capturedLimit = n
      return chain
    }
    chain.then = (onFulfilled: any, onRejected?: any) =>
      Promise.resolve(nextRows).then(onFulfilled, onRejected)
    return chain
  }

  return {
    db: makeDbChain(),
    setNextRows: (rows: Row[]) => {
      nextRows = rows
    },
    getCapturedWhere: () => capturedWhere,
    getCapturedOrderBy: () => capturedOrderBy,
    getCapturedLimit: () => capturedLimit,
    resetCaptures: () => {
      nextRows = []
      capturedWhere = undefined
      capturedOrderBy = undefined
      capturedLimit = undefined
    },
  }
})

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/db/dbClient', async () => {
  const schema = await import('~/db/schema')
  return {
    db: hoisted.db,
    chatbotTags: schema.chatbotTags,
  }
})

import handler from '~/pages/api/UIUC-api/searchTags'

const dialect = new PgDialect()

function renderSQL(sqlObj: SQL): { sql: string; params: unknown[] } {
  const q = dialect.sqlToQuery(sqlObj)
  return { sql: q.sql, params: q.params }
}

describe('UIUC-api/searchTags', () => {
  beforeEach(() => {
    hoisted.resetCaptures()
  })

  it('returns 405 for non-GET requests', async () => {
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

  it('returns 400 when no email is present on the token', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET', user: {} }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('rejects invalid category', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { category: 'bogus' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('filters by category + lowercase prefix, orders by usage_count desc + alphabetical, caps at 10 by default', async () => {
    hoisted.setNextRows([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { q: 'BeT' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)

    const where = hoisted.getCapturedWhere()
    expect(where).toBeDefined()
    const { sql, params } = renderSQL(where as SQL)
    expect(sql).toMatch(/"category"\s*=\s*\$/i)
    expect(sql).toMatch(/"value_lower"\s+like\s+\$/i)
    expect(params).toContain('general')
    expect(params).toContain('bet%')

    const orderBy = hoisted.getCapturedOrderBy()
    const { sql: orderSql } = renderSQL(orderBy as SQL)
    expect(orderSql).toMatch(/usage_count.*desc/i)
    expect(orderSql).toMatch(/value_lower.*asc/i)

    expect(hoisted.getCapturedLimit()).toBe(10)
  })

  it('returns the requested limit clamped to the MAX_LIMIT (25)', async () => {
    hoisted.setNextRows([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { q: 'foo', limit: '500' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.getCapturedLimit()).toBe(25)
  })

  it('skips the prefix predicate when q is empty (returns top tags by usage)', async () => {
    hoisted.setNextRows([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: {},
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)

    const where = hoisted.getCapturedWhere()
    const { sql } = renderSQL(where as SQL)
    expect(sql).toMatch(/"category"\s*=\s*\$/i)
    expect(sql).not.toMatch(/value_lower.*like/i)
  })

  it('returns the rows as TagSuggestion objects', async () => {
    hoisted.setNextRows([
      { value: 'beta', usage_count: 12 },
      { value: 'Beta-2', usage_count: 3 },
    ])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { q: 'b' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as any).mock.calls[0][0]
    expect(payload.results).toEqual([
      { value: 'beta', usage_count: 12 },
      { value: 'Beta-2', usage_count: 3 },
    ])
  })
})
