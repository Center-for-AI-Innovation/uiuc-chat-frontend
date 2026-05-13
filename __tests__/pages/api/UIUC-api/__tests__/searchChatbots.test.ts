import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

type Row = { course_name: string; raw_metadata: any }

const hoisted = vi.hoisted(() => {
  let nextRows: Row[] = []
  let capturedWhere: SQL | undefined

  const makeDbChain = () => {
    const chain: any = {}
    chain.select = (..._args: unknown[]) => chain
    chain.from = (..._args: unknown[]) => chain
    chain.where = (predicate: SQL) => {
      capturedWhere = predicate
      return chain
    }
    chain.orderBy = (..._args: unknown[]) => chain
    chain.limit = (..._args: unknown[]) => chain
    chain.groupBy = (..._args: unknown[]) => chain
    chain.innerJoin = (..._args: unknown[]) => chain
    chain.leftJoin = (..._args: unknown[]) => chain
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
    resetCaptures: () => {
      nextRows = []
      capturedWhere = undefined
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
    courseMetadata: schema.courseMetadata,
  }
})

import handler from '~/pages/api/UIUC-api/searchChatbots'

const dialect = new PgDialect()

function renderSQL(sqlObj: SQL): { sql: string; params: unknown[] } {
  const q = dialect.sqlToQuery(sqlObj)
  return { sql: q.sql, params: q.params }
}

function fixtureRow(
  overrides: Partial<{
    course_name: string
    course_owner: string
    course_admins: string[]
    project_description: string
    is_private: boolean
    allow_logged_in_users: boolean
    is_frozen: boolean
    tags: Array<{ category: string; value: string }>
    banner_image_s3: string | null
  }> = {},
): Row {
  const metadata = {
    course_name: 'cs101',
    course_owner: 'owner@example.com',
    course_admins: [],
    approved_emails_list: [],
    project_description: '',
    tags: [],
    is_private: false,
    allow_logged_in_users: false,
    is_frozen: false,
    banner_image_s3: null,
    ...overrides,
  }
  return {
    course_name: metadata.course_name,
    raw_metadata: metadata,
  }
}

describe('UIUC-api/searchChatbots', () => {
  beforeEach(() => {
    hoisted.resetCaptures()
  })

  it('returns 405 for non-GET requests', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'owner@example.com' },
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

  it('returns 400 for an invalid privacy value', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'owner@example.com' },
        query: { privacy: 'bogus' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('includes a tag-value ILIKE clause in the text search predicate when q is set', async () => {
    hoisted.setNextRows([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'owner@example.com' },
        query: { q: 'Grainger' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)

    const captured = hoisted.getCapturedWhere()
    expect(captured).toBeDefined()
    const { sql, params } = renderSQL(captured as SQL)

    // The three pre-existing text fields are still searched.
    expect(sql).toMatch(/"course_name"\s+ilike/i)
    expect(sql).toMatch(/"project_description"\s+ilike/i)
    expect(sql).toMatch(/"course_owner"\s+ilike/i)

    // The new clause searches inside the jsonb tags array on t->>'value'.
    expect(sql).toMatch(/jsonb_array_elements/i)
    expect(sql).toMatch(/t->>'value'\)?\s+ilike/i)

    // The wildcard-wrapped query is bound as a parameter — once per OR branch.
    const wildcardCount = params.filter((p) => p === '%Grainger%').length
    expect(wildcardCount).toBeGreaterThanOrEqual(4)
  })

  it('omits the text predicate when q is empty (regression)', async () => {
    hoisted.setNextRows([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'owner@example.com' },
        query: {},
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)

    const captured = hoisted.getCapturedWhere()
    const { sql } = renderSQL(captured as SQL)
    expect(sql).not.toMatch(/ilike/i)
    expect(sql).not.toMatch(/jsonb_array_elements/i)
  })

  it('ANDs the existing tags filter with the text query rather than replacing it', async () => {
    hoisted.setNextRows([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'owner@example.com' },
        query: { q: 'foo', tags: 'Grainger Engineering,Course' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)

    const captured = hoisted.getCapturedWhere()
    const { sql, params } = renderSQL(captured as SQL)

    // Text predicate still present.
    expect(sql).toMatch(/"course_name"\s+ilike/i)
    expect(sql).toMatch(/t->>'value'\)?\s+ilike/i)
    expect(params).toContain('%foo%')

    // Tag exact-match predicate also present (separate EXISTS using ANY).
    expect(sql).toMatch(/= ANY\(/i)
    expect(params).toContain('Grainger Engineering')
    expect(params).toContain('Course')
  })

  it('returns sanitized card data and lifts owner-tier rows to the top of results', async () => {
    const userEmail = 'me@example.com'
    hoisted.setNextRows([
      fixtureRow({
        course_name: 'other-bot',
        course_owner: 'someone@example.com',
        project_description: 'a public bot',
      }),
      fixtureRow({
        course_name: 'my-bot',
        course_owner: userEmail,
        project_description: 'my own bot',
        tags: [{ category: 'organization', value: 'Grainger Engineering' }],
      }),
    ])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: userEmail },
        query: {},
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as any).mock.calls[0][0]
    expect(payload.total).toBe(2)
    expect(payload.results).toHaveLength(2)

    // Owner-tier bot is sorted first regardless of input order.
    expect(payload.results[0].course_name).toBe('my-bot')
    expect(payload.results[0].userRole).toBe('owner')
    expect(payload.results[0].organization).toBe('Grainger Engineering')
    expect(payload.results[0].owner).toBe('You')

    expect(payload.results[1].course_name).toBe('other-bot')
    expect(payload.results[1].userRole).toBeUndefined()
    // The caller doesn't own this one, so raw metadata is not exposed.
    expect(payload.results[1].metadata).toBeUndefined()
  })
})
