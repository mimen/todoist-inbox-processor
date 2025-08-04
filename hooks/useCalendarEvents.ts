import { useState, useEffect, useCallback } from 'react'

export interface CalendarEvent {
  id: string
  calendarId: string
  calendarName: string
  title: string
  start: Date
  end: Date
  color?: string
  isAllDay: boolean
}

interface UseCalendarEventsResult {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  authRequired: boolean
  refresh: () => void
}

export function useCalendarEvents(date: Date, daysToLoad: number = 3): UseCalendarEventsResult {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authRequired, setAuthRequired] = useState(false)

  // Calculate date range
  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(date)
  endDate.setDate(endDate.getDate() + daysToLoad - 1)
  endDate.setHours(23, 59, 59, 999)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      
      const response = await fetch(`/api/calendar/events?${params}`)
      
      if (response.status === 401) {
        setAuthRequired(true)
        setError('Calendar authorization required')
        setEvents([])
        return
      }
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch calendar events')
      }
      
      const data = await response.json()
      
      // Convert date strings back to Date objects
      const parsedEvents = data.events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }))
      
      setEvents(parsedEvents)
      setAuthRequired(false)
      setError(null)
    } catch (err) {
      console.error('Error fetching calendar events:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [startDate.getTime(), endDate.getTime()])

  // Fetch events when date range changes
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Listen for window focus to refresh after auth
  useEffect(() => {
    const handleFocus = () => {
      if (authRequired) {
        // Refresh when window regains focus after auth
        fetchEvents()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && authRequired) {
        fetchEvents()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authRequired, fetchEvents])

  const refresh = useCallback(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, authRequired, refresh }
}