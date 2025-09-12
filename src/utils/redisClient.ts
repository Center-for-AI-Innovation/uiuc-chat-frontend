import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL!,
  socket: {
    reconnectStrategy: false, // stop retry loop
  },
})

// log errors but not infinite spam
let logged = false
redisClient.on('error', (err) => {
  if (!logged) {
    console.error('Redis client error:', err.message)
    logged = true
  }
})

export async function ensureRedisConnected() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
  return redisClient
}
