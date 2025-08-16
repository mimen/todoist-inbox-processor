'use client'

import { useEffect } from 'react'

export default function CalendarSyncInitializer() {
  useEffect(() => {
    // Initialize sync interval from localStorage
    const savedInterval = localStorage.getItem('calendarSyncInterval')
    if (savedInterval) {
      fetch('/api/calendar/sync/interval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: parseInt(savedInterval) })
      }).catch(console.error)
    }

    // Preload calendar events after a short delay to ensure main content loads first
    const timeoutId = setTimeout(async () => {
      try {
        console.log('📅 Preloading calendar events in background...')
        
        // Get events for the next 7 days to warm up the cache
        const startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 7)
        endDate.setHours(23, 59, 59, 999)
        
        // Call the calendar events API to populate the cache
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        
        const response = await fetch(`/api/calendar/events?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`📅 Calendar events preloaded successfully: ${data.events.length} events cached`)
        } else if (response.status === 401) {
          console.log('📅 Calendar not authorized, skipping preload')
        }
      } catch (error) {
        console.error('Failed to preload calendar events:', error)
      }
    }, 2000) // 2 second delay to let main content render and settle

    return () => clearTimeout(timeoutId)
  }, [])

  return null
}