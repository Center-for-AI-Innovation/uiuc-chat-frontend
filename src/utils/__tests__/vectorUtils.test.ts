import { describe, expect, it, vi, beforeEach } from 'vitest'

const hoisted = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue(undefined)
  const mockSet = vi.fn().mockImplementation(() => ({ where: mockWhere }))
  const mockUpdate = vi.fn().mockImplementation(() => ({ set: mockSet }))
  return { mockWhere, mockSet, mockUpdate }
})

/** Re-apply db.update().set().where() chain; vitest clearMocks: true clears mock implementations. */
function restoreUpdateChain() {
  const { mockWhere, mockSet, mockUpdate } = hoisted
  mockUpdate.mockImplementation(() => ({ set: mockSet }))
  mockSet.mockImplementation(() => ({ where: mockWhere }))
  mockWhere.mockResolvedValue(undefined)
}

vi.mock('~/db/dbClient', () => ({
  db: {
    update: hoisted.mockUpdate,
  },
}))

describe('vectorUtils', () => {
  beforeEach(() => {
    restoreUpdateChain()
    vi.resetModules()
  })

  it('updates embeddings via Drizzle and returns status completed', async () => {
    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: 'https://example.com/doc',
      s3_path: 's3://bucket/key',
      doc_groups: ['g1', 'g2'],
      readable_filename: 'doc.pdf',
    } as any

    const result = await updateDocGroupsInVectorStore('CS101', doc)

    expect(result).toEqual({ status: 'completed' })
    expect(hoisted.mockUpdate).toHaveBeenCalled() // sanity: proves mock is used
    expect(hoisted.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ doc_groups: ['g1', 'g2'] }),
    )
  })

  it('sends empty url and s3_path when missing', async () => {
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

  it('captures posthog event and rethrows on error', async () => {
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

  it('reports doc_unique_identifier as doc.url when url is set and update fails', async () => {
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
