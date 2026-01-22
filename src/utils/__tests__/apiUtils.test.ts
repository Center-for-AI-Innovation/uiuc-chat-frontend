import { describe, expect, it, vi } from 'vitest'

vi.mock('uuid', () => ({ v4: () => 'test-uuid' }))

import {
  callSetCourseMetadata,
  convertConversatonToVercelAISDKv3,
  convertConversationToCoreMessagesWithoutSystem,
  createProject,
  fetchCourseMetadata,
  fetchPresignedUrl,
  getBackendUrl,
  getBaseUrl,
  uploadToS3,
} from '../apiUtils'

describe('apiUtils (browser/jsdom)', () => {
  it('getBaseUrl returns empty string in the browser', () => {
    expect(getBaseUrl()).toBe('')
  })

  it('getBackendUrl throws when RAILWAY_URL is not set', () => {
    vi.stubEnv('RAILWAY_URL', '')
    expect(() => getBackendUrl()).toThrow(/RAILWAY_URL/i)
  })

  it('getBackendUrl returns the value as-is when no trailing slash', () => {
    vi.stubEnv('RAILWAY_URL', 'https://backend.example')
    expect(getBackendUrl()).toBe('https://backend.example')
  })

  it('getBackendUrl strips a trailing slash', () => {
    vi.stubEnv('RAILWAY_URL', 'https://backend.example/')
    expect(getBackendUrl()).toBe('https://backend.example')
  })

  it('callSetCourseMetadata returns true when API returns success', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      )

    await expect(
      callSetCourseMetadata('CS101', { course_name: 'CS101' } as any),
    ).resolves.toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/UIUC-api/upsertCourseMetadata',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('callSetCourseMetadata returns false when API returns error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: 'nope' }), {
        status: 200,
      }),
    )

    await expect(
      callSetCourseMetadata('CS101', { course_name: 'CS101' } as any),
    ).resolves.toBe(false)
  })

  it('callSetCourseMetadata returns false when fetch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(
      callSetCourseMetadata('CS101', { course_name: 'CS101' } as any),
    ).resolves.toBe(false)
  })

  it('uploadToS3 returns the uploaded key', async () => {
    const fetchMock = vi.fn(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url?.toString?.()
      if (url?.includes('/api/UIUC-api/uploadToS3')) {
        return new Response(
          JSON.stringify({
            post: {
              url: 'https://s3.example/upload',
              fields: { key: 'uploads/test-uuid.txt', policy: 'p' },
            },
          }),
          { status: 200 },
        )
      }
      if (url === 'https://s3.example/upload') {
        expect(init?.method).toBe('POST')
        expect(init?.body).toBeInstanceOf(FormData)
        return new Response(null, { status: 200 })
      }
      throw new Error(`Unexpected fetch URL: ${url}`)
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as any)

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const key = await uploadToS3(file, 'user', 'course', 'document-group')
    expect(key).toBe('uploads/test-uuid.txt')
  })

  it('uploadToS3 returns undefined and logs on errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    await expect(uploadToS3(file, 'user', 'course')).resolves.toBeUndefined()
  })

  it('fetchPresignedUrl returns url when API responds ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ url: 'https://signed.example/file' }), {
        status: 200,
      }),
    )

    await expect(fetchPresignedUrl('path')).resolves.toBe(
      'https://signed.example/file',
    )
  })

  it('fetchPresignedUrl returns null when API response is not ok', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500 }),
    )

    await expect(fetchPresignedUrl('path')).resolves.toBeNull()
  })

  it('fetchCourseMetadata parses is_private when it is a string', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          course_metadata: { is_private: 'TrUe' },
        }),
        { status: 200 },
      ),
    )

    const metadata = await fetchCourseMetadata('CS101')
    expect(metadata).toEqual({ is_private: true })
  })

  it('fetchCourseMetadata throws when API says success=false', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, message: 'denied' }),
        { status: 200 },
      ),
    )

    await expect(fetchCourseMetadata('CS101')).rejects.toThrow(/denied/i)
  })

  it('fetchCourseMetadata throws when response is not ok', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'fail' }),
    )

    await expect(fetchCourseMetadata('CS101')).rejects.toThrow(/fail/i)
  })

  it('createProject returns true on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 200 }),
    )

    await expect(
      createProject('p', undefined, 'owner@example.com', false),
    ).resolves.toBe(true)
  })

  it('createProject throws an error containing status and error fields', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'bad', message: 'nope' }), {
        status: 400,
      }),
    )

    await expect(
      createProject('p', undefined, 'owner@example.com', false),
    ).rejects.toMatchObject({ status: 400, error: 'bad' })
  })

  it('createProject uses an Unknown error fallback when response json cannot be parsed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('not-json', { status: 400 }),
    )

    await expect(
      createProject('p', undefined, 'owner@example.com', false),
    ).rejects.toMatchObject({ status: 400, error: 'Unknown error' })
  })

  it('convertConversatonToVercelAISDKv3 includes the latest system and final engineered user message', () => {
    const conversation = {
      id: 'c1',
      name: 'n',
      model: { id: 'm', name: 'm', tokenLimit: 10, enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: null,
      messages: [
        {
          id: 'm1',
          role: 'system',
          content: 'ignored',
          latestSystemMessage: 'system rules',
        },
        {
          id: 'm2',
          role: 'user',
          content: 'hi',
          finalPromtEngineeredMessage: 'final hi',
        },
      ],
    } as any

    const core = convertConversatonToVercelAISDKv3(conversation)
    expect(core[0]).toEqual({ role: 'system', content: 'system rules' })
    expect(core[1]).toEqual({ role: 'user', content: 'final hi' })
  })

  it('convertConversatonToVercelAISDKv3 converts array content (text + file) and preserves non-array content', () => {
    const conversation = {
      id: 'c1',
      name: 'n',
      model: { id: 'm', name: 'm', tokenLimit: 10, enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: null,
      messages: [
        {
          id: 'm1',
          role: 'system',
          content: 'ignored',
          latestSystemMessage: 'system rules',
        },
        {
          id: 'm2',
          role: 'assistant',
          content: [
            { type: 'text', text: 'hello' },
            {
              type: 'file',
              fileName: 'a.pdf',
              fileType: 'application/pdf',
              fileSize: 1024,
            },
          ],
        },
        { id: 'm3', role: 'assistant', content: 'plain text' },
        {
          id: 'm4',
          role: 'user',
          content: 'hi',
          finalPromtEngineeredMessage: 'final hi',
        },
      ],
    } as any

    const core = convertConversatonToVercelAISDKv3(conversation)
    expect(core[0]).toEqual({ role: 'system', content: 'system rules' })
    expect(core).toEqual(
      expect.arrayContaining([
        {
          role: 'assistant',
          content: 'hello\n[File: a.pdf (application/pdf, 1KB)]',
        },
        { role: 'assistant', content: 'plain text' },
        { role: 'user', content: 'final hi' },
      ]),
    )
  })

  it('convertConversationToCoreMessagesWithoutSystem produces typed content and excludes system', () => {
    const conversation = {
      id: 'c1',
      name: 'n',
      model: { id: 'm', name: 'm', tokenLimit: 10, enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: null,
      messages: [
        {
          id: 'm1',
          role: 'system',
          content: 'ignored',
          latestSystemMessage: 'system rules',
        },
        {
          id: 'm2',
          role: 'user',
          content: [{ type: 'text', text: 'hi' }, { type: 'file', fileName: 'a.pdf', fileType: 'application/pdf', fileSize: 1024 }],
        },
      ],
    } as any

    const core = convertConversationToCoreMessagesWithoutSystem(conversation)
    expect(core).toHaveLength(1)
    expect(core[0]?.role).toBe('user')
    expect(core[0]?.content).toEqual([
      { type: 'text', text: 'hi' },
      { type: 'text', text: '[File: a.pdf (application/pdf, 1KB)]' },
    ])
  })

  it('convertConversationToCoreMessagesWithoutSystem maps image_url and unknown content types', () => {
    const conversation = {
      id: 'c1',
      name: 'n',
      model: { id: 'm', name: 'm', tokenLimit: 10, enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: null,
      messages: [
        {
          id: 'u1',
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: 'https://img.example/x.png' } },
            { type: 'unknown', extra: true },
          ],
        },
      ],
    } as any

    const core = convertConversationToCoreMessagesWithoutSystem(conversation)
    expect(core[0]?.content).toEqual([
      { type: 'image', image: 'https://img.example/x.png' },
      { type: 'unknown', extra: true },
    ])
  })

  it('convertConversationToCoreMessagesWithoutSystem uses finalPromtEngineeredMessage for the last user message', () => {
    const conversation = {
      id: 'c1',
      name: 'n',
      model: { id: 'm', name: 'm', tokenLimit: 10, enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: null,
      messages: [
        {
          id: 'u1',
          role: 'user',
          content: 'hi',
          finalPromtEngineeredMessage: 'final hi',
        },
      ],
    } as any

    const core = convertConversationToCoreMessagesWithoutSystem(conversation)
    expect(core[0]?.content).toEqual([{ type: 'text', text: 'final hi' }])
  })

  it('convertConversationToCoreMessagesWithoutSystem converts string message content to a text part', () => {
    const conversation = {
      id: 'c1',
      name: 'n',
      model: { id: 'm', name: 'm', tokenLimit: 10, enabled: true } as any,
      prompt: '',
      temperature: 0.5,
      folderId: null,
      messages: [{ id: 'a', role: 'assistant', content: 'hello' }],
    } as any

    const core = convertConversationToCoreMessagesWithoutSystem(conversation)
    expect(core[0]?.content).toEqual([{ type: 'text', text: 'hello' }])
  })
})
