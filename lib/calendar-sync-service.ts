import { createRedisClient, RedisClientType } from './redis-client'
import { GoogleCalendarService, CalendarEvent } from './google-calendar-service'
import { redisConfig } from './config/redis'

interface CalendarSyncData {
  calendarId: string
  calendarName: string
  syncToken?: string
  lastSync: number
  events: CalendarEvent[]
}

export class CalendarSyncService {
  private calendarService: GoogleCalendarService
  private redis: RedisClientType
  private readonly DEFAULT_SYNC_INTERVAL = 15 * 60 * 1000 // 15 minutes
  private syncInterval = this.DEFAULT_SYNC_INTERVAL
  private readonly CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds
  private syncInProgress = false
  private backgroundSyncStarted = false
  private redisConnected = false
  private lastSyncAttempt = 0
  private syncIntervalId: NodeJS.Timeout | null = null

  constructor() {
    this.calendarService = new GoogleCalendarService()
    this.redis = createRedisClient()
    
    console.log(`🔧 CalendarSyncService initialized with default interval: ${this.DEFAULT_SYNC_INTERVAL / 1000}s`)
    
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
    return calendars.map((cal: any) => ({
      id: cal.id!,
      name: cal.summary || cal.summaryOverride || 'Untitled Calendar',
      color: cal.backgroundColor,
      accessRole: cal.accessRole
    }))
  }

  private async syncCalendar(calendarInfo: {id: string, name: string, color?: string, accessRole?: string}, forceSync: boolean = false): Promise<void> {
    const calendar = (this.calendarService as any).calendar
    if (!calendar) throw new Error('Calendar service not initialized')

    const cached = await this.getCalendarFromCache(calendarInfo.id)
    const now = Date.now()
    
    // Check if we should skip this sync
    if (!forceSync && cached?.lastSync) {
      const timeSinceLastSync = now - cached.lastSync
      if (timeSinceLastSync < this.syncInterval) {
        console.log(`⏭️ Skipping ${calendarInfo.name} - synced ${Math.floor(timeSinceLastSync / 60000)}m ago (interval: ${Math.floor(this.syncInterval / 60000)}m)`)
        return
      }
    }
    
    console.log(`\n📅 Syncing calendar: ${calendarInfo.name}`)
    if (cached) {
      console.log(`  Cache found - Last sync: ${new Date(cached.lastSync || 0).toLocaleString()}`)
      console.log(`  Sync token present: ${!!cached.syncToken} ${cached.syncToken ? `(${cached.syncToken.substring(0, 20)}...)` : ''}`)
    } else {
      console.log(`  No cache found - will perform full sync`)
    }

    try {
      
      let response
      if (cached?.syncToken) {
        // Incremental sync - only get changes since last sync
        console.log(`Using incremental sync for ${calendarInfo.name} with token: ${cached.syncToken.substring(0, 20)}...`)
        try {
          response = await calendar.events.list({
            calendarId: calendarInfo.id,
            syncToken: cached.syncToken
            // Note: Cannot use singleEvents with syncToken
          })
          console.log(`Incremental sync returned ${response.data.items?.length || 0} changes`)
        } catch (syncError: any) {
          if (syncError.message?.includes('Sync token is no longer valid') || 
              syncError.code === 410) {
            console.log(`Sync token invalid for ${calendarInfo.name}, falling back to full sync`)
            cached.syncToken = undefined
            // Recursive call will now do full sync
            return this.syncCalendar(calendarInfo)
          }
          throw syncError
        }
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
        
        // After getting events, do a separate request to get sync token
        // This is needed because singleEvents=true prevents getting a sync token
        console.log(`  Getting sync token for ${calendarInfo.name}...`)
        
        // We need to page through all results to get the sync token
        let pageToken: string | undefined = undefined
        let syncToken: string | undefined = undefined
        let pageCount = 0
        
        do {
          const syncTokenResponse: any = await calendar.events.list({
            calendarId: calendarInfo.id,
            // Note: No singleEvents and no time filters - this is required to get a sync token
            maxResults: 250, // Max allowed per page
            pageToken: pageToken
          })
          
          pageCount++
          pageToken = syncTokenResponse.data.nextPageToken
          
          // Sync token is only available when we've fetched all pages
          if (!pageToken && syncTokenResponse.data.nextSyncToken) {
            syncToken = syncTokenResponse.data.nextSyncToken
            console.log(`  Got sync token after ${pageCount} page(s): ${syncToken?.substring(0, 20)}...`)
          }
        } while (pageToken && pageCount < 20) // Safety limit
        
        // Use the sync token from the paginated requests
        if (syncToken) {
          response.data.nextSyncToken = syncToken
        } else {
          console.log(`  Warning: No sync token received after ${pageCount} pages`)
        }
      }

      // Process the events
      const events: CalendarEvent[] = (response.data.items || [])
        .filter((event: any) => {
          // Filter out events without proper start/end times
          return event.start && (event.start.dateTime || event.start.date) &&
                 event.end && (event.end.dateTime || event.end.date)
        })
        .map((event: any) => ({
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
      const syncData = {
        calendarId: calendarInfo.id,
        calendarName: calendarInfo.name,
        syncToken: response.data.nextSyncToken,
        lastSync: now,
        events: finalEvents,
        // Store calendar metadata
        color: calendarInfo.color,
        timeZone: response.data.timeZone,
        accessRole: calendarInfo.accessRole
      }
      
      await this.saveCalendarToCache(syncData)

      console.log(`✅ Synced ${finalEvents.length} events for ${calendarInfo.name}`)
      if (response.data.nextSyncToken) {
        console.log(`📌 Stored sync token: ${response.data.nextSyncToken.substring(0, 20)}...`)
      } else {
        console.log(`⚠️ No sync token received for ${calendarInfo.name}`)
      }
      
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
      // Log stack trace to debug rapid calls
      console.trace('Sync called from:')
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
        
        await this.syncCalendar(cal, fresh) // Pass fresh flag to force sync if needed
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
    
    // Log how often this is being called
    console.log(`📅 getEventsForDateRange called - last sync: ${Math.floor(timeSinceLastSync / 1000)}s ago`)
    
    // Only attempt sync if enough time has passed since last attempt (debounce)
    if (timeSinceLastSync > this.syncInterval && (now - this.lastSyncAttempt) > 60000) {
      this.lastSyncAttempt = now
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
      console.log('🔄 Background sync already started, not starting again')
      return
    }

    this.backgroundSyncStarted = true
    console.log(`🚀 Starting background calendar sync with interval: ${this.syncInterval / 1000}s`)
    
    // Initial sync
    this.syncAllCalendars()
    
    // Clear any existing interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId)
    }
    
    // Set up periodic sync
    const intervalMs = Math.max(this.syncInterval, 60000) // Minimum 1 minute
    console.log(`⏱️ Setting up periodic sync every ${intervalMs / 1000}s`)
    this.syncIntervalId = setInterval(() => {
      console.log('⏰ Periodic sync triggered')
      this.syncAllCalendars()
    }, intervalMs)
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
  // Get current sync interval in minutes
  getSyncInterval(): number {
    return Math.floor(this.syncInterval / 60000)
  }

  // Set sync interval in minutes
  setSyncInterval(minutes: number): void {
    this.syncInterval = Math.max(1, minutes) * 60 * 1000 // Minimum 1 minute
    console.log(`📅 Sync interval updated to ${minutes} minutes`)
    
    // Restart background sync with new interval if it's running
    if (this.backgroundSyncStarted && this.syncIntervalId) {
      clearInterval(this.syncIntervalId)
      this.syncIntervalId = setInterval(() => {
        this.syncAllCalendars()
      }, this.syncInterval)
    }
  }

  async cleanup(): Promise<void> {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId)
      this.syncIntervalId = null
    }
    
    if (this.redisConnected) {
      await this.redis.disconnect()
      console.log('🔌 Disconnected from Redis')
    }
  }
}

// Create singleton instance
export const calendarSyncService = new CalendarSyncService()