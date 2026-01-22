import { describe, expect, it, vi } from 'vitest'
import { fetchImageDescription } from '../fetchImageDescription'

describe('fetchImageDescription', () => {
  it('returns description on success and aborts on error', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const controller = new AbortController()
    const abortSpy = vi.spyOn(controller, 'abort')

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'desc' } }] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    await expect(
      fetchImageDescription(
        'CS101',
        { model: { id: 'gpt-4o' }, messages: [{ role: 'user', content: 'hi' }] } as any,
        { OpenAI: { models: [] } } as any,
        controller,
      ),
    ).resolves.toBe('desc')

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'bad' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    )
    await expect(
      fetchImageDescription(
        'CS101',
        { model: { id: 'gpt-4o' }, messages: [{ role: 'user', content: [] }] } as any,
        { OpenAI: { models: [] } } as any,
        controller,
      ),
    ).rejects.toThrow('bad')
    expect(abortSpy).toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})

