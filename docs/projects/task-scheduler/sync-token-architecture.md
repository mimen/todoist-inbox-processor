# Sync Token Architecture for Calendar & Task Management

## Overview

This document outlines the sync token architecture for efficiently synchronizing calendar events (and eventually Todoist tasks) using incremental sync APIs. The architecture minimizes API calls, reduces latency, and provides a scalable foundation for real-time synchronization.

## Core Concepts

### What are Sync Tokens?

Sync tokens are opaque strings provided by APIs (Google Calendar, Todoist) that represent a specific point in the synchronization timeline. They enable:

- **Incremental Updates**: Only fetch changes since the last sync
- **Efficiency**: Reduce API calls by ~95% after initial sync
- **Consistency**: Ensure no events are missed between syncs
- **Scalability**: Handle large datasets without re-fetching everything

### Sync Token Flow

```
Initial Sync (No Token)
├── Request: GET /calendars/{id}/events
├── Response: Full event list + nextSyncToken
└── Store: Save all events + token to Redis

Incremental Sync (With Token)
├── Request: GET /calendars/{id}/events?syncToken={token}
├── Response: Only changed events + new nextSyncToken
└── Update: Merge changes + update token in Redis
```

## Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │  App Component │  │ Sync Status UI  │  │ Event Store │  │
│  │  (Page Load)   │  │   (Display)     │  │  (Memory)   │  │
│  └───────┬────────┘  └────────▲────────┘  └──────▲──────┘  │
│          │                    │                    │         │
└──────────┼────────────────────┼────────────────────┼─────────┘
           │                    │                    │
           ▼                    │                    │
┌──────────────────────────────┼────────────────────┼─────────┐
│         Next.js API Routes    │                    │         │
│  ┌────────────────┐  ┌───────┴────────┐  ┌───────┴──────┐  │
│  │ /api/calendar/ │  │ /api/calendar/ │  │/api/calendar/│  │
│  │     /sync      │  │    /status     │  │   /events    │  │
│  └───────┬────────┘  └────────────────┘  └──────────────┘  │
│          │                                                   │
└──────────┼───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Sync Service   │  │ Redis Store  │  │ Google Calendar│ │
│  │ (Orchestrator)  │  │ (Persistence)│  │     API       │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Models

#### Redis Storage Schema

```typescript
// Calendar sync data stored per calendar
interface CalendarSyncData {
  calendarId: string
  calendarName: string
  syncToken?: string              // Undefined for first sync
  lastSync: number                // Timestamp
  lastFullSync: number            // Timestamp of last full sync
  events: CalendarEvent[]         // All events for this calendar
  metadata: {
    color?: string
    timeZone: string
    accessRole: string
  }
}

// Global sync state
interface GlobalSyncState {
  lastSyncAttempt: number
  lastSuccessfulSync: number
  syncInProgress: boolean
  calendars: string[]             // List of calendar IDs being synced
  errors: SyncError[]
}

// Event structure in Redis
interface CalendarEvent {
  id: string
  calendarId: string
  calendarName: string
  title: string
  start: string                   // ISO string
  end: string                     // ISO string
  color?: string
  isAllDay: boolean
  // Sync metadata
  _syncAction?: 'created' | 'updated' | 'deleted'
  _syncTimestamp?: number
}
```

### Sync Token Management

#### Token Lifecycle

1. **Initial Sync** (No Token)
   ```typescript
   async function performInitialSync(calendarId: string) {
     // Request all events within date range
     const response = await googleCalendar.events.list({
       calendarId,
       timeMin: oneMonthAgo,
       timeMax: threeMonthsAhead,
       singleEvents: true,
       orderBy: 'startTime'
     })
     
     // Store events and token
     await redis.set(`calendar:${calendarId}`, {
       events: response.data.items,
       syncToken: response.data.nextSyncToken,
       lastSync: Date.now()
     })
   }
   ```

2. **Incremental Sync** (With Token)
   ```typescript
   async function performIncrementalSync(calendarId: string, syncToken: string) {
     try {
       const response = await googleCalendar.events.list({
         calendarId,
         syncToken,
         singleEvents: true
       })
       
       // Process changes
       await processEventChanges(calendarId, response.data.items)
       
       // Update sync token
       await updateSyncToken(calendarId, response.data.nextSyncToken)
     } catch (error) {
       if (error.message.includes('Sync token is no longer valid')) {
         // Token expired, perform full sync
         await performInitialSync(calendarId)
       }
     }
   }
   ```

3. **Token Invalidation Handling**
   ```typescript
   // Reasons for token invalidation:
   // 1. Token expired (>14 days old)
   // 2. Calendar permissions changed
   // 3. Too many events changed
   // 4. API version changes
   
   async function handleInvalidToken(calendarId: string) {
     // Clear invalid token
     await redis.hset(`calendar:${calendarId}`, 'syncToken', '')
     
     // Trigger full resync
     await performInitialSync(calendarId)
   }
   ```

### Event Processing Logic

#### Merging Changes

```typescript
function processEventChanges(
  existingEvents: CalendarEvent[],
  changes: GoogleCalendarEvent[]
): CalendarEvent[] {
  const eventMap = new Map(existingEvents.map(e => [e.id, e]))
  
  for (const change of changes) {
    if (change.status === 'cancelled') {
      // Event was deleted
      eventMap.delete(change.id)
    } else {
      // Event was created or updated
      eventMap.set(change.id, transformGoogleEvent(change))
    }
  }
  
  return Array.from(eventMap.values())
}
```

#### Conflict Resolution

```typescript
// Handle concurrent modifications
interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'prompt-user'
  
  resolve(local: CalendarEvent, remote: CalendarEvent): CalendarEvent {
    switch (this.strategy) {
      case 'last-write-wins':
        return remote // Google Calendar is source of truth
      
      case 'merge':
        // Merge non-conflicting fields
        return {
          ...local,
          ...remote,
          _merged: true,
          _mergedAt: Date.now()
        }
      
      case 'prompt-user':
        // Queue for user resolution
        throw new ConflictError(local, remote)
    }
  }
}
```

## Implementation Plan

### Phase 1: Calendar Sync Foundation (Current)

1. **Background Sync Service**
   ```typescript
   class CalendarSyncService {
     private syncInterval = 15 * 60 * 1000 // 15 minutes
     
     async startBackgroundSync() {
       // Initial sync on startup
       await this.syncAllCalendars()
       
       // Periodic sync
       setInterval(() => this.syncAllCalendars(), this.syncInterval)
     }
     
     async syncAllCalendars() {
       const calendars = await this.getCalendarList()
       
       for (const calendar of calendars) {
         await this.syncCalendar(calendar)
         // Stagger to avoid rate limits
         await delay(800)
       }
     }
   }
   ```

2. **Sync Status UI Component**
   ```typescript
   interface SyncStatusProps {
     lastSync: Date | null
     syncInProgress: boolean
     error: string | null
   }
   
   function SyncStatus({ lastSync, syncInProgress, error }: SyncStatusProps) {
     return (
       <div className="flex items-center gap-2 text-sm">
         {syncInProgress ? (
           <Spinner className="w-4 h-4" />
         ) : (
           <CheckCircle className="w-4 h-4 text-green-500" />
         )}
         
         <span>
           {syncInProgress 
             ? 'Syncing...' 
             : lastSync 
               ? `Last sync: ${formatRelativeTime(lastSync)}`
               : 'Not synced'
           }
         </span>
         
         {error && (
           <span className="text-red-500">Sync failed</span>
         )}
       </div>
     )
   }
   ```

3. **Global Event Store**
   ```typescript
   // In-memory store for fast access
   class EventStore {
     private events = new Map<string, CalendarEvent[]>()
     private subscribers = new Set<() => void>()
     
     async initialize() {
       // Load from Redis on app start
       const calendars = await redis.keys('calendar:*')
       
       for (const key of calendars) {
         const data = await redis.hgetall(key)
         if (data.events) {
           this.events.set(data.calendarId, JSON.parse(data.events))
         }
       }
       
       // Subscribe to Redis updates
       this.subscribeToUpdates()
     }
     
     getEvents(startDate: Date, endDate: Date): CalendarEvent[] {
       const allEvents: CalendarEvent[] = []
       
       for (const [_, events] of this.events) {
         const filtered = events.filter(event => {
           const eventStart = new Date(event.start)
           const eventEnd = new Date(event.end)
           return eventStart <= endDate && eventEnd >= startDate
         })
         allEvents.push(...filtered)
       }
       
       return allEvents.sort((a, b) => 
         new Date(a.start).getTime() - new Date(b.start).getTime()
       )
     }
     
     subscribe(callback: () => void) {
       this.subscribers.add(callback)
       return () => this.subscribers.delete(callback)
     }
     
     private notifySubscribers() {
       this.subscribers.forEach(callback => callback())
     }
   }
   ```

### Phase 2: Enhanced Features

1. **Real-time Updates via WebSocket**
   ```typescript
   // Server-sent events for sync status
   app.get('/api/calendar/sync-stream', (req, res) => {
     res.writeHead(200, {
       'Content-Type': 'text/event-stream',
       'Cache-Control': 'no-cache',
       'Connection': 'keep-alive'
     })
     
     const subscription = syncService.subscribe((status) => {
       res.write(`data: ${JSON.stringify(status)}\n\n`)
     })
     
     req.on('close', () => subscription.unsubscribe())
   })
   ```

2. **Differential Sync for Large Changes**
   ```typescript
   // When many events change, use differential sync
   interface DifferentialSync {
     async sync(calendarId: string, syncToken: string) {
       const changes = await this.fetchChanges(syncToken)
       
       if (changes.length > 100) {
         // Too many changes, fetch date ranges instead
         return this.syncByDateRange(calendarId)
       }
       
       return this.applyChanges(changes)
     }
   }
   ```

### Phase 3: Todoist Sync Integration

1. **Todoist Sync API Adapter**
   ```typescript
   interface TodoistSyncAdapter {
     async performSync(syncToken?: string): Promise<{
       items: TodoistTask[]
       nextSyncToken: string
     }> {
       const response = await todoistApi.sync({
         sync_token: syncToken || '*',
         resource_types: ['items', 'projects', 'labels']
       })
       
       return {
         items: response.items,
         nextSyncToken: response.sync_token
       }
     }
   }
   ```

2. **Unified Sync Manager**
   ```typescript
   class UnifiedSyncManager {
     private providers: Map<string, SyncProvider> = new Map([
       ['calendar', new CalendarSyncProvider()],
       ['todoist', new TodoistSyncProvider()]
     ])
     
     async syncAll() {
       const results = await Promise.allSettled(
         Array.from(this.providers.entries()).map(([name, provider]) =>
           provider.sync().catch(error => ({
             provider: name,
             error
           }))
         )
       )
       
       return this.processSyncResults(results)
     }
   }
   ```

## Performance Considerations

### Caching Strategy

```typescript
// Multi-level caching
class CacheManager {
  private memoryCache: LRUCache<string, any>    // Hot data
  private redisCache: RedisClient                // Persistent storage
  
  async get(key: string) {
    // Check memory first
    const memoryHit = this.memoryCache.get(key)
    if (memoryHit) return memoryHit
    
    // Check Redis
    const redisHit = await this.redisCache.get(key)
    if (redisHit) {
      // Promote to memory cache
      this.memoryCache.set(key, redisHit)
      return redisHit
    }
    
    return null
  }
}
```

### Rate Limiting

```typescript
// Respect API rate limits
class RateLimiter {
  private tokens = 100  // Google Calendar: 100 requests per 100 seconds
  private refillRate = 1 // 1 token per second
  
  async acquire() {
    if (this.tokens <= 0) {
      await this.waitForToken()
    }
    this.tokens--
  }
  
  private async waitForToken() {
    const waitTime = Math.ceil((1 - this.tokens) / this.refillRate) * 1000
    await delay(waitTime)
  }
}
```

## Error Handling & Recovery

### Sync Failure Recovery

```typescript
interface SyncRecovery {
  maxRetries: 3
  backoffMultiplier: 2
  
  async attemptSync(calendarId: string, attempt = 1): Promise<void> {
    try {
      await this.syncCalendar(calendarId)
    } catch (error) {
      if (attempt >= this.maxRetries) {
        await this.handlePermanentFailure(calendarId, error)
        return
      }
      
      const delay = Math.pow(this.backoffMultiplier, attempt) * 1000
      await sleep(delay)
      
      return this.attemptSync(calendarId, attempt + 1)
    }
  }
}
```

### Data Integrity Checks

```typescript
// Periodic validation of sync state
class DataIntegrityChecker {
  async validate() {
    const issues: IntegrityIssue[] = []
    
    // Check for orphaned events
    const orphanedEvents = await this.findOrphanedEvents()
    if (orphanedEvents.length > 0) {
      issues.push({
        type: 'orphaned-events',
        count: orphanedEvents.length,
        action: 'remove'
      })
    }
    
    // Check for duplicate events
    const duplicates = await this.findDuplicateEvents()
    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicate-events',
        count: duplicates.length,
        action: 'deduplicate'
      })
    }
    
    return issues
  }
}
```

## Future Enhancements

### 1. Webhook Support
```typescript
// Real-time updates via Google Calendar push notifications
app.post('/api/webhooks/calendar', async (req, res) => {
  const { calendarId, syncToken } = req.body
  
  // Trigger immediate sync for changed calendar
  await syncService.syncCalendar(calendarId, { immediate: true })
  
  res.status(200).send()
})
```

### 2. Conflict-Free Replicated Data Types (CRDTs)
```typescript
// For eventual offline support
interface EventCRDT {
  id: string
  vector: VectorClock
  operations: Operation[]
  
  merge(other: EventCRDT): EventCRDT {
    // Merge operations based on vector clocks
    return this.resolveConflicts(this, other)
  }
}
```

### 3. Predictive Sync
```typescript
// Anticipate user actions and pre-sync
class PredictiveSync {
  async analyzePattens(userId: string) {
    // Analyze when user typically opens scheduler
    const patterns = await this.getUserPatterns(userId)
    
    // Pre-sync 30 minutes before typical usage
    this.schedulePreemptiveSync(patterns.typicalUsageTime - 30 * 60 * 1000)
  }
}
```

## Monitoring & Observability

### Metrics to Track

```typescript
interface SyncMetrics {
  // Performance metrics
  syncDuration: Histogram
  apiCallCount: Counter
  cacheHitRate: Gauge
  
  // Reliability metrics
  syncFailures: Counter
  tokenInvalidations: Counter
  dataConflicts: Counter
  
  // Business metrics
  eventsProcessed: Counter
  activeCalendars: Gauge
  syncTokenAge: Histogram
}
```

### Health Checks

```typescript
app.get('/api/health/sync', async (req, res) => {
  const health = {
    status: 'healthy',
    checks: {
      redis: await checkRedisConnection(),
      googleApi: await checkGoogleApiAccess(),
      syncAge: await checkLastSyncAge(),
      errorRate: await checkRecentErrorRate()
    }
  }
  
  const allHealthy = Object.values(health.checks).every(check => check.healthy)
  health.status = allHealthy ? 'healthy' : 'degraded'
  
  res.status(allHealthy ? 200 : 503).json(health)
})
```

## Conclusion

This sync token architecture provides:

1. **Efficiency**: 95% reduction in API calls after initial sync
2. **Reliability**: Automatic recovery from failures and token invalidation
3. **Performance**: Sub-second event retrieval from memory cache
4. **Scalability**: Foundation for supporting multiple sync providers
5. **Extensibility**: Ready for real-time updates and offline support

The architecture is designed to grow with the application, supporting future features like Todoist sync integration, real-time collaboration, and offline-first functionality.