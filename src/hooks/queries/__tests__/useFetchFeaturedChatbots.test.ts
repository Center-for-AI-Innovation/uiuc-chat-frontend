import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchFeaturedChatbots } from '../useFetchFeaturedChatbots'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('fetchFeaturedChatbots', () => {
  it('GETs /api/UIUC-api/getFeaturedChatbots and returns the results array', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            course_name: 'cs101',
            title: 'cs101',
            description: '',
            owner: 'a@example.com',
            collaboratorCount: 0,
          },
        ],
        total: 1,
      }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await fetchFeaturedChatbots()

    expect(fetchMock).toHaveBeenCalledWith('/api/UIUC-api/getFeaturedChatbots')
    expect(result).toHaveLength(1)
    expect(result[0]?.course_name).toBe('cs101')
  })

  it('throws when the response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as unknown as typeof fetch

    await expect(fetchFeaturedChatbots()).rejects.toThrow(/503/)
  })
})
