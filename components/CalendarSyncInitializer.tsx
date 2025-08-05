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
  }, [])

  return null
}