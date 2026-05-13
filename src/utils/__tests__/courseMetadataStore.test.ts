import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CourseMetadata } from '~/types/courseMetadata'

// Hoisted mock state so vi.mock factories can reference it.
const redisState = vi.hoisted(() => {
  const store = new Map<string, string>()
  return {
    store,
    hGet: vi.fn(
      async (_hash: string, field: string) => store.get(field) ?? null,
    ),
    hSet: vi.fn(async (_hash: string, obj: Record<string, string>) => {
      for (const [k, v] of Object.entries(obj)) store.set(k, v)
    }),
    hDel: vi.fn(async (_hash: string, field: string) => {
      store.delete(field)
    }),
  }
})

const dbState = vi.hoisted(() => {
  const rows = new Map<string, Record<string, unknown>>()
  const insertFn = vi.fn()
  const updateFn = vi.fn()
  const deleteFn = vi.fn()
  const selectFn = vi.fn()
  return { rows, insertFn, updateFn, deleteFn, selectFn }
})

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: vi.fn(async () => ({
    hGet: redisState.hGet,
    hSet: redisState.hSet,
    hDel: redisState.hDel,
  })),
}))

vi.mock('~/db/dbClient', () => {
  // A chainable builder that records operations against dbState.rows.
  const buildInsert = () => ({
    values: (row: Record<string, unknown>) => ({
      onConflictDoUpdate: vi.fn(
        async ({ set }: { set: Record<string, unknown> }) => {
          dbState.insertFn(row, set)
          const existing = dbState.rows.get(row.course_name as string)
          if (existing) {
            dbState.rows.set(row.course_name as string, { ...existing, ...set })
          } else {
            dbState.rows.set(row.course_name as string, row)
          }
        },
      ),
      // direct insert (no conflict clause) — used by delete rollback.
      then: (resolve: (v?: unknown) => unknown) => {
        dbState.insertFn(row, undefined)
        dbState.rows.set(row.course_name as string, row)
        return Promise.resolve().then(resolve)
      },
    }),
  })

  const buildDelete = () => ({
    where: vi.fn(async () => {
      dbState.deleteFn()
      // The test harness records WHICH course_name is being deleted via the last
      // insert row; to keep things simple, tests reset dbState.rows between cases.
      dbState.rows.clear()
    }),
  })

  const buildSelect = () => ({
    from: () => ({
      where: () => ({
        limit: async () => {
          dbState.selectFn()
          return Array.from(dbState.rows.values())
        },
      }),
    }),
  })

  return {
    db: {
      insert: () => buildInsert(),
      delete: () => buildDelete(),
      select: () => buildSelect(),
    },
    courseMetadata: {
      course_name: 'course_name',
      course_owner: 'course_owner',
      course_admins: 'course_admins',
      approved_emails_list: 'approved_emails_list',
      project_description: 'project_description',
      tags: 'tags',
      is_private: 'is_private',
      allow_logged_in_users: 'allow_logged_in_users',
      is_frozen: 'is_frozen',
      raw_metadata: 'raw_metadata',
      updated_at: 'updated_at',
    },
  }
})

vi.mock('~/types/chatbotTags', () => ({
  sanitizeChatbotTags: (v: unknown) => (Array.isArray(v) ? v : []),
}))

function makeMetadata(overrides: Partial<CourseMetadata> = {}): CourseMetadata {
  return {
    is_private: false,
    course_owner: 'owner@test.edu',
    course_admins: ['admin@test.edu'],
    approved_emails_list: [],
    example_questions: undefined,
    banner_image_s3: undefined,
    course_intro_message: undefined,
    system_prompt: undefined,
    openai_api_key: undefined,
    disabled_models: undefined,
    project_description: 'A test bot',
    documentsOnly: false,
    guidedLearning: false,
    systemPromptOnly: false,
    vector_search_rewrite_disabled: false,
    allow_logged_in_users: false,
    is_frozen: false,
    ...overrides,
  }
}

beforeEach(() => {
  redisState.store.clear()
  redisState.hGet.mockClear()
  redisState.hSet.mockClear()
  redisState.hDel.mockClear()
  dbState.rows.clear()
  dbState.insertFn.mockClear()
  dbState.deleteFn.mockClear()
})

describe('writeCourseMetadata', () => {
  it('writes Postgres then Redis on happy path', async () => {
    const { writeCourseMetadata } = await import('../courseMetadataStore')
    await writeCourseMetadata('bot-a', makeMetadata())
    expect(dbState.insertFn).toHaveBeenCalledTimes(1)
    expect(redisState.hSet).toHaveBeenCalledTimes(1)
    expect(redisState.store.get('bot-a')).toBeDefined()
  })

  it('does not touch Redis if Postgres write throws', async () => {
    dbState.insertFn.mockImplementationOnce(() => {
      throw new Error('pg down')
    })
    const { writeCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(writeCourseMetadata('bot-b', makeMetadata())).rejects.toThrow(
      CourseMetadataWriteError,
    )
    expect(redisState.hSet).not.toHaveBeenCalled()
  })

  it('rolls back Postgres (delete) when Redis fails on CREATE', async () => {
    redisState.hSet.mockImplementationOnce(async () => {
      throw new Error('redis down')
    })
    const { writeCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(writeCourseMetadata('bot-c', makeMetadata())).rejects.toThrow(
      CourseMetadataWriteError,
    )
    // Insert was attempted, then delete was called to roll back.
    expect(dbState.insertFn).toHaveBeenCalledTimes(1)
    expect(dbState.deleteFn).toHaveBeenCalledTimes(1)
  })

  it('rolls back Postgres (restore prior) when Redis fails on UPDATE', async () => {
    // Pre-seed Redis so the helper sees a prior value and takes the UPDATE rollback branch.
    const priorMetadata = makeMetadata({ project_description: 'old' })
    redisState.store.set('bot-d', JSON.stringify(priorMetadata))

    redisState.hSet.mockImplementationOnce(async () => {
      throw new Error('redis down')
    })

    const { writeCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(
      writeCourseMetadata(
        'bot-d',
        makeMetadata({ project_description: 'new' }),
      ),
    ).rejects.toThrow(CourseMetadataWriteError)

    // The helper should have upserted the NEW row, then upserted the PRIOR row back.
    expect(dbState.insertFn).toHaveBeenCalledTimes(2)
    // No delete on an UPDATE rollback path.
    expect(dbState.deleteFn).not.toHaveBeenCalled()
  })

  it('rejects when courseName is empty', async () => {
    const { writeCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(writeCourseMetadata('', makeMetadata())).rejects.toThrow(
      CourseMetadataWriteError,
    )
  })

  it('reports a CRITICAL rollback failure when Redis fails AND the restore also fails', async () => {
    // Seed Redis with a malformed prior value so the UPDATE rollback's
    // JSON.parse blows up inside rollbackPostgres.
    redisState.store.set('bot-critical', '{not json')
    redisState.hSet.mockImplementationOnce(async () => {
      throw new Error('redis down')
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const { writeCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(
      writeCourseMetadata('bot-critical', makeMetadata()),
    ).rejects.toThrow(CourseMetadataWriteError)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe('deleteCourseMetadata', () => {
  it('rejects when courseName is empty', async () => {
    const { deleteCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(deleteCourseMetadata('')).rejects.toThrow(
      CourseMetadataWriteError,
    )
  })

  it('returns early after deleting Postgres when Redis had no prior value', async () => {
    // Pre-seed only Postgres, Redis is empty.
    dbState.rows.set('bot-x', {
      course_name: 'bot-x',
      course_owner: 'o@test.edu',
    })
    const { deleteCourseMetadata } = await import('../courseMetadataStore')
    await deleteCourseMetadata('bot-x')
    expect(dbState.deleteFn).toHaveBeenCalledTimes(1)
    expect(redisState.hDel).not.toHaveBeenCalled()
  })

  it('deletes from Postgres then Redis on the happy path', async () => {
    dbState.rows.set('bot-y', { course_name: 'bot-y' })
    redisState.store.set('bot-y', JSON.stringify(makeMetadata()))
    const { deleteCourseMetadata } = await import('../courseMetadataStore')
    await deleteCourseMetadata('bot-y')
    expect(dbState.deleteFn).toHaveBeenCalledTimes(1)
    expect(redisState.hDel).toHaveBeenCalledTimes(1)
  })

  it('restores the Postgres row when the Redis delete fails', async () => {
    dbState.rows.set('bot-z', { course_name: 'bot-z' })
    redisState.store.set('bot-z', JSON.stringify(makeMetadata()))
    redisState.hDel.mockImplementationOnce(async () => {
      throw new Error('redis down')
    })
    const { deleteCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(deleteCourseMetadata('bot-z')).rejects.toThrow(
      CourseMetadataWriteError,
    )
    // delete called once, then insert (restore) called once
    expect(dbState.deleteFn).toHaveBeenCalledTimes(1)
    expect(dbState.insertFn).toHaveBeenCalledTimes(1)
  })

  it('logs CRITICAL when Redis delete fails AND the Postgres restore also fails', async () => {
    dbState.rows.set('bot-w', { course_name: 'bot-w' })
    redisState.store.set('bot-w', JSON.stringify(makeMetadata()))
    redisState.hDel.mockImplementationOnce(async () => {
      throw new Error('redis down')
    })
    dbState.insertFn.mockImplementationOnce(() => {
      throw new Error('restore also failed')
    })
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const { deleteCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(deleteCourseMetadata('bot-w')).rejects.toThrow(
      CourseMetadataWriteError,
    )
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('wraps a Postgres delete failure in CourseMetadataWriteError', async () => {
    dbState.rows.set('bot-v', { course_name: 'bot-v' })
    redisState.store.set('bot-v', JSON.stringify(makeMetadata()))
    dbState.deleteFn.mockImplementationOnce(() => {
      throw new Error('pg down')
    })
    const { deleteCourseMetadata, CourseMetadataWriteError } = await import(
      '../courseMetadataStore'
    )
    await expect(deleteCourseMetadata('bot-v')).rejects.toThrow(
      CourseMetadataWriteError,
    )
    expect(redisState.hDel).not.toHaveBeenCalled()
  })
})
