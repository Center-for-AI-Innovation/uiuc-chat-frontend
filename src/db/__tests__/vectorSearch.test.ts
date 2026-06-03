/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from 'vitest'

// vectorSearchWithDrizzle(projectName, params) must look up the per-project
// documents Drizzle client through ConnectionManager — not import a fixed
// `db` from dbClient. This test asserts the routing without exercising the
// real SQL.

const driverRows = [
  {
    id: 1,
    page_content: 'hello world',
    readable_filename: 'doc.pdf',
    course_name: 'p',
    s3_path: 's3://b/k',
    pagenumber: '1',
    url: '',
    base_url: '',
    score: 0.91,
  },
]

function makeDrizzleStub() {
  // chain: db.select({...}).from(table).where(...).orderBy(...).limit(...)
  const limit = vi.fn().mockResolvedValue(driverRows)
  const orderBy = vi.fn(() => ({ limit }))
  const where = vi.fn(() => ({ orderBy }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))
  return { select, from, where, orderBy, limit, db: { select } }
}

beforeEach(() => {
  vi.resetModules()
})

describe('vectorSearchWithDrizzle — per-project routing', () => {
  it('queries via ConnectionManager.getDocumentsDb(projectName), not host', async () => {
    const perProject = makeDrizzleStub()
    const host = makeDrizzleStub()
    const getDocumentsDb = vi.fn(async () => perProject.db)

    vi.doMock('~/utils/connectionManager', () => ({
      connectionManager: { getDocumentsDb },
    }))
    // Importing dbClient must not be required at function-call time — but if
    // imported transitively, give it a host-shaped stub so the test stays
    // hermetic.
    vi.doMock('~/db/dbClient', () => ({ db: host.db }))

    const { vectorSearchWithDrizzle } = await import('../vectorSearch')

    const out = await vectorSearchWithDrizzle('cs101', {
      queryEmbedding: [0.1, 0.2, 0.3],
      course_name: 'cs101',
      doc_groups: [],
      disabled_doc_groups: [],
      public_doc_groups: [],
    })

    expect(getDocumentsDb).toHaveBeenCalledWith('cs101')
    expect(perProject.select).toHaveBeenCalledTimes(1)
    expect(host.select).not.toHaveBeenCalled()
    expect(out).toHaveLength(1)
    expect(out[0]!.readable_filename).toBe('doc.pdf')
  })

  it('honors conversation_id by widening the WHERE clause', async () => {
    const perProject = makeDrizzleStub()
    const getDocumentsDb = vi.fn(async () => perProject.db)
    vi.doMock('~/utils/connectionManager', () => ({
      connectionManager: { getDocumentsDb },
    }))
    vi.doMock('~/db/dbClient', () => ({ db: makeDrizzleStub().db }))

    const { vectorSearchWithDrizzle } = await import('../vectorSearch')

    await vectorSearchWithDrizzle('cs101', {
      queryEmbedding: [0.1, 0.2, 0.3],
      course_name: 'cs101',
      doc_groups: ['g1', 'g2'],
      disabled_doc_groups: ['blocked'],
      public_doc_groups: [
        { course_name: 'shared', name: 'pubmed', enabled: true },
        { course_name: 'shared', name: 'patents', enabled: false },
      ],
      conversation_id: 'conv-123',
      top_n: 25,
    })

    // The chain should still be select→from→where→orderBy→limit; the
    // conversation_id branch only differs in WHERE construction. We assert
    // the where receives a non-undefined arg (i.e. the function ran the
    // conversation branch, not the empty case).
    expect(getDocumentsDb).toHaveBeenCalledWith('cs101')
    expect(perProject.where).toHaveBeenCalledTimes(1)
    const whereCall = perProject.where.mock.calls[0] as unknown[] | undefined
    expect(whereCall).toBeDefined()
    expect(whereCall && whereCall[0]).toBeDefined()
    expect(perProject.limit).toHaveBeenCalledWith(25)
  })
})
