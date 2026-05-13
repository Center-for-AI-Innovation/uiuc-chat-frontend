import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

type Row = { course_name: string; raw_metadata: any }

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
    courseMetadata: schema.courseMetadata,
  }
})

import handler from '~/pages/api/UIUC-api/getFeaturedChatbots'

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
    is_frozen: boolean
    tags: Array<{ category: string; value: string }>
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

describe('UIUC-api/getFeaturedChatbots', () => {
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

  it('queries public, non-frozen chatbots in random order with a 20-row cap', async () => {
    hoisted.setNextRows([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)

    const where = hoisted.getCapturedWhere()
    const orderBy = hoisted.getCapturedOrderBy()
    expect(where).toBeDefined()
    expect(orderBy).toBeDefined()

    const { sql: whereSql } = renderSQL(where as SQL)
    expect(whereSql).toMatch(/"is_frozen"\s*=\s*false/i)
    expect(whereSql).toMatch(/"is_private"\s*=\s*false/i)

    const { sql: orderBySql } = renderSQL(orderBy as SQL)
    expect(orderBySql).toMatch(/random\(\)/i)

    expect(hoisted.getCapturedLimit()).toBe(20)
  })

  it('returns cards built from the row metadata', async () => {
    const userEmail = 'me@example.com'
    hoisted.setNextRows([
      fixtureRow({
        course_name: 'featured-bot',
        course_owner: 'other@example.com',
        project_description: 'a public bot',
        tags: [
          { category: 'organization', value: 'Grainger Engineering' },
          { category: 'projectType', value: 'Course' },
          { category: 'general', value: 'ml' },
        ],
      }),
    ])

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: userEmail },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as any).mock.calls[0][0]
    expect(payload.total).toBe(1)
    expect(payload.results).toHaveLength(1)

    const card = payload.results[0]
    expect(card.course_name).toBe('featured-bot')
    expect(card.organization).toBe('Grainger Engineering')
    expect(card.projectType).toBe('Course')
    expect(card.generalTags).toEqual(['ml'])
    // Not the caller's bot, so raw metadata is not exposed.
    expect(card.metadata).toBeUndefined()
    expect(card.userRole).toBeUndefined()
  })
})
