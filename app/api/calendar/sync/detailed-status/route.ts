import { NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function GET() {
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  })

  try {
    await redis.connect()

    // Get all calendar keys
    const calendarKeys = await redis.keys('calendar:*')
    const calendars: any[] = []
    let totalEvents = 0

    // Process each calendar
    for (const key of calendarKeys) {
      // Skip metadata keys
      if (key.includes('lastFullSync') || key.includes('lastError') || key.includes('sync:')) {
        continue
      }

      try {
        const data = await redis.get(key)
        if (data) {
          const parsed = JSON.parse(data)
          
          // Count events
          const eventCount = parsed.events?.length || 0
          totalEvents += eventCount

          calendars.push({
            calendarId: parsed.calendarId,
            calendarName: parsed.calendarName,
            eventCount,
            syncToken: parsed.syncToken,
            lastSync: parsed.lastSync ? new Date(parsed.lastSync).toISOString() : null,
            lastFullSync: parsed.lastFullSync ? new Date(parsed.lastFullSync).toISOString() : null,
            metadata: {
              color: parsed.color,
              timeZone: parsed.timeZone,
              accessRole: parsed.accessRole
            }
          })
        }
      } catch (error) {
        console.error(`Failed to parse calendar data for ${key}:`, error)
      }
    }

    // Get global sync status
    const lastFullSync = await redis.get('calendar:lastFullSync')
    const syncInProgress = (await redis.keys('calendar:sync:*')).length > 0

    await redis.disconnect()

    // Sort calendars by name
    calendars.sort((a, b) => a.calendarName.localeCompare(b.calendarName))

    return NextResponse.json({
      calendars,
      totalCalendars: calendars.length,
      totalEvents,
      lastFullSync: lastFullSync ? new Date(parseInt(lastFullSync)).toISOString() : null,
      syncInProgress
    })
  } catch (error) {
    console.error('Failed to get detailed sync status:', error)
    
    // Try to disconnect if connected
    try {
      await redis.disconnect()
    } catch {}

    return NextResponse.json({
      error: 'Failed to get sync status',
      calendars: [],
      totalCalendars: 0,
      totalEvents: 0,
      lastFullSync: null,
      syncInProgress: false
    }, { status: 500 })
  }
}