import { describe, expect, it, vi } from 'vitest'

describe('qdrantUtils', () => {
  it('adds doc_groups payload and includes url filter when present', async () => {
    const setPayload = vi.fn().mockResolvedValue({ ok: true })
    vi.doMock('@/utils/qdrantClient', () => ({ qdrant: { setPayload } }))

    vi.resetModules()
    const { addDocumentsToDocGroupQdrant } = await import('../qdrantUtils')

    const doc = {
      url: 'https://example.com/doc',
      s3_path: 's3://bucket/key',
      doc_groups: ['g1', 'g2'],
      readable_filename: 'doc.pdf',
    } as any

    const result = await addDocumentsToDocGroupQdrant('CS101', doc)
    expect(result).toEqual({ ok: true })
    expect(setPayload).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        payload: { doc_groups: ['g1', 'g2'] },
        filter: {
          must: expect.arrayContaining([
            expect.objectContaining({
              key: 'course_name',
              match: { value: 'CS101' },
            }),
            expect.objectContaining({
              key: 'url',
              match: { value: 'https://example.com/doc' },
            }),
            expect.objectContaining({
              key: 's3_path',
              match: { value: 's3://bucket/key' },
            }),
          ]),
        },
      }),
    )
  })

  it('omits url filter when url is missing and uses empty s3_path', async () => {
    const setPayload = vi.fn().mockResolvedValue({ ok: true })
    vi.doMock('@/utils/qdrantClient', () => ({ qdrant: { setPayload } }))

    vi.resetModules()
    const { addDocumentsToDocGroupQdrant } = await import('../qdrantUtils')

    const doc = {
      url: undefined,
      s3_path: undefined,
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    const result = await addDocumentsToDocGroupQdrant('CS101', doc)
    expect(result).toEqual({ ok: true })

    const must = (setPayload.mock.calls[0]?.[1] as any)?.filter?.must as any[]
    expect(must.some((m) => m.key === 'url')).toBe(false)
    expect(must).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 's3_path',
          match: { value: '' },
        }),
      ]),
    )
  })

  it('captures posthog event and rethrows on error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const setPayload = vi.fn().mockRejectedValue(new Error('boom'))
    vi.doMock('@/utils/qdrantClient', () => ({ qdrant: { setPayload } }))

    vi.resetModules()
    const posthog = (await import('posthog-js')).default as any
    const { addDocumentsToDocGroupQdrant } = await import('../qdrantUtils')

    const doc = {
      url: '',
      s3_path: 's3://bucket/key',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await expect(addDocumentsToDocGroupQdrant('CS101', doc)).rejects.toThrow(
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
    const setPayload = vi.fn().mockRejectedValue(new Error('boom'))
    vi.doMock('@/utils/qdrantClient', () => ({ qdrant: { setPayload } }))

    vi.resetModules()
    const posthog = (await import('posthog-js')).default as any
    const { addDocumentsToDocGroupQdrant } = await import('../qdrantUtils')

    const doc = {
      url: '',
      s3_path: '',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await expect(addDocumentsToDocGroupQdrant('CS101', doc)).rejects.toThrow(
      /boom/i,
    )
    expect(posthog.capture).toHaveBeenCalledWith(
      'add_doc_group',
      expect.objectContaining({ doc_unique_identifier: null }),
    )
  })

  it('sets doc_unique_identifier to url when url is present', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const setPayload = vi.fn().mockRejectedValue(new Error('boom'))
    vi.doMock('@/utils/qdrantClient', () => ({ qdrant: { setPayload } }))

    vi.resetModules()
    const posthog = (await import('posthog-js')).default as any
    const { addDocumentsToDocGroupQdrant } = await import('../qdrantUtils')

    const doc = {
      url: 'https://example.com/doc',
      s3_path: '',
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await expect(addDocumentsToDocGroupQdrant('CS101', doc)).rejects.toThrow(
      /boom/i,
    )
    expect(posthog.capture).toHaveBeenCalledWith(
      'add_doc_group',
      expect.objectContaining({
        doc_unique_identifier: 'https://example.com/doc',
      }),
    )
  })
})
