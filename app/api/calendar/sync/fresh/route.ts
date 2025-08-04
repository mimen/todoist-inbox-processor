import { NextResponse } from 'next/server'
import { calendarSyncService } from '@/lib/calendar-sync-service'

export async function POST() {
  try {
    // Trigger a fresh sync (clears all sync tokens first)
    await calendarSyncService.syncAllCalendars(true)
    
    return NextResponse.json({
      success: true,
      message: 'Fresh calendar sync started - all sync tokens cleared'
    })
  } catch (error) {
    console.error('Failed to start fresh calendar sync:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to start fresh sync'
    }, { status: 500 })
  }
}