import { NextRequest, NextResponse } from 'next/server'
import { calendarSyncService } from '@/lib/calendar-sync-service'

export async function GET() {
  const interval = calendarSyncService.getSyncInterval()
  return NextResponse.json({ interval })
}

export async function POST(request: NextRequest) {
  try {
    const { interval } = await request.json()
    
    if (typeof interval !== 'number' || interval < 1) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be a number >= 1' },
        { status: 400 }
      )
    }
    
    calendarSyncService.setSyncInterval(interval)
    
    return NextResponse.json({ 
      success: true, 
      interval: calendarSyncService.getSyncInterval() 
    })
  } catch (error) {
    console.error('Failed to update sync interval:', error)
    return NextResponse.json(
      { error: 'Failed to update sync interval' },
      { status: 500 }
    )
  }
}