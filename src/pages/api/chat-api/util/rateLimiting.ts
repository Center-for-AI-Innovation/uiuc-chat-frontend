import type { NextApiResponse } from 'next'
import { ensureRedisConnected } from '~/utils/redisClient'

// 10 requests in 10 seconds (sliding window)
const MAX_REQUESTS = 10
const WINDOW_SIZE_IN_MS = 10 * 1000

export async function checkRateLimitMiddleware(
  key: string,
  res: NextApiResponse,
) {
  const now = Date.now()
  const windowStart = now - WINDOW_SIZE_IN_MS
  const redisKey = `ratelimit:${key}`

  try {
    const redisClient = await ensureRedisConnected()

    const txn = redisClient.multi()
    txn.zRemRangeByScore(redisKey, 0, windowStart)
    txn.zCard(redisKey)
    txn.zAdd(redisKey, [
      {
        score: now,
        value: `${now}-${Math.random().toString(36).substring(2)}`,
      },
    ])
    txn.expire(redisKey, WINDOW_SIZE_IN_MS / 1000)

    const results = await txn.exec()
    const requestCount = results[1] as number
    const remaining = Math.max(0, MAX_REQUESTS - requestCount)

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString())
    res.setHeader('X-RateLimit-Remaining', remaining.toString())

    if (requestCount >= MAX_REQUESTS) {
      res.setHeader('Retry-After', (WINDOW_SIZE_IN_MS / 1000).toString())
      return true
    }
    return false
  } catch (error) {
    console.error('Rate limiting error:', error)
    return false
  }
}
