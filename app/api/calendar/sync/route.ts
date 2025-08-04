import { NextResponse } from 'next/server'
import { calendarSyncService } from '@/lib/calendar-sync-service'

export async function POST() {
  try {
    // Start background sync service
    calendarSyncService.startBackgroundSync()
    
    return NextResponse.json({
      success: true,
      message: 'Background calendar sync started'
    })
  } catch (error) {
    console.error('Failed to start calendar sync:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to start sync'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Manual sync trigger
    await calendarSyncService.syncAllCalendars()
    
    return NextResponse.json({
      success: true,
      message: 'Manual calendar sync completed'
    })
  } catch (error) {
    console.error('Manual calendar sync failed:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 })
  }
}