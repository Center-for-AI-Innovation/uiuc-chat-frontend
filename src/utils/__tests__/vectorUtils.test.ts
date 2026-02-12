import { describe, expect, it, vi } from 'vitest'

describe('vectorUtils', () => {
  it('calls backend update-doc-groups and returns response with status completed', async () => {
    vi.stubEnv('RAILWAY_URL', 'https://backend.example')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'completed' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    vi.resetModules()
    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: 'https://example.com/doc',
      s3_path: 's3://bucket/key',
      doc_groups: ['g1', 'g2'],
      readable_filename: 'doc.pdf',
    } as any

    const result = await updateDocGroupsInVectorStore('CS101', doc)
    expect(result).toEqual({ status: 'completed' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.example/update-doc-groups',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: 'CS101',
          s3_path: 's3://bucket/key',
          url: 'https://example.com/doc',
          doc_groups: ['g1', 'g2'],
        }),
      }),
    )
  })

  it('sends empty url and s3_path when missing', async () => {
    vi.stubEnv('RAILWAY_URL', 'https://backend.example')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'completed' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    vi.resetModules()
    const { updateDocGroupsInVectorStore } = await import('../vectorUtils')

    const doc = {
      url: undefined,
      s3_path: undefined,
      doc_groups: ['g1'],
      readable_filename: 'doc.pdf',
    } as any

    await updateDocGroupsInVectorStore('CS101', doc)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          courseName: 'CS101',
          s3_path: '',
          url: '',
          doc_groups: ['g1'],
        }),
      }),
    )
  })

  it('captures posthog event and rethrows on error', async () => {
    vi.stubEnv('RAILWAY_URL', 'https://backend.example')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, text: async () => 'boom' })
    vi.stubGlobal('fetch', fetchMock)

    vi.resetModules()
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
    vi.stubEnv('RAILWAY_URL', 'https://backend.example')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, text: async () => 'err' })
    vi.stubGlobal('fetch', fetchMock)

    vi.resetModules()
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
    vi.stubEnv('RAILWAY_URL', 'https://backend.example')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, text: async () => 'err' })
    vi.stubGlobal('fetch', fetchMock)

    vi.resetModules()
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
