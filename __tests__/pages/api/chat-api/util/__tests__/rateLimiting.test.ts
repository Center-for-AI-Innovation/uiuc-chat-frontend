/* @vitest-environment node */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { checkRateLimitMiddleware } from 'src/pages/api/chat-api/util/rateLimiting'
import type { NextApiResponse } from 'next'

// 1. Hoist our mocks so Vitest can use them before imports are resolved
const hoisted = vi.hoisted(() => {
  // Mock the Redis transaction pipeline
  const mockTxn = {
    zRemRangeByScore: vi.fn().mockReturnThis(),
    zCard: vi.fn().mockReturnThis(),
    zAdd: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  }

  return {
    mockTxn,
    mockRedisClient: {
      multi: vi.fn(() => mockTxn),
    },
    ensureRedisConnected: vi.fn(),
  }
})

// 2. Mock the module that provides the Redis connection
vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: hoisted.ensureRedisConnected,
}))

describe('checkRateLimitMiddleware', () => {
  let mockRes: Partial<NextApiResponse>

  beforeEach(() => {
    // Reset all mocks before each test to prevent test pollution
    vi.clearAllMocks()

    // Setup the mock Redis client to be returned by ensureRedisConnected
    hoisted.ensureRedisConnected.mockResolvedValue(hoisted.mockRedisClient)

    // Setup a clean mock Response object
    mockRes = {
      setHeader: vi.fn(),
    }

    // Mock Date.now to have predictable timestamps in tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns false and sets correct headers when under the rate limit', async () => {
    // Simulate zCard returning 5 (user has made 5 requests in the window)
    // The exec array returns the results of [zRemRangeByScore, zCard, zAdd, expire]
    hoisted.mockTxn.exec.mockResolvedValueOnce(['OK', 5, 'OK', 1])

    const isRateLimited = await checkRateLimitMiddleware(
      'test_api_key',
      mockRes as NextApiResponse,
    )

    // Should NOT be rate limited
    expect(isRateLimited).toBe(false)

    // Verify Redis commands were called correctly
    expect(hoisted.mockRedisClient.multi).toHaveBeenCalled()
    expect(hoisted.mockTxn.zCard).toHaveBeenCalledWith('ratelimit:test_api_key')
    expect(hoisted.mockTxn.exec).toHaveBeenCalled()

    // Verify Headers
    // Remaining should be MAX_REQUESTS (10) - zCard count (5) - current request (1) = 4
    expect(mockRes.setHeader).toHaveBeenNthCalledWith(
      1,
      'X-RateLimit-Limit',
      '10',
    )
    expect(mockRes.setHeader).toHaveBeenNthCalledWith(
      2,
      'X-RateLimit-Remaining',
      '4',
    )
    expect(mockRes.setHeader).not.toHaveBeenCalledWith(
      'Retry-After',
      expect.any(String),
    )
  })

  it('returns true and sets Retry-After header when exactly at the rate limit', async () => {
    // Simulate zCard returning 10 (user has already maxed out their requests)
    hoisted.mockTxn.exec.mockResolvedValueOnce(['OK', 10, 'OK', 1])

    const isRateLimited = await checkRateLimitMiddleware(
      'spam_api_key',
      mockRes as NextApiResponse,
    )

    // SHOULD be rate limited
    expect(isRateLimited).toBe(true)

    // Verify Headers
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10')
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0')
    // 10000ms window = 10 seconds Retry-After
    expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', '10')
  })

  it('returns true and limits remaining to 0 when significantly over the rate limit', async () => {
    // Simulate zCard returning 15 (user is spamming hard)
    hoisted.mockTxn.exec.mockResolvedValueOnce(['OK', 15, 'OK', 1])

    const isRateLimited = await checkRateLimitMiddleware(
      'spam_api_key',
      mockRes as NextApiResponse,
    )

    expect(isRateLimited).toBe(true)
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0')
  })
})
