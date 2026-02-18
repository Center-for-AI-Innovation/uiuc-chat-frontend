import { describe, expect, it, vi } from 'vitest'

describe('initializeEncoding', () => {
  it('initializes encoding once', async () => {
    vi.resetModules()
    vi.doMock('@dqbd/tiktoken', () => ({
      Tiktoken: class MockTiktoken {},
    }))
    vi.doMock('@dqbd/tiktoken/encoders/cl100k_base.json', () => ({
      default: {
        bpe_ranks: new Map(),
        special_tokens: {},
        pat_str: '',
      },
    }))

    const mod = await import('../encoding')
    expect(mod.encoding).toBeNull()

    mod.initializeEncoding()
    expect(mod.encoding).toBeInstanceOf(mod.Tiktoken)

    const first = mod.encoding
    mod.initializeEncoding()
    expect(mod.encoding).toBe(first)
  })

  it('rethrows initialization errors', async () => {
    vi.resetModules()
    vi.doMock('@dqbd/tiktoken', () => ({
      Tiktoken: class MockTiktoken {
        constructor() {
          throw new Error('boom')
        }
      },
    }))
    vi.doMock('@dqbd/tiktoken/encoders/cl100k_base.json', () => ({
      default: {
        bpe_ranks: new Map(),
        special_tokens: {},
        pat_str: '',
      },
    }))

    const mod = await import('../encoding')
    expect(() => mod.initializeEncoding()).toThrow('boom')
  })
})
