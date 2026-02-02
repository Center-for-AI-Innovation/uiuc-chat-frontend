import { describe, expect, it, vi } from 'vitest'

import { useFetch } from '../useFetch'

describe('useFetch', () => {
  it('GET builds query params and returns JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const api = useFetch()
    const result = await api.get<{ ok: boolean }>('/api/test', {
      params: '?a=1',
    })

    expect(result.ok).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/test?a=1',
      expect.anything(),
    )
  })

  it('POST stringifies body and sets JSON content-type', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const api = useFetch()
    await api.post('/api/test', { body: { a: 1 } })

    const [, init] = fetchSpy.mock.calls[0] as any
    expect(init.method).toBe('post')
    expect(init.headers['Content-type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ a: 1 }))
  })

  it('POST passes FormData without JSON content-type', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const data = new FormData()
    data.append('file', new Blob(['x'], { type: 'text/plain' }), 'a.txt')

    const api = useFetch()
    await api.post('/api/test', { body: data })

    const [, init] = fetchSpy.mock.calls[0] as any
    expect(init.method).toBe('post')
    expect(init.body).toBe(data)
    expect(init.headers['Content-type']).toBeUndefined()
  })

  it('returns blob when content-disposition is attachment', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-disposition': 'attachment; filename=x.txt',
      }),
      blob: async () =>
        new Blob(['file'], { type: 'application/octet-stream' }),
    } as any)

    const api = useFetch()
    const blob = await api.get<Blob>('/api/download')
    expect(blob).toBeInstanceOf(Blob)
  })

  it('throws application/problem+json payload for non-ok responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ title: 'Bad' }), {
        status: 400,
        headers: { 'content-type': 'application/problem+json' },
      }),
    )

    const api = useFetch()
    await expect(api.get('/api/bad')).rejects.toEqual({ title: 'Bad' })
  })
})
