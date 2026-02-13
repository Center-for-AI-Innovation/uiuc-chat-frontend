import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from: selectFrom }))
  return {
    db: { select },
    documents: {
      readable_filename: {},
      url: {},
      s3_path: {},
      created_at: {},
      base_url: {},
      course_name: {},
    },
    selectWhere,
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
}))

vi.mock('~/db/schema', () => ({
  documents: hoisted.documents,
}))

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
}))

import handler, {
  getCourseDocuments,
} from '~/pages/api/UIUC-api/getDocsForMaterials'

describe('UIUC-api/getDocsForMaterials', () => {
  it('getCourseDocuments returns null when course name missing or db returns none', async () => {
    await expect(getCourseDocuments('')).resolves.toBeNull()

    hoisted.selectWhere.mockResolvedValueOnce([])
    await expect(getCourseDocuments('CS101')).resolves.toBeNull()
  })

  it('getCourseDocuments maps db rows into strings', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([
      {
        readable_filename: 'f',
        url: null,
        s3_path: 's3://x',
        created_at: new Date('2024-01-01T00:00:00Z'),
        base_url: 'b',
      },
    ])
    const docs = await getCourseDocuments('CS101')
    expect(docs?.[0]).toMatchObject({
      readable_filename: 'f',
      url: '',
      s3_path: 's3://x',
      base_url: 'b',
    })
  })

  it('handler validates courseName and returns 200 with docs', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([
      {
        readable_filename: 'f',
        url: 'u',
        s3_path: 's3://x',
        created_at: new Date('2024-01-01T00:00:00Z'),
        base_url: 'b',
      },
    ])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { courseName: 'CS101', fileName: 'x' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
