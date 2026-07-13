/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  fetchContextsViaDrizzleVectorSearch: vi.fn(),
  getBackendUrl: vi.fn(() => 'https://backend.example'),
}))

vi.mock('~/server/fetchContextsForVectorSearch', () => ({
  fetchContextsViaDrizzleVectorSearch:
    hoisted.fetchContextsViaDrizzleVectorSearch,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: hoisted.getBackendUrl,
}))

import {
  fetchContexts,
  fetchContextsByVectorEngine,
  isQdrantVectorEngine,
} from '~/utils/fetchContexts'

describe('fetchContextsByVectorEngine / VECTOR_ENGINE routing', () => {
  const originalEngine = process.env.VECTOR_ENGINE

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.VECTOR_ENGINE
  })

  afterEach(() => {
    if (originalEngine === undefined) {
      delete process.env.VECTOR_ENGINE
    } else {
      process.env.VECTOR_ENGINE = originalEngine
    }
  })

  it('isQdrantVectorEngine is false when VECTOR_ENGINE is unset', () => {
    expect(isQdrantVectorEngine()).toBe(false)
  })

  it('isQdrantVectorEngine is true only when VECTOR_ENGINE=qdrant', () => {
    process.env.VECTOR_ENGINE = 'qdrant'
    expect(isQdrantVectorEngine()).toBe(true)
  })

  it('defaults to Drizzle/pgvector when VECTOR_ENGINE is unset', async () => {
    const data = [{ id: 1 }]
    hoisted.fetchContextsViaDrizzleVectorSearch.mockResolvedValueOnce(data)

    const result = await fetchContextsByVectorEngine(
      'cardiology',
      'FAI cutoff',
      4000,
      [],
      undefined,
      100,
    )

    expect(hoisted.fetchContextsViaDrizzleVectorSearch).toHaveBeenCalledWith(
      'cardiology',
      'FAI cutoff',
      [],
      undefined,
      100,
    )
    expect(result).toEqual(data)
  })

  it('calls Qdrant backend when VECTOR_ENGINE=qdrant', async () => {
    process.env.VECTOR_ENGINE = 'qdrant'
    const data = [{ id: 2 }]
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(data), { status: 200 }),
      )

    const result = await fetchContextsByVectorEngine(
      'cardiology',
      'FAI cutoff',
      4000,
      ['g1'],
      'conv-1',
      50,
    )

    expect(hoisted.fetchContextsViaDrizzleVectorSearch).not.toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.example/getTopContexts',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result).toEqual(data)
  })

  it('server-side fetchContexts uses VECTOR_ENGINE routing (pgvector by default)', async () => {
    const data = [{ id: 3 }]
    hoisted.fetchContextsViaDrizzleVectorSearch.mockResolvedValueOnce(data)

    const result = await fetchContexts('cardiology', 'query', 4000, [], 'c1')

    expect(hoisted.fetchContextsViaDrizzleVectorSearch).toHaveBeenCalled()
    expect(result).toEqual(data)
  })
})
