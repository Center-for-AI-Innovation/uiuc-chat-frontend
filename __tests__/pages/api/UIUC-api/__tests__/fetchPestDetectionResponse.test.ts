import { describe, expect, it, vi } from 'vitest'
import { fetchPestDetectionResponse } from '~/pages/api/UIUC-api/fetchPestDetectionResponse'

describe('fetchPestDetectionResponse', () => {
  it('returns JSON when ok and throws when not ok', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(['s3://a']), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    await expect(fetchPestDetectionResponse(['http://img'])).resolves.toEqual([
      's3://a',
    ])

    fetchSpy.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    await expect(fetchPestDetectionResponse(['http://img'])).rejects.toThrow(
      /HTTP error/,
    )
    fetchSpy.mockRestore()
  })
})
