/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from 'vitest'

const hoisted = vi.hoisted(() => ({
  createMock: vi.fn(),
  embeddingsCreate: vi.fn(),
}))

vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor(opts: unknown) {
      hoisted.createMock(opts)
    }
    get embeddings() {
      return { create: hoisted.embeddingsCreate }
    }
  },
}))

describe('embedQuery', () => {
  beforeEach(() => {
    vi.resetModules()
    hoisted.embeddingsCreate.mockReset()
    delete process.env.EMBEDDING_MODEL
    delete process.env.QWEN_QUERY_INSTRUCTION
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('returns embedding from API and trims newlines from query', async () => {
    const embedding = [0.1, 0.2, 0.3]
    hoisted.embeddingsCreate.mockResolvedValue({
      data: [{ embedding }],
    })

    const { embedQuery } = await import('../embedQuery')
    const result = await embedQuery('  search\nquery  ')

    expect(result).toEqual(embedding)
    expect(hoisted.embeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'text-embedding-ada-002',
        input: 'search query',
      }),
    )
  })

  it('uses EMBEDDING_MODEL and custom base when set', async () => {
    process.env.EMBEDDING_MODEL = 'text-embedding-3-small'
    process.env.EMBEDDING_API_BASE = 'https://custom.example/v1'
    hoisted.embeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.5] }],
    })

    const { embedQuery } = await import('../embedQuery')
    await embedQuery('q')

    expect(hoisted.createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        baseURL: 'https://custom.example/v1',
      }),
    )
    expect(hoisted.embeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'text-embedding-3-small' }),
    )
  })

  it('prefixes input with Qwen instruction when model includes qwen', async () => {
    process.env.EMBEDDING_MODEL = 'qwen/embedding-v1'
    process.env.QWEN_QUERY_INSTRUCTION = 'Custom instruction.'
    hoisted.embeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.1] }],
    })

    const { embedQuery } = await import('../embedQuery')
    await embedQuery('binary trees')

    expect(hoisted.embeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'Instruct: Custom instruction.\nQuery:binary trees',
      }),
    )
  })

  it('throws when API returns no embedding', async () => {
    hoisted.embeddingsCreate.mockResolvedValue({
      data: [{}],
    })

    const { embedQuery } = await import('../embedQuery')
    await expect(embedQuery('q')).rejects.toThrow(
      'No embedding returned from embedding API',
    )
  })

  it('throws when API returns empty data array', async () => {
    hoisted.embeddingsCreate.mockResolvedValue({
      data: [],
    })

    const { embedQuery } = await import('../embedQuery')
    await expect(embedQuery('q')).rejects.toThrow(
      'No embedding returned from embedding API',
    )
  })
})
