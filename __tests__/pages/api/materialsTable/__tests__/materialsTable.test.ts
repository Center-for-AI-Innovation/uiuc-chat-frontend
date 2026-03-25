/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  select: vi.fn(),
  posthogCapture: vi.fn(),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (handler: any) => handler,
  withCourseAccessFromRequest: () => (handler: any) => handler,
}))

vi.mock('posthog-js', () => ({
  default: {
    capture: hoisted.posthogCapture,
  },
}))

vi.mock('~/db/dbClient', () => ({
  db: {
    select: hoisted.select,
  },
  documentsInProgress: {
    course_name: { name: 'course_name' },
    readable_filename: { name: 'readable_filename' },
    base_url: { name: 'base_url' },
    url: { name: 'url' },
  },
  documentsFailed: {
    id: { name: 'id' },
    course_name: { name: 'course_name' },
    readable_filename: { name: 'readable_filename' },
    s3_path: { name: 's3_path' },
    url: { name: 'url' },
    base_url: { name: 'base_url' },
    created_at: { name: 'created_at' },
    error: { name: 'error' },
  },
  documents: {
    id: { name: 'id' },
    course_name: { name: 'course_name' },
    readable_filename: { name: 'readable_filename' },
    base_url: { name: 'base_url' },
    url: { name: 'url' },
  },
}))

vi.mock('drizzle-orm', () => {
  const sql = ((strings: TemplateStringsArray, ...values: any[]) => ({
    strings,
    values,
  })) as any
  sql.identifier = (value: string) => value

  return {
    relations: () => ({}),
    eq: () => ({}),
    and: () => ({}),
    gte: () => ({}),
    asc: () => ({}),
    desc: () => ({}),
    sql,
  }
})

import docsInProgressHandler from '~/pages/api/materialsTable/docsInProgress'
import fetchIfDocumentExistsHandler from '~/pages/api/materialsTable/fetchIfDocumentExists'
import fetchFailedDocumentsHandler from '~/pages/api/materialsTable/fetchFailedDocuments'
import fetchProjectMaterialsHandler from '~/pages/api/materialsTable/fetchProjectMaterials'
import successDocsHandler from '~/pages/api/materialsTable/successDocs'

describe('materialsTable API handlers', () => {
  beforeEach(() => {
    hoisted.select.mockReset()
    hoisted.posthogCapture.mockReset()
  })

  it('docsInProgress returns 405 for non-GET', async () => {
    const res = createMockRes()
    await docsInProgressHandler(
      createMockReq({ method: 'POST' }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('docsInProgress returns mapped documents (or empty)', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: vi.fn().mockResolvedValueOnce([]),
      }),
    }))

    const res1 = createMockRes()
    await docsInProgressHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)
    expect(res1.json).toHaveBeenCalledWith({ documents: [] })

    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: vi
          .fn()
          .mockResolvedValueOnce([
            { readable_filename: '' },
            { readable_filename: 'Doc A' },
          ]),
      }),
    }))

    const res2 = createMockRes()
    await docsInProgressHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith({
      documents: [
        { readable_filename: 'Untitled Document', base_url: '', url: '' },
        { readable_filename: 'Doc A', base_url: '', url: '' },
      ],
    })
  })

  it('fetchIfDocumentExists validates method and course_name', async () => {
    const badMethodRes = createMockRes()
    await fetchIfDocumentExistsHandler(
      createMockReq({ method: 'POST' }) as any,
      badMethodRes as any,
    )
    expect(badMethodRes.status).toHaveBeenCalledWith(405)
    expect(badMethodRes.json).toHaveBeenCalledWith({
      error: 'Method not allowed',
    })

    const missingQueryRes = createMockRes()
    await fetchIfDocumentExistsHandler(
      createMockReq({ method: 'GET', query: {} }) as any,
      missingQueryRes as any,
    )
    expect(missingQueryRes.status).toHaveBeenCalledWith(400)
    expect(missingQueryRes.json).toHaveBeenCalledWith({
      error: 'Missing required query parameter: course_name',
    })
  })

  it('fetchIfDocumentExists returns 1 when a document exists and 0 otherwise', async () => {
    hoisted.select
      .mockImplementationOnce(() => ({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValueOnce([{ id: 'doc-1' }]),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: () => ({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      }))

    const existsRes = createMockRes()
    await fetchIfDocumentExistsHandler(
      createMockReq({
        method: 'GET',
        query: { course_name: 'CS101' },
      }) as any,
      existsRes as any,
    )
    expect(existsRes.status).toHaveBeenCalledWith(200)
    expect(existsRes.json).toHaveBeenCalledWith({ total_count: 1 })

    const missingRes = createMockRes()
    await fetchIfDocumentExistsHandler(
      createMockReq({
        method: 'GET',
        query: { course_name: 'CS102' },
      }) as any,
      missingRes as any,
    )
    expect(missingRes.status).toHaveBeenCalledWith(200)
    expect(missingRes.json).toHaveBeenCalledWith({ total_count: 0 })
  })

  it('fetchIfDocumentExists returns 500 when the lookup fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockRejectedValueOnce(new Error('db down')),
        }),
      }),
    }))

    const res = createMockRes()
    await fetchIfDocumentExistsHandler(
      createMockReq({
        method: 'GET',
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'db down' })
  })

  it('successDocs returns mapped documents (or empty) and 405 for non-GET', async () => {
    const res0 = createMockRes()
    await successDocsHandler(
      createMockReq({ method: 'PUT' }) as any,
      res0 as any,
    )
    expect(res0.status).toHaveBeenCalledWith(405)

    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: vi.fn().mockResolvedValueOnce([]),
      }),
    }))

    const res1 = createMockRes()
    await successDocsHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)
    expect(res1.json).toHaveBeenCalledWith({ documents: [] })

    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: vi.fn().mockResolvedValueOnce([
          { readable_filename: null, base_url: null, url: null },
          { readable_filename: 'Doc', base_url: 'b', url: 'u' },
        ]),
      }),
    }))

    const res2 = createMockRes()
    await successDocsHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith({
      documents: [
        { readable_filename: '', base_url: '', url: '' },
        { readable_filename: 'Doc', base_url: 'b', url: 'u' },
      ],
    })
  })

  it('fetchFailedDocuments rejects when from/to are missing in the URL', async () => {
    const req = createMockReq({
      method: 'GET',
      url: '/api/materialsTable/fetchFailedDocuments?course_name=CS101',
      headers: { host: 'localhost' },
    })
    const res = createMockRes()
    await expect(
      fetchFailedDocumentsHandler(req as any, res as any),
    ).rejects.toThrow('Missing required query parameters: from and to')
  })

  it('fetchFailedDocuments returns 405 for non-GET', async () => {
    const res = createMockRes()
    await fetchFailedDocumentsHandler(
      createMockReq({ method: 'POST' }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('fetchFailedDocuments returns 200 with docs, total_count, and recent_fail_count (no filter)', async () => {
    hoisted.select
      .mockImplementationOnce(() => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => ({
                offset: vi.fn().mockResolvedValueOnce([{ id: 1 }, { id: 2 }]),
              }),
            }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ count: 2 }]),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ count: 1 }]),
        }),
      }))

    const res = createMockRes()
    await fetchFailedDocumentsHandler(
      createMockReq({
        method: 'GET',
        url: '/api/materialsTable/fetchFailedDocuments?from=0&to=1&course_name=CS101',
        headers: { host: 'localhost' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      final_docs: [{ id: 1 }, { id: 2 }],
      total_count: 2,
      recent_fail_count: 1,
    })
  })

  it('fetchFailedDocuments returns 200 with docs, total_count, and recent_fail_count (filter branch)', async () => {
    hoisted.select
      .mockImplementationOnce(() => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => ({
                offset: vi.fn().mockResolvedValueOnce([{ id: 1 }]),
              }),
            }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ count: 1 }]),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ count: 0 }]),
        }),
      }))

    const res = createMockRes()
    await fetchFailedDocumentsHandler(
      createMockReq({
        method: 'GET',
        url: '/api/materialsTable/fetchFailedDocuments?from=0&to=0&course_name=CS101&filter_key=readable_filename&filter_value=Doc&sort_column=created_at&sort_direction=asc',
        headers: { host: 'localhost' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      final_docs: [{ id: 1 }],
      total_count: 1,
      recent_fail_count: 0,
    })
  })

  it('fetchFailedDocuments returns 500 when the docs query fails', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              offset: vi.fn().mockRejectedValueOnce(new Error('boom')),
            }),
          }),
        }),
      }),
    }))

    const res = createMockRes()
    await fetchFailedDocumentsHandler(
      createMockReq({
        method: 'GET',
        url: '/api/materialsTable/fetchFailedDocuments?from=0&to=1&course_name=CS101',
        headers: { host: 'localhost' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' })
  })

  it('fetchFailedDocuments returns 500 when count query fails', async () => {
    hoisted.select
      .mockImplementationOnce(() => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => ({
                offset: vi.fn().mockResolvedValueOnce([{ id: 1 }]),
              }),
            }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockRejectedValueOnce(new Error('countBoom')),
        }),
      }))

    const res = createMockRes()
    await fetchFailedDocumentsHandler(
      createMockReq({
        method: 'GET',
        url: '/api/materialsTable/fetchFailedDocuments?from=0&to=0&course_name=CS101',
        headers: { host: 'localhost' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'countBoom' })
  })

  it('fetchFailedDocuments returns 500 when recent-fail count query fails', async () => {
    hoisted.select
      .mockImplementationOnce(() => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => ({
                offset: vi.fn().mockResolvedValueOnce([{ id: 1 }]),
              }),
            }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ count: 1 }]),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockRejectedValueOnce(new Error('recentBoom')),
        }),
      }))

    const res = createMockRes()
    await fetchFailedDocumentsHandler(
      createMockReq({
        method: 'GET',
        url: '/api/materialsTable/fetchFailedDocuments?from=0&to=0&course_name=CS101',
        headers: { host: 'localhost' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'recentBoom' })
  })

  it('fetchProjectMaterials returns 405 and 400 for invalid requests', async () => {
    const res0 = createMockRes()
    await fetchProjectMaterialsHandler(
      createMockReq({ method: 'POST' }) as any,
      res0 as any,
    )
    expect(res0.status).toHaveBeenCalledWith(405)

    const res1 = createMockRes()
    await fetchProjectMaterialsHandler(
      createMockReq({ method: 'GET', query: {} }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(400)
  })

  it('fetchProjectMaterials returns 200 with docs and total_count (no filter)', async () => {
    hoisted.select
      .mockImplementationOnce(() => ({
        from: () => ({
          leftJoin: () => ({
            leftJoin: () => ({
              where: () => ({
                groupBy: () => ({
                  orderBy: () => ({
                    limit: () => ({
                      offset: vi.fn().mockResolvedValueOnce([
                        { id: 1, doc_groups: null },
                        { id: 2, doc_groups: ['A'] },
                      ]),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ count: 2 }]),
        }),
      }))

    const res = createMockRes()
    await fetchProjectMaterialsHandler(
      createMockReq({
        method: 'GET',
        query: {
          from: '0',
          to: '1',
          course_name: 'CS101',
          sort_column: 'nope',
          sort_direction: 'desc',
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      final_docs: [
        { id: 1, doc_groups: [] },
        { id: 2, doc_groups: ['A'] },
      ],
      total_count: 2,
    })
  })

  it('fetchProjectMaterials returns 200 with docs and total_count (filter branch)', async () => {
    hoisted.select
      .mockImplementationOnce(() => ({
        from: () => ({
          leftJoin: () => ({
            leftJoin: () => ({
              where: () => ({
                groupBy: () => ({
                  orderBy: () => ({
                    limit: () => ({
                      offset: vi
                        .fn()
                        .mockResolvedValueOnce([{ id: 1, doc_groups: [] }]),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: vi.fn().mockResolvedValueOnce([{ count: 1 }]),
        }),
      }))

    const res = createMockRes()
    await fetchProjectMaterialsHandler(
      createMockReq({
        method: 'GET',
        query: {
          from: '0',
          to: '0',
          course_name: 'CS101',
          filter_key: 'readable_filename',
          filter_value: 'Doc',
          sort_column: 'created_at',
          sort_direction: 'asc',
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      final_docs: [{ id: 1, doc_groups: [] }],
      total_count: 1,
    })
  })

  it('fetchProjectMaterials returns 500 and captures posthog when db throws', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        leftJoin: () => ({
          leftJoin: () => ({
            where: () => ({
              groupBy: () => ({
                orderBy: () => ({
                  limit: () => ({
                    offset: vi.fn().mockRejectedValueOnce(new Error('boom')),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }))

    const res = createMockRes()
    await fetchProjectMaterialsHandler(
      createMockReq({
        method: 'GET',
        query: { from: '0', to: '0', course_name: 'CS101' },
      }) as any,
      res as any,
    )

    expect(hoisted.posthogCapture).toHaveBeenCalledWith(
      'fetch_materials_failed',
      expect.objectContaining({ course_name: 'CS101', error: 'boom' }),
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' })
  })
})
