import { describe, expect, it, vi, beforeEach } from 'vitest'

const hoisted = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue(undefined)
  const mockSet = vi.fn().mockImplementation(() => ({ where: mockWhere }))
  const mockUpdate = vi.fn().mockImplementation(() => ({ set: mockSet }))
  const mockSetPayload = vi.fn().mockResolvedValue({ ok: true })
  const mockResolveVectorEngine = vi
    .fn()
    .mockResolvedValue({ kind: 'pgvector' })
  const mockGetHostDb = vi.fn(() => ({ update: mockUpdate }))
  return {
    mockWhere,
    mockSet,
    mockUpdate,
    mockSetPayload,
    mockResolveVectorEngine,
    mockGetHostDb,
  }
})

function restoreUpdateChain() {
  const { mockWhere, mockSet, mockUpdate } = hoisted
  mockUpdate.mockImplementation(() => ({ set: mockSet }))
  mockSet.mockImplementation(() => ({ where: mockWhere }))
  mockWhere.mockResolvedValue(undefined)
}

vi.mock('~/utils/connectionManager', () => ({
  connectionManager: {
    resolveVectorEngine: hoisted.mockResolveVectorEngine,
    getHostDb: hoisted.mockGetHostDb,
  },
}))

describe('vectorUtils', () => {
  beforeEach(() => {
    restoreUpdateChain()
    hoisted.mockResolveVectorEngine.mockResolvedValue({ kind: 'pgvector' })
    hoisted.mockGetHostDb.mockReturnValue({ update: hoisted.mockUpdate })
    hoisted.mockSetPayload.mockReset()
    hoisted.mockSetPayload.mockResolvedValue({ ok: true })
  })

  it('pgvector path: updates embeddings via Drizzle and returns status completed', async () => {
    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: 'https://example.com/doc',
      s3_path: 's3://bucket/key',
      doc_groups: ['g1', 'g2'],
      readable_filename: 'doc.pdf',
    } as any

    const result = await updateDocGroupsInVectorStore('CS101', doc)

    expect(result).toEqual({ status: 'completed' })
    expect(hoisted.mockUpdate).toHaveBeenCalled()
    expect(hoisted.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ doc_groups: ['g1', 'g2'] }),
    )
  })

  it('pgvector path: handles missing url and s3_path', async () => {
    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: undefined,
      s3_path: undefined,
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    const result = await updateDocGroupsInVectorStore('CS101', doc)
    expect(result).toEqual({ status: 'completed' })
    expect(hoisted.mockUpdate).toHaveBeenCalled()
  })

  it('qdrant path: dispatches to client.setPayload when engine is qdrant', async () => {
    hoisted.mockResolveVectorEngine.mockResolvedValueOnce({
      kind: 'qdrant',
      client: { setPayload: hoisted.mockSetPayload },
      collection: 'main',
    })

    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')
    const doc = {
      url: 'https://example.com/doc',
      s3_path: 's3://bucket/key',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    const result = await updateDocGroupsInVectorStore('CS101', doc)
    expect(result).toEqual({ status: 'completed' })
    expect(hoisted.mockSetPayload).toHaveBeenCalledWith(
      'main',
      expect.objectContaining({
        payload: { doc_groups: ['g1'] },
        filter: expect.objectContaining({
          must: expect.arrayContaining([
            expect.objectContaining({ key: 'course_name' }),
            expect.objectContaining({ key: 'url' }),
            expect.objectContaining({ key: 's3_path' }),
          ]),
        }),
      }),
    )
    expect(hoisted.mockUpdate).not.toHaveBeenCalled()
  })

  it('captures posthog event and rethrows on pgvector error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    hoisted.mockWhere.mockRejectedValueOnce(new Error('boom'))

    const posthog = (await import('posthog-js')).default as any
    vi.spyOn(posthog, 'capture')

    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: '',
      s3_path: 's3://bucket/key',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await expect(updateDocGroupsInVectorStore('CS101', doc)).rejects.toThrow(
      /boom/i,
    )

    expect(posthog.capture).toHaveBeenCalledWith(
      'add_doc_group',
      expect.objectContaining({
        course_name: 'CS101',
        doc_readable_filename: 'doc.pdf',
        doc_groups: ['g1'],
        doc_unique_identifier: 's3://bucket/key',
      }),
    )
  })

  it('reports doc_unique_identifier as doc.url when set and update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    hoisted.mockWhere.mockRejectedValueOnce(new Error('db error'))

    const posthog = (await import('posthog-js')).default as any
    vi.spyOn(posthog, 'capture')

    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: 'https://example.com/page',
      s3_path: 's3://bucket/key',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await expect(updateDocGroupsInVectorStore('CS101', doc)).rejects.toThrow(
      /db error/i,
    )

    expect(posthog.capture).toHaveBeenCalledWith(
      'add_doc_group',
      expect.objectContaining({
        doc_unique_identifier: 'https://example.com/page',
      }),
    )
  })

  it('reports doc_unique_identifier as null when url and s3_path are empty and update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    hoisted.mockWhere.mockRejectedValueOnce(new Error('db error'))

    const posthog = (await import('posthog-js')).default as any
    vi.spyOn(posthog, 'capture')

    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: '',
      s3_path: '',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await expect(updateDocGroupsInVectorStore('CS101', doc)).rejects.toThrow(
      /db error/i,
    )

    expect(posthog.capture).toHaveBeenCalledWith(
      'add_doc_group',
      expect.objectContaining({
        doc_unique_identifier: null,
      }),
    )
  })
})
