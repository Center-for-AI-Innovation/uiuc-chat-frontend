import { describe, expect, it, vi } from 'vitest'
import { useFetch } from '../useFetch'

describe('useFetch', () => {
  it('parses JSON responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const { get } = useFetch()
    await expect(get<{ ok: boolean }>('/api/test')).resolves.toEqual({
      ok: true,
    })
  })

  it('appends params to the URL and stringifies JSON body for POST', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const { post } = useFetch()
    await expect(
      post<{ ok: boolean }>('/api/test', {
        params: '?x=1' as any,
        body: { a: 1 },
      }),
    ).resolves.toEqual({ ok: true })

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/test?x=1',
      expect.objectContaining({
        method: 'post',
        body: JSON.stringify({ a: 1 }),
        headers: { 'Content-type': 'application/json' },
      }),
    )
  })

  it('passes FormData bodies without forcing a JSON content-type', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const form = new FormData()
    form.append('file', new Blob(['x']), 'x.txt')

    const { post } = useFetch()
    await expect(
      post<{ ok: boolean }>('/api/upload', { body: form }),
    ).resolves.toEqual({ ok: true })

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/upload',
      expect.objectContaining({
        method: 'post',
        body: form,
        headers: {},
      }),
    )
  })

  it('returns a Blob for attachment downloads', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('file-bytes', {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
          'content-disposition': 'attachment; filename="x.txt"',
        },
      }),
    )

    const { get } = useFetch()
    const blob = await get<Blob>('/api/download')
    expect(typeof (blob as any).arrayBuffer).toBe('function')
    expect(typeof (blob as any).text).toBe('function')
    expect((blob as any).size).toBe(10)
    await expect(blob.text()).resolves.toBe('file-bytes')
  })

  it('returns the raw Response for non-json, non-attachment responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('<html/>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const { get } = useFetch()
    const res = await get<Response>('/api/html')
    expect(res).toBeInstanceOf(Response)
    await expect((res as any).text()).resolves.toBe('<html/>')
  })

  it('throws parsed application/problem+json errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ title: 'Bad', status: 400 }), {
        status: 400,
        headers: { 'content-type': 'application/problem+json' },
      }),
    )

    const { get } = useFetch()
    await expect(get('/api/fail')).rejects.toEqual({
      title: 'Bad',
      status: 400,
    })
  })

  it('throws the original Response for non-problem errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      }),
    )

    const { get } = useFetch()
    await expect(get('/api/fail2')).rejects.toBeInstanceOf(Response)
  })

  it('sends put/patch/delete methods', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const { put } = useFetch()
    await expect(put('/api/x', { body: { a: 1 } })).resolves.toEqual({
      ok: true,
    })

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const { patch } = useFetch()
    await expect(patch('/api/x', { body: { a: 1 } })).resolves.toEqual({
      ok: true,
    })

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const { delete: del } = useFetch()
    await expect(del('/api/x')).resolves.toEqual({ ok: true })

    expect(fetchSpy.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ method: 'put' }),
    )
    expect(fetchSpy.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ method: 'patch' }),
    )
    expect(fetchSpy.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({ method: 'delete' }),
    )
  })

  it('forwards AbortSignal to fetch', async () => {
    const controller = new AbortController()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const { get } = useFetch()
    await expect(
      get<{ ok: boolean }>('/api/abort', { signal: controller.signal }),
    ).resolves.toEqual({ ok: true })

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/abort',
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})
