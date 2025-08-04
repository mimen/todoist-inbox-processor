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
    
    for (const key of calendarKeys) {
      // Skip metadata keys
      if (key.includes('lastFullSync') || key.includes('lastError') || key.includes('sync:')) {
        continue
      }
      
      const data = await redis.get(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          calendars.push({
            calendarId: parsed.calendarId,
            calendarName: parsed.calendarName,
            events: parsed.events || []
          })
        } catch (error) {
          console.error(`Failed to parse calendar data for ${key}:`, error)
        }
      }
    }
    
    await redis.disconnect()
    
    return NextResponse.json({ calendars })
  } catch (error) {
    console.error('Failed to initialize calendar store:', error)
    
    try {
      await redis.disconnect()
    } catch {}
    
    return NextResponse.json({ calendars: [] }, { status: 500 })
  }
}