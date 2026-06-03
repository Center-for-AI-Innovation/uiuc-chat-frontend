/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

describe('projectConnections/tester — SSRF guard', () => {
  it('rejects qdrant URL with a metadata IP without making an outbound call', async () => {
    // Prevent any real network attempt.
    const QdrantClientCtor = vi.fn(() => ({
      getCollections: vi.fn(async () => {
        throw new Error('should not be called')
      }),
    }))
    vi.doMock('@qdrant/js-client-rest', () => ({
      QdrantClient: QdrantClientCtor,
    }))

    const { testQdrant } = await import('../tester')
    const result = await testQdrant({
      url: 'https://169.254.169.254',
      api_key: 'k',
      port: 443,
      default_collection: 'c',
    })
    expect(result.ok).toBe(false)
    expect(result.code).toBe('network')
    expect(QdrantClientCtor).not.toHaveBeenCalled()
  })

  it('rejects RFC1918 IPs', async () => {
    const { testQdrant } = await import('../tester')
    const result = await testQdrant({
      url: 'https://10.0.0.5',
      api_key: 'k',
      port: 6333,
      default_collection: 'c',
    })
    expect(result.ok).toBe(false)
    expect(result.code).toBe('network')
  })

  it('accepts qdrant url=http (URL scheme is authoritative, no `https` flag)', async () => {
    // cropwizard-1.5's stored record is `url: http://ec2-…, port: 6333`.
    // The URL's scheme drives the connection — there's no `https` flag to
    // disagree with — and the test probe must succeed against plain HTTP.
    // Uses a public IP literal so `assertPublicHost` skips DNS resolution.
    let constructedWith: { url?: string } | undefined
    const QdrantClientCtor = vi.fn((opts: { url?: string }) => {
      constructedWith = opts
      return {
        getCollections: vi.fn(async () => ({ collections: [] })),
      }
    })
    // Reset modules so the dynamic import re-evaluates `tester.ts` against
    // our freshly-doMocked Qdrant client (earlier tests in this file install
    // their own mocks of the same module).
    vi.resetModules()
    vi.doMock('@qdrant/js-client-rest', () => ({
      QdrantClient: QdrantClientCtor,
    }))

    const { testQdrant } = await import('../tester')
    const result = await testQdrant({
      url: 'http://93.184.216.34',
      api_key: 'k',
      port: 6333,
      default_collection: 'c',
    })

    expect(QdrantClientCtor).toHaveBeenCalledTimes(1)
    // URL scheme stays http; port grafted on because URL has none.
    expect(constructedWith?.url).toBe('http://93.184.216.34:6333')
    expect(result).toEqual({ ok: true })
  })

  it('rejects localhost', async () => {
    const { testQdrant } = await import('../tester')
    const result = await testQdrant({
      url: 'https://localhost',
      api_key: 'k',
      port: 6333,
      default_collection: 'c',
    })
    expect(result.ok).toBe(false)
    expect(result.code).toBe('network')
  })

  it('rejects IPv4-mapped IPv6 pointing at a private address', async () => {
    const { testQdrant } = await import('../tester')
    const result = await testQdrant({
      url: 'https://[::ffff:169.254.169.254]',
      api_key: 'k',
      port: 443,
      default_collection: 'c',
    })
    expect(result.ok).toBe(false)
    expect(result.code).toBe('network')
  })

  it('rejects IPv4-mapped IPv6 with embedded RFC1918 address', async () => {
    const { testQdrant } = await import('../tester')
    const result = await testQdrant({
      url: 'https://[::ffff:10.0.0.5]',
      api_key: 'k',
      port: 6333,
      default_collection: 'c',
    })
    expect(result.ok).toBe(false)
    expect(result.code).toBe('network')
  })

  it('database probe rejects loopback', async () => {
    const { testDatabase } = await import('../tester')
    const result = await testDatabase({
      connection_uri: 'postgres://u:p@127.0.0.1:5432/db',
    })
    expect(result.ok).toBe(false)
    expect(result.code).toBe('network')
  })
})
