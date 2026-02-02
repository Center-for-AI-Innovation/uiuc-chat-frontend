/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

describe('fetchContextsFromBackend / server-side fetchContexts (node)', () => {
  it('fetchContextsFromBackend posts to backend and returns JSON', async () => {
    vi.stubEnv('RAILWAY_URL', 'https://backend.example/')
    const { fetchContextsFromBackend } = await import('../fetchContexts')

    const data = [{ id: 1, text: 'ctx' }] as any
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(data), { status: 200 }),
      )

    await expect(
      fetchContextsFromBackend('CS101', 'q', 4000, ['g'], 'conv'),
    ).resolves.toEqual(data)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.example/getTopContexts',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('fetchContextsFromBackend throws on non-ok response', async () => {
    vi.stubEnv('RAILWAY_URL', 'https://backend.example')
    const { fetchContextsFromBackend } = await import('../fetchContexts')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500 }),
    )

    await expect(fetchContextsFromBackend('CS101', 'q')).rejects.toThrow(
      /status: 500/i,
    )
  })

  it('fetchContexts uses backend path on the server and returns [] on errors', async () => {
    vi.stubEnv('RAILWAY_URL', 'https://backend.example')
    const { fetchContexts } = await import('../fetchContexts')

    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(fetchContexts('CS101', 'q')).resolves.toEqual([])
  })
})

