import { describe, expect, it, vi } from 'vitest'

describe('qdrantClient', () => {
  it('constructs a QdrantClient with env url and apiKey', async () => {
    vi.stubEnv('QDRANT_URL', 'https://qdrant.example')
    vi.stubEnv('QDRANT_API_KEY', 'secret')

    const ctor = vi.fn()
    vi.doMock('@qdrant/js-client-rest', () => ({
      QdrantClient: ctor,
    }))

    vi.resetModules()
    await import('../qdrantClient')

    expect(ctor).toHaveBeenCalledWith({
      url: 'https://qdrant.example',
      apiKey: 'secret',
    })
  })
})
