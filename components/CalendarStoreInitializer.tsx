'use client'

import { useEffect } from 'react'
import { calendarEventStore } from '@/lib/calendar-event-store'

export default function CalendarStoreInitializer() {
  useEffect(() => {
    // Initialize calendar store on app startup
    calendarEventStore.initialize()
      .then(() => {
        console.log('Calendar store initialized')
        
        // Don't trigger sync here - let it be triggered by user action or other components
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