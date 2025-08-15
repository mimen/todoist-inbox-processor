import { createClient } from 'redis'
import { redisConfig } from './config/redis'

export function createRedisClient() {
  const config: Parameters<typeof createClient>[0] = {
    url: redisConfig.url
  }
  
  // Add socket config if present
  if (redisConfig.socket) {
    config.socket = redisConfig.socket as any
  }
  
  return createClient(config)
}

export type RedisClientType = ReturnType<typeof createRedisClient>