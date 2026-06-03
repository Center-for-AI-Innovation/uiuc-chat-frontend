/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getEmbeddingClient: vi.fn(),
  embeddingsCreate: vi.fn(),
}))

vi.mock('~/utils/connectionManager', () => ({
  connectionManager: {
    getEmbeddingClient: hoisted.getEmbeddingClient,
  },
}))

const makeOpenAIClient = () => ({
  embeddings: { create: hoisted.embeddingsCreate },
})

describe('embedQuery — openai branch', () => {
  beforeEach(() => {
    vi.resetModules()
    hoisted.getEmbeddingClient.mockReset()
    hoisted.embeddingsCreate.mockReset()
  })

  it('passes the resolved model + trims whitespace + newlines', async () => {
    hoisted.getEmbeddingClient.mockResolvedValue({
      kind: 'openai',
      client: makeOpenAIClient(),
      model: 'text-embedding-3-small',
      applyQwenInstruction: false,
      queryInstruction: '',
    })
    hoisted.embeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
    })

    const { embedQuery } = await import('../embedQuery')
    const result = await embedQuery('  search\nquery  ', 'cs101')

    expect(result).toEqual([0.1, 0.2, 0.3])
    expect(hoisted.getEmbeddingClient).toHaveBeenCalledWith('cs101')
    expect(hoisted.embeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'text-embedding-3-small',
        input: 'search query',
      }),
    )
  })

  it('applies Qwen Instruct prefix when applyQwenInstruction is true', async () => {
    hoisted.getEmbeddingClient.mockResolvedValue({
      kind: 'openai',
      client: makeOpenAIClient(),
      model: 'qwen/embedding-v1',
      applyQwenInstruction: true,
      queryInstruction: 'Custom instruction.',
    })
    hoisted.embeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.1] }],
    })

    const { embedQuery } = await import('../embedQuery')
    await embedQuery('binary trees', 'cs101')

    expect(hoisted.embeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'Instruct: Custom instruction.\nQuery:binary trees',
      }),
    )
  })

  it('throws when API returns no embedding', async () => {
    hoisted.getEmbeddingClient.mockResolvedValue({
      kind: 'openai',
      client: makeOpenAIClient(),
      model: 'm',
      applyQwenInstruction: false,
      queryInstruction: '',
    })
    hoisted.embeddingsCreate.mockResolvedValue({ data: [{}] })
    const { embedQuery } = await import('../embedQuery')
    await expect(embedQuery('q', 'cs101')).rejects.toThrow(
      'No embedding returned from embedding API',
    )
  })

  it('throws when API returns empty data array', async () => {
    hoisted.getEmbeddingClient.mockResolvedValue({
      kind: 'openai',
      client: makeOpenAIClient(),
      model: 'm',
      applyQwenInstruction: false,
      queryInstruction: '',
    })
    hoisted.embeddingsCreate.mockResolvedValue({ data: [] })
    const { embedQuery } = await import('../embedQuery')
    await expect(embedQuery('q', 'cs101')).rejects.toThrow(
      'No embedding returned from embedding API',
    )
  })
})

describe('embedQuery — ollama branch', () => {
  beforeEach(() => {
    vi.resetModules()
    hoisted.getEmbeddingClient.mockReset()
  })

  it('POSTs {model, prompt} to ${baseUrl}/api/embeddings and returns body.embedding', async () => {
    hoisted.getEmbeddingClient.mockResolvedValue({
      kind: 'ollama',
      baseUrl: 'http://ollama.example.com:11434',
      model: 'nomic-embed-text',
    })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ embedding: [0.9, 0.8] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { embedQuery } = await import('../embedQuery')
    const result = await embedQuery('hello', 'cs101')

    expect(result).toEqual([0.9, 0.8])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('http://ollama.example.com:11434/api/embeddings')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({
      model: 'nomic-embed-text',
      prompt: 'hello',
    })
    vi.unstubAllGlobals()
  })

  it('strips a trailing slash on baseUrl before appending /api/embeddings', async () => {
    hoisted.getEmbeddingClient.mockResolvedValue({
      kind: 'ollama',
      baseUrl: 'http://ollama.example.com/',
      model: 'm',
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ embedding: [0] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { embedQuery } = await import('../embedQuery')
    await embedQuery('q', 'cs101')
    expect(fetchMock.mock.calls[0]![0]).toBe(
      'http://ollama.example.com/api/embeddings',
    )
    vi.unstubAllGlobals()
  })

  it('throws when Ollama returns non-200', async () => {
    hoisted.getEmbeddingClient.mockResolvedValue({
      kind: 'ollama',
      baseUrl: 'http://o',
      model: 'm',
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { embedQuery } = await import('../embedQuery')
    await expect(embedQuery('q', 'cs101')).rejects.toThrow(/HTTP 500/)
    vi.unstubAllGlobals()
  })

  it('throws when Ollama response lacks an embedding array', async () => {
    hoisted.getEmbeddingClient.mockResolvedValue({
      kind: 'ollama',
      baseUrl: 'http://o',
      model: 'm',
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { embedQuery } = await import('../embedQuery')
    await expect(embedQuery('q', 'cs101')).rejects.toThrow(
      /missing `embedding` array/,
    )
    vi.unstubAllGlobals()
  })
})
