import { createClient } from 'redis'

export function createRedisClient() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  // For production Redis with self-signed certificates (Heroku)
  // Set NODE_TLS_REJECT_UNAUTHORIZED=0 in your Heroku config vars
  if (process.env.NODE_ENV === 'production' && redisUrl.startsWith('rediss://')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }
  
  return createClient({
    url: redisUrl
  })
}

export type RedisClientType = ReturnType<typeof createRedisClient>