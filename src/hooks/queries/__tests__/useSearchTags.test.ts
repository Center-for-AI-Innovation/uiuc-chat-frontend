import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchTagSuggestions } from '../useSearchTags'

const originalFetch = globalThis.fetch
const originalLocation = globalThis.window?.location

function withWindowOrigin(origin: string, fn: () => Promise<void> | void) {
  // useSearchTags' fetcher builds an absolute URL via window.location.origin.
  // jsdom default origin works, but pin it here so the assertions are stable.
  Object.defineProperty(globalThis.window, 'location', {
    value: { ...originalLocation, origin } as Location,
    writable: true,
  })
  return fn()
}

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalLocation) {
    Object.defineProperty(globalThis.window, 'location', {
      value: originalLocation,
      writable: true,
    })
  }
})

describe('fetchTagSuggestions', () => {
  it('passes q, category, and limit through as query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ value: 'beta', usage_count: 5 }] }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await withWindowOrigin('http://localhost', async () => {
      const result = await fetchTagSuggestions({
        q: 'be',
        category: 'general',
        limit: 5,
      })

      expect(result).toEqual([{ value: 'beta', usage_count: 5 }])

      const calledWith = fetchMock.mock.calls[0]?.[0] as string
      expect(calledWith).toContain('/api/UIUC-api/searchTags')
      expect(calledWith).toContain('q=be')
      expect(calledWith).toContain('category=general')
      expect(calledWith).toContain('limit=5')
    })
  })

  it('omits q from the URL when empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await withWindowOrigin('http://localhost', async () => {
      await fetchTagSuggestions({ q: '', category: 'general', limit: 10 })
      const calledWith = fetchMock.mock.calls[0]?.[0] as string
      expect(calledWith).not.toContain('q=')
    })
  })

  it('throws when the response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch

    await withWindowOrigin('http://localhost', async () => {
      await expect(
        fetchTagSuggestions({ q: 'a', category: 'general' }),
      ).rejects.toThrow(/500/)
    })
  })
})
