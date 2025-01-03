import { createClient } from 'redis'

// Create a Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL!,
  // password: process.env.REDIS_PASSWORD,
})

// Connect to the Redis server
redisClient
  .connect()
  .then(() => {
    // console.log('Connected to Redis')
  })
  .catch((err) => {
    console.error('Redis connection error:', err)
  })
