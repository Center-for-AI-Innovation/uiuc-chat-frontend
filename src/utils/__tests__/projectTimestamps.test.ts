import { beforeEach, describe, expect, it, vi } from 'vitest'

// Two distinct chain instances so each `db.select(...)` returns a fresh
// builder. Tests configure what each chain resolves to via its `__set`.
type ResolverChain = {
  select: any
  from: any
  where: any
  limit: any
  groupBy: any
  then: any
  __set: (rows: any[] | Error) => void
}

const hoisted = vi.hoisted(() => {
  // Each db.select() call returns the next chain in the queue.
  const queue: ResolverChain[] = []
  let createdChains: ResolverChain[] = []

  const makeChain = (): ResolverChain => {
    let result: any[] | Error = []
    const chain: any = {
      select: (..._args: unknown[]) => chain,
      from: (..._args: unknown[]) => chain,
      where: (..._args: unknown[]) => chain,
      limit: (..._args: unknown[]) => chain,
      groupBy: (..._args: unknown[]) => chain,
      then: (onFulfilled: any, onRejected?: any) =>
        (result instanceof Error
          ? Promise.reject(result)
          : Promise.resolve(result)
        ).then(onFulfilled, onRejected),
      __set: (rows: any[] | Error) => {
        result = rows
      },
    }
    return chain as ResolverChain
  }

  const select = vi.fn(() => {
    const c = queue.shift() ?? makeChain()
    createdChains.push(c)
    return c
  })

  return {
    db: { select },
    enqueueChain: () => {
      const c = makeChain()
      queue.push(c)
      return c
    },
    reset: () => {
      queue.length = 0
      createdChains = []
      select.mockClear()
    },
  }
})

vi.mock('~/db/dbClient', async () => {
  const schema = await import('~/db/schema')
  return {
    db: hoisted.db,
    projects: schema.projects,
    documents: schema.documents,
  }
})

import {
  getProjectTimestamps,
  getBatchProjectTimestamps,
} from '~/utils/projectTimestamps'

describe('getProjectTimestamps', () => {
  beforeEach(() => {
    hoisted.reset()
  })

  it('returns ISO timestamps from project + latest document', async () => {
    const projectChain = hoisted.enqueueChain()
    const docChain = hoisted.enqueueChain()
    projectChain.__set([{ created_at: new Date('2026-01-01T00:00:00Z') }])
    docChain.__set([{ last_updated_at: new Date('2026-02-01T00:00:00Z') }])

    const out = await getProjectTimestamps('CS101')
    expect(out.created_at).toBe('2026-01-01T00:00:00.000Z')
    expect(out.last_updated_at).toBe('2026-02-01T00:00:00.000Z')
  })

  it('falls back to project created_at when no documents exist', async () => {
    const projectChain = hoisted.enqueueChain()
    const docChain = hoisted.enqueueChain()
    projectChain.__set([{ created_at: new Date('2026-01-01T00:00:00Z') }])
    docChain.__set([{ last_updated_at: null }])

    const out = await getProjectTimestamps('CS101')
    expect(out.created_at).toBe('2026-01-01T00:00:00.000Z')
    expect(out.last_updated_at).toBe('2026-01-01T00:00:00.000Z')
  })

  it('returns nulls and logs on db error', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const projectChain = hoisted.enqueueChain()
    projectChain.__set(new Error('boom'))

    const out = await getProjectTimestamps('CS101')
    expect(out).toEqual({ created_at: null, last_updated_at: null })
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('returns nulls when neither project nor docs exist', async () => {
    const projectChain = hoisted.enqueueChain()
    const docChain = hoisted.enqueueChain()
    projectChain.__set([])
    docChain.__set([])

    const out = await getProjectTimestamps('CS101')
    expect(out).toEqual({ created_at: null, last_updated_at: null })
  })
})

describe('getBatchProjectTimestamps', () => {
  beforeEach(() => {
    hoisted.reset()
  })

  it('short-circuits to empty Map on empty input', async () => {
    const result = await getBatchProjectTimestamps([])
    expect(result.size).toBe(0)
  })

  it('joins project + doc rows into a per-course Map', async () => {
    const projectChain = hoisted.enqueueChain()
    const docChain = hoisted.enqueueChain()
    projectChain.__set([
      { course_name: 'CS101', created_at: new Date('2026-01-01T00:00:00Z') },
      { course_name: 'CS102', created_at: new Date('2026-01-02T00:00:00Z') },
    ])
    docChain.__set([
      {
        course_name: 'CS101',
        last_updated_at: new Date('2026-02-01T00:00:00Z'),
      },
      // No row for CS102 — should fall back to project created_at.
    ])

    const result = await getBatchProjectTimestamps(['CS101', 'CS102'])
    expect(result.get('CS101')).toEqual({
      created_at: '2026-01-01T00:00:00.000Z',
      last_updated_at: '2026-02-01T00:00:00.000Z',
    })
    expect(result.get('CS102')).toEqual({
      created_at: '2026-01-02T00:00:00.000Z',
      last_updated_at: '2026-01-02T00:00:00.000Z',
    })
  })

  it('returns whatever was accumulated so far (empty) and logs on db error', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const projectChain = hoisted.enqueueChain()
    const docChain = hoisted.enqueueChain()
    projectChain.__set(new Error('proj failed'))
    docChain.__set([])

    const result = await getBatchProjectTimestamps(['CS101'])
    expect(result.size).toBe(0)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('handles courses with no project row at all (created_at null)', async () => {
    const projectChain = hoisted.enqueueChain()
    const docChain = hoisted.enqueueChain()
    projectChain.__set([])
    docChain.__set([])

    const result = await getBatchProjectTimestamps(['CS999'])
    expect(result.get('CS999')).toEqual({
      created_at: null,
      last_updated_at: null,
    })
  })
})
