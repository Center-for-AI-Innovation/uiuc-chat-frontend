import { describe, expect, it, vi } from 'vitest'

const mockWhere = vi.fn().mockResolvedValue(undefined)
const mockSet = vi.fn().mockReturnValue({ where: mockWhere })

vi.mock('~/db/dbClient', () => ({
  db: {
    update: () => ({ set: mockSet }),
  },
}))

describe('vectorUtils', () => {
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
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        doc_groups: ['g1', 'g2'],
      }),
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
  })

  it('captures posthog event and rethrows on error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockWhere.mockRejectedValueOnce(new Error('boom'))

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
      }),
    )
  })

  it('sets doc_unique_identifier to null when url and s3_path are empty', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockWhere.mockRejectedValueOnce(new Error('err'))

    const posthog = (await import('posthog-js')).default as any
    vi.spyOn(posthog, 'capture')
    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: '',
      s3_path: '',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await expect(updateDocGroupsInVectorStore('CS101', doc)).rejects.toThrow()
    expect(posthog.capture).toHaveBeenCalledWith(
      'add_doc_group',
      expect.objectContaining({ doc_unique_identifier: null }),
    )
  })

  it('sets doc_unique_identifier to url when url is present', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockWhere.mockRejectedValueOnce(new Error('err'))

    const posthog = (await import('posthog-js')).default as any
    vi.spyOn(posthog, 'capture')
    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: 'https://example.com/doc',
      s3_path: '',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await expect(updateDocGroupsInVectorStore('CS101', doc)).rejects.toThrow()
    expect(posthog.capture).toHaveBeenCalledWith(
      'add_doc_group',
      expect.objectContaining({
        doc_unique_identifier: 'https://example.com/doc',
      }),
    )
  })
})
