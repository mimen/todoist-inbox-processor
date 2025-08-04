import { CalendarEvent } from '@/hooks/useCalendarEvents'

class CalendarEventStore {
  private events = new Map<string, CalendarEvent[]>()
  private subscribers = new Set<(events: CalendarEvent[]) => void>()
  private initialized = false
  private syncInterval: NodeJS.Timeout | null = null

  async initialize() {
    if (this.initialized) return

    try {
      // Fetch initial data from API
      const response = await fetch('/api/calendar/store/init')
      if (!response.ok) {
        throw new Error('Failed to initialize calendar store')
      }
      
      const data = await response.json()
      
      // Load events into memory
      if (data.calendars && Array.isArray(data.calendars)) {
        for (const calendar of data.calendars) {
          if (calendar.events && Array.isArray(calendar.events)) {
            // Convert date strings back to Date objects in memory
            const events = calendar.events.map((event: any) => ({
              ...event,
              start: new Date(event.start),
              end: new Date(event.end)
            }))
            this.events.set(calendar.calendarId, events)
          }
        }
      }
      
      this.initialized = true
      console.log(`Calendar store initialized with ${this.events.size} calendars`)
      
      // Notify all subscribers
      this.notifySubscribers()
      
      // Start periodic refresh
      this.startPeriodicRefresh()
    } catch (error) {
      console.error('Failed to initialize calendar store:', error)
      this.initialized = true // Mark as initialized even on error to prevent infinite retries
    }
  }

  private startPeriodicRefresh() {
    // Refresh every 5 minutes
    this.syncInterval = setInterval(() => {
      this.refresh()
    }, 5 * 60 * 1000)
  }

  async refresh() {
    console.log('Refreshing calendar store...')
    
    try {
      const response = await fetch('/api/calendar/store/refresh')
      if (!response.ok) {
        throw new Error('Failed to refresh calendar store')
      }
      
      const data = await response.json()
      const updatedCalendars = new Set<string>()
      
      if (data.calendars && Array.isArray(data.calendars)) {
        for (const calendar of data.calendars) {
          if (calendar.events && Array.isArray(calendar.events)) {
            const events = calendar.events.map((event: any) => ({
              ...event,
              start: new Date(event.start),
              end: new Date(event.end)
            }))
            
            // Check if events have changed
            const existingEvents = this.events.get(calendar.calendarId) || []
            if (JSON.stringify(existingEvents) !== JSON.stringify(events)) {
              this.events.set(calendar.calendarId, events)
              updatedCalendars.add(calendar.calendarId)
            }
          }
        }
      }
      
      if (updatedCalendars.size > 0) {
        console.log(`Updated ${updatedCalendars.size} calendars`)
        this.notifySubscribers()
      }
    } catch (error) {
      console.error('Failed to refresh calendar store:', error)
    }
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

  getAllEvents(): CalendarEvent[] {
    const allEvents: CalendarEvent[] = []
    
    for (const [_, events] of this.events) {
      allEvents.push(...events)
    }
    
    return allEvents.sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    )
  }

  getCalendarCount(): number {
    return this.events.size
  }

  getEventCount(): number {
    let count = 0
    for (const [_, events] of this.events) {
      count += events.length
    }
    return count
  }

  subscribe(callback: (events: CalendarEvent[]) => void): () => void {
    this.subscribers.add(callback)
    
    // Immediately call with current events if we have any
    if (this.initialized) {
      callback(this.getAllEvents())
    }
    
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers() {
    const allEvents = this.getAllEvents()
    this.subscribers.forEach(callback => callback(allEvents))
  }

  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}

// Create singleton instance
export const calendarEventStore = new CalendarEventStore()

// Helper hook for React components
export function useCalendarStore() {
  // This would be implemented as a React hook that subscribes to the store
  // For now, we'll use the store directly in components
  return calendarEventStore
}