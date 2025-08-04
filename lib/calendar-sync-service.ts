import { createClient } from 'redis'
import { GoogleCalendarService, CalendarEvent } from './google-calendar-service'

interface CalendarSyncData {
  calendarId: string
  calendarName: string
  syncToken?: string
  lastSync: number
  events: CalendarEvent[]
}

export class CalendarSyncService {
  private calendarService: GoogleCalendarService
  private redis: ReturnType<typeof createClient>
  private readonly SYNC_INTERVAL = 15 * 60 * 1000 // 15 minutes
  private readonly CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds
  private syncInProgress = false
  private backgroundSyncStarted = false
  private redisConnected = false

  constructor() {
    this.calendarService = new GoogleCalendarService()
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis.on('error', (err) => {
        console.error('Redis connection error:', err)
        this.redisConnected = false
      })

      this.redis.on('connect', () => {
        console.log('Connected to Redis for calendar caching')
        this.redisConnected = true
      })

      await this.redis.connect()
      
      // Start background sync after Redis connects
      setTimeout(() => {
        this.startBackgroundSync()
      }, 2000)
      
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      this.redisConnected = false
    }
  }

  private async getCalendarFromCache(calendarId: string): Promise<CalendarSyncData | null> {
    if (!this.redisConnected) return null
    
    try {
      const data = await this.redis.get(`calendar:${calendarId}`)
      if (!data) return null
      
      const parsed = JSON.parse(data)
      // Convert date strings back to Date objects
      parsed.events = parsed.events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }))
      
      return parsed
    } catch (error) {
      console.error('Failed to get calendar from cache:', error)
      return null
    }
  }

  private async saveCalendarToCache(syncData: CalendarSyncData): Promise<void> {
    if (!this.redisConnected) return
    
    try {
      await this.redis.setEx(
        `calendar:${syncData.calendarId}`, 
        this.CACHE_TTL, 
        JSON.stringify(syncData)
      )
    } catch (error) {
      console.error('Failed to save calendar to cache:', error)
    }
  }

  private async getLastFullSync(): Promise<number> {
    if (!this.redisConnected) return 0
    
    try {
      const timestamp = await this.redis.get('calendar:lastFullSync')
      return timestamp ? parseInt(timestamp) : 0
    } catch (error) {
      console.error('Failed to get last full sync:', error)
      return 0
    }
  }

  private async setLastFullSync(timestamp: number): Promise<void> {
    if (!this.redisConnected) return
    
    try {
      await this.redis.set('calendar:lastFullSync', timestamp.toString())
    } catch (error) {
      console.error('Failed to set last full sync:', error)
    }
  }

  private async getCalendarList(): Promise<Array<{id: string, name: string, color?: string, accessRole?: string}>> {
    await this.calendarService.initialize()
    
    const calendar = (this.calendarService as any).calendar
    if (!calendar) throw new Error('Calendar service not initialized')

    const calendarList = await calendar.calendarList.list()
    const calendars = calendarList.data.items || []
    
    // Return all calendars (we'll handle rate limits with delays)
    return calendars.map(cal => ({
      id: cal.id!,
      name: cal.summary || cal.summaryOverride || 'Untitled Calendar',
      color: cal.backgroundColor,
      accessRole: cal.accessRole
    }))
  }

  private async syncCalendar(calendarInfo: {id: string, name: string, color?: string, accessRole?: string}): Promise<void> {
    const calendar = (this.calendarService as any).calendar
    if (!calendar) throw new Error('Calendar service not initialized')

    const cached = await this.getCalendarFromCache(calendarInfo.id)
    const now = Date.now()

    try {
      console.log(`Syncing calendar: ${calendarInfo.name}`)
      
      let response
      if (cached?.syncToken) {
        // Incremental sync - only get changes since last sync
        console.log(`Using incremental sync for ${calendarInfo.name}`)
        response = await calendar.events.list({
          calendarId: calendarInfo.id,
          syncToken: cached.syncToken,
          singleEvents: true
        })
      } else {
        // Full sync - get all events from the past month to 3 months in future
        console.log(`Performing full sync for ${calendarInfo.name}`)
        const timeMin = new Date()
        timeMin.setMonth(timeMin.getMonth() - 1)
        
        const timeMax = new Date()
        timeMax.setMonth(timeMax.getMonth() + 3)
        
        response = await calendar.events.list({
          calendarId: calendarInfo.id,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        })
      }

      // Process the events
      const events: CalendarEvent[] = (response.data.items || []).map(event => ({
        id: event.id!,
        calendarId: calendarInfo.id,
        calendarName: calendarInfo.name,
        title: event.summary || 'Untitled',
        start: new Date(event.start?.dateTime || event.start?.date!),
        end: new Date(event.end?.dateTime || event.end?.date!),
        color: calendarInfo.color,
        isAllDay: !event.start?.dateTime
      }))

      // Update cache
      let finalEvents: CalendarEvent[]
      
      if (cached?.syncToken) {
        // Incremental update - merge with existing events
        const existingEvents = cached.events || []
        const eventMap = new Map(existingEvents.map(e => [e.id, e]))
        
        // Apply changes from sync
        events.forEach(event => {
          if (event.title === 'Cancelled' || event.title === 'Deleted') {
            eventMap.delete(event.id)
          } else {
            eventMap.set(event.id, event)
          }
        })
        
        finalEvents = Array.from(eventMap.values())
      } else {
        // Full sync - replace all events
        finalEvents = events
      }

      // Save to Redis with metadata
      await this.saveCalendarToCache({
        calendarId: calendarInfo.id,
        calendarName: calendarInfo.name,
        syncToken: response.data.nextSyncToken,
        lastSync: now,
        events: finalEvents,
        // Store calendar metadata
        color: calendarInfo.color,
        timeZone: response.data.timeZone,
        accessRole: calendarInfo.accessRole
      })

      console.log(`✅ Synced ${finalEvents.length} events for ${calendarInfo.name}`)
      
    } catch (error: any) {
      console.error(`❌ Failed to sync calendar ${calendarInfo.name}:`, error.message)
      
      // If sync token is invalid, clear it and retry with full sync
      if (error.message?.includes('Sync token is no longer valid')) {
        console.log(`🔄 Sync token invalid for ${calendarInfo.name}, clearing and retrying`)
        if (cached) {
          // Remove the invalid sync token and retry
          await this.saveCalendarToCache({
            ...cached,
            syncToken: undefined
          })
          await this.syncCalendar(calendarInfo)
        }
      }
    }
  }

  async syncAllCalendars(fresh: boolean = false): Promise<void> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping')
      return
    }

    if (!this.redisConnected) {
      console.log('❌ Redis not connected, skipping sync')
      return
    }

    this.syncInProgress = true
    const now = Date.now()

    try {
      console.log(fresh ? '🔄 Starting fresh calendar sync...' : '🔄 Starting calendar sync...')
      
      // If fresh sync requested, clear all sync tokens first
      if (fresh) {
        console.log('🧹 Clearing all sync tokens for fresh sync...')
        const calendarKeys = await this.redis.keys('calendar:*')
        for (const key of calendarKeys) {
          if (!key.includes('lastFullSync') && !key.includes('lastError')) {
            const data = await this.redis.get(key)
            if (data) {
              try {
                const parsed = JSON.parse(data)
                parsed.syncToken = undefined
                await this.redis.set(key, JSON.stringify(parsed))
              } catch (error) {
                console.error(`Failed to clear sync token for ${key}`)
              }
            }
          }
        }
      }
      
      // Get list of calendars
      const calendars = await this.getCalendarList()
      console.log(`📅 Found ${calendars.length} calendars to sync`)
      
      // Sync each calendar with delays to avoid rate limits
      for (let i = 0; i < calendars.length; i++) {
        const cal = calendars[i]
        
        // Add delay between calendar syncs to avoid rate limits
        if (i > 0) {
          // Increase delay every 5 calendars to be extra safe with rate limits
          const delay = i % 5 === 0 ? 2000 : 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        await this.syncCalendar(cal)
      }
      
      await this.setLastFullSync(now)
      
      console.log('✅ Calendar sync completed successfully')
      
    } catch (error) {
      console.error('❌ Calendar sync failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  async getEventsForDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    // Check if we need to sync
    const now = Date.now()
    const lastFullSync = await this.getLastFullSync()
    const timeSinceLastSync = now - lastFullSync
    
    if (timeSinceLastSync > this.SYNC_INTERVAL) {
      console.log('📊 Cache is stale, triggering background sync...')
      // Don't await - let it sync in background for subsequent requests
      this.syncAllCalendars().catch(error => {
        console.error('Background sync failed:', error)
      })
    }

    // Get all calendar keys from Redis
    const allEvents: CalendarEvent[] = []
    
    if (this.redisConnected) {
      try {
        const calendarKeys = await this.redis.keys('calendar:*')
        const calendarIds = calendarKeys
          .filter(key => !key.endsWith('lastFullSync')) // Exclude metadata keys
          .map(key => key.replace('calendar:', ''))
        
        // Get all calendars from Redis
        for (const calendarId of calendarIds) {
          const syncData = await this.getCalendarFromCache(calendarId)
          if (syncData?.events) {
            const filteredEvents = syncData.events.filter(event => {
              const eventStart = new Date(event.start)
              const eventEnd = new Date(event.end)
              return eventStart <= endDate && eventEnd >= startDate
            })
            allEvents.push(...filteredEvents)
          }
        }
      } catch (error) {
        console.error('Failed to get events from Redis:', error)
      }
    }

    // Sort by start time
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    
    console.log(`📋 Returning ${allEvents.length} cached events for date range`)
    return allEvents
  }

  // Start background sync process
  startBackgroundSync(): void {
    if (this.backgroundSyncStarted) {
      console.log('🔄 Background calendar sync already started')
      return
    }

    this.backgroundSyncStarted = true
    
    // Initial sync
    this.syncAllCalendars()
    
    // Set up periodic sync
    setInterval(() => {
      this.syncAllCalendars()
    }, this.SYNC_INTERVAL)
    
    console.log('🚀 Background calendar sync started')
  }

  async isAuthorized(): Promise<boolean> {
    try {
      await this.calendarService.initialize()
      return this.calendarService.isAuthorized()
    } catch {
      return false
    }
  }

  // Cleanup method for graceful shutdown
  async cleanup(): Promise<void> {
    if (this.redisConnected) {
      await this.redis.disconnect()
      console.log('🔌 Disconnected from Redis')
    }
  }
}

// Create singleton instance
export const calendarSyncService = new CalendarSyncService()