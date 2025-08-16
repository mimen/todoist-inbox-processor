// Parse the Redis URL to handle TLS properly
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redisConfig = {
  url: redisUrl,
  // For Heroku Redis with self-signed certificates
  // When using rediss:// URLs, the client auto-configures TLS
  // We just need to disable certificate validation
  socket: redisUrl.startsWith('rediss://') ? {
    rejectUnauthorized: false
  } : undefined
} as const