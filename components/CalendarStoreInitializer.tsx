'use client'

import { useEffect } from 'react'
import { calendarEventStore } from '@/lib/calendar-event-store'

export default function CalendarStoreInitializer() {
  useEffect(() => {
    // Initialize calendar store on app startup
    calendarEventStore.initialize()
      .then(() => {
        console.log('Calendar store initialized')
        
        // Trigger initial sync
        fetch('/api/calendar/sync', { method: 'POST' })
          .then(res => res.json())
          .then(data => console.log('Background sync started:', data))
          .catch(err => console.error('Failed to start background sync:', err))
      })
      .catch(error => {
        console.error('Failed to initialize calendar store:', error)
      })

    // Cleanup on unmount
    return () => {
      calendarEventStore.cleanup()
    }
  }, [])

  return null // This component doesn't render anything
}