export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  // For Heroku Redis with self-signed certificates
  socket: process.env.REDIS_URL?.startsWith('rediss://') ? {
    tls: true,
    rejectUnauthorized: false
  } : undefined
} as const