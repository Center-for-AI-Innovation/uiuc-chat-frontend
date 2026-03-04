import { describe, expect, it, vi } from 'vitest'
import { fetchContexts, fetchMQRContexts } from '../fetchContexts'

describe('fetchContexts (browser/jsdom)', () => {
  it('uses /api/getContexts on the client and returns data when ok', async () => {
    const data = [{ id: 1, text: 't' }]
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(data), { status: 200 }),
      )

    const result = await fetchContexts('CS101', 'query', 123, ['g1'], 'c1')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/getContexts'),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result).toEqual(data)
  })

  it('sends POST with correct body (course_name, search_query, token_limit, doc_groups, conversation_id)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))

    await fetchContexts('CS225', 'binary trees', 2000, ['lectures'], 'conv-1')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0] ?? []
    expect(init?.headers).toEqual(
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    )
    const body = JSON.parse((init?.body as string) ?? '{}')
    expect(body).toEqual({
      course_name: 'CS225',
      search_query: 'binary trees',
      token_limit: 2000,
      doc_groups: ['lectures'],
      conversation_id: 'conv-1',
    })
  })

  it('uses default token_limit (4000) and empty doc_groups when omitted', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))

    await fetchContexts('CS101', 'hello')

    const body = JSON.parse(
      (fetchSpy.mock.calls[0]?.[1] as RequestInit)?.body as string,
    )
    expect(body.token_limit).toBe(4000)
    expect(body.doc_groups).toEqual([])
  })

  it('returns [] when /api/getContexts responds not ok', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500 }),
    )

    await expect(fetchContexts('CS101', 'query')).resolves.toEqual([])
  })

  it('returns [] when fetch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'))

    await expect(fetchContexts('CS101', 'query')).resolves.toEqual([])
  })
})

describe('fetchMQRContexts', () => {
  it('calls /api/getContextsMQR with doc_groups and conversation_id', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1 }]), { status: 200 }),
      )

    await fetchMQRContexts('CS101', 'q', 6000, ['a', 'b'], 'conv')
    const calledUrl = String(fetchSpy.mock.calls[0]?.[0])
    expect(calledUrl).toContain('/api/getContextsMQR?')
    expect(calledUrl).toContain('course_name=CS101')
    expect(calledUrl).toContain('search_query=q')
    expect(calledUrl).toContain('token_limit=6000')
    expect(calledUrl).toContain('doc_groups=a')
    expect(calledUrl).toContain('doc_groups=b')
    expect(calledUrl).toContain('conversation_id=conv')
  })

  it('returns [] when /api/getContextsMQR responds not ok', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500 }),
    )

    await expect(fetchMQRContexts('CS101', 'q', 1, [], 'c')).resolves.toEqual(
      [],
    )
  })

  it('returns [] when fetch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))
    await expect(fetchMQRContexts('CS101', 'q', 1, [], 'c')).resolves.toEqual(
      [],
    )
  })
})
