import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  })

  try {
    await redis.connect()

    // Get last sync timestamp
    const lastSync = await redis.get('calendar:lastFullSync')
    
    // Check if sync is in progress
    const syncKeys = await redis.keys('calendar:sync:*')
    const syncInProgress = syncKeys.length > 0

    // Get any recent errors
    const errorKey = await redis.get('calendar:lastError')
    
    await redis.disconnect()

    return NextResponse.json({
      lastSync: lastSync ? new Date(parseInt(lastSync)).toISOString() : null,
      syncInProgress,
      error: errorKey || null
    })
  } catch (error) {
    console.error('Failed to get sync status:', error)
    
    // Try to disconnect if connected
    try {
      await redis.disconnect()
    } catch {}

    return NextResponse.json({
      lastSync: null,
      syncInProgress: false,
      error: 'Failed to connect to sync service'
    })
  }
}