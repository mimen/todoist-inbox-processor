import { NextRequest, NextResponse } from 'next/server'
import { calendarSyncService } from '@/lib/calendar-sync-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Support both old format (date + days) and new format (startDate + endDate)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const dateStr = searchParams.get('date')
    const daysStr = searchParams.get('days') || '1'
    
    let startDate: Date
    let endDate: Date
    
    if (startDateStr && endDateStr) {
      // New format with explicit start and end dates
      startDate = new Date(startDateStr)
      endDate = new Date(endDateStr)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
    } else if (dateStr) {
      // Legacy format with date + days
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
      
      const days = parseInt(daysStr)
      if (isNaN(days) || days < 1 || days > 7) {
        return NextResponse.json({ error: 'Days must be between 1 and 7' }, { status: 400 })
      }
      
      startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(date)
      endDate.setDate(endDate.getDate() + days - 1)
      endDate.setHours(23, 59, 59, 999)
    } else {
      return NextResponse.json({ error: 'Date parameters required' }, { status: 400 })
    }
    
    // Check authorization
    if (!(await calendarSyncService.isAuthorized())) {
      return NextResponse.json({
        error: 'Not authorized',
        authRequired: true,
        authUrl: '/api/auth/google'
      }, { status: 401 })
    }
    
    // Get events from cache (with background sync if needed)
    const events = await calendarSyncService.getEventsForDateRange(startDate, endDate)
    
    console.log(`Returning ${events.length} cached events from ${startDate.toDateString()} to ${endDate.toDateString()}`)
    
    return NextResponse.json({
      success: true,
      events: events,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      cached: true
    })
  } catch (error) {
    console.error('Calendar events error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch calendar events'
    }, { status: 500 })
  }
}