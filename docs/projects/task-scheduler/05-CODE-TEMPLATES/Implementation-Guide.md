# Implementation Guide: Task Scheduler Feature

This guide provides step-by-step instructions for implementing the Task Scheduler feature, including code examples and best practices.

## Prerequisites

Before starting implementation:
1. Ensure you have access to Google Calendar API credentials
2. Review the existing overlay system in the codebase
3. Familiarize yourself with the current date picker implementation
4. Set up environment variables for calendar access

## Phase 1: Core UI Setup

### Step 1: Replace Existing Overlays

First, modify the existing schedule/deadline overlay calls to use the new scheduler:

```typescript
// In TaskProcessor.tsx, replace:
setShowScheduledOverlay(true)

// With:
setShowSchedulerOverlay({ mode: 'scheduled', task: currentTask })
```

### Step 2: Create the Overlay Component

Create `components/TaskScheduler/TaskSchedulerOverlay.tsx`:

```typescript
import { useEffect, useCallback, useState } from 'react'
import { CalendarDayView } from './CalendarDayView'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

interface TaskSchedulerOverlayProps {
  mode: 'scheduled' | 'deadline'
  task: TodoistTask
  onSelect: (date: Date) => void
  onClose: () => void
  isVisible: boolean
}

export function TaskSchedulerOverlay({
  mode,
  task,
  onSelect,
  onClose,
  isVisible
}: TaskSchedulerOverlayProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPosition, setSelectedPosition] = useState<Date | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  
  const { events, calendars, isLoading } = useCalendarData(currentDate)
  
  // Keyboard navigation hook
  const { navigateUp, navigateDown, navigateDay } = useKeyboardNavigation({
    currentDate,
    events,
    onPositionChange: setSelectedPosition
  })
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isVisible) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          navigateUp()
          break
        case 'ArrowDown':
          e.preventDefault()
          navigateDown()
          break
        case 'ArrowLeft':
          e.preventDefault()
          navigateDay(-1)
          break
        case 'ArrowRight':
          e.preventDefault()
          navigateDay(1)
          break
        case 'Enter':
          e.preventDefault()
          if (!isPreview && selectedPosition) {
            setIsPreview(true)
          } else if (isPreview && selectedPosition) {
            onSelect(selectedPosition)
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedPosition, isPreview])
  
  if (!isVisible) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col">
        <CalendarDayView
          date={currentDate}
          events={events}
          selectedPosition={selectedPosition}
          previewTask={isPreview ? { start: selectedPosition!, duration: 30 } : null}
          onPositionSelect={setSelectedPosition}
        />
      </div>
    </div>
  )
}
```

### Step 3: Create the Day View Component

Create `components/TaskScheduler/CalendarDayView.tsx`:

```typescript
export function CalendarDayView({
  date,
  events,
  selectedPosition,
  previewTask,
  onPositionSelect
}: CalendarDayViewProps) {
  const timeSlots = useMemo(() => 
    generateTimeSlots(date, events), [date, events]
  )
  
  return (
    <div className="flex-1 flex">
      {/* Time labels */}
      <div className="w-16 border-r">
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="h-16 border-b text-xs text-gray-500 p-1">
            {formatHour(hour)}
          </div>
        ))}
      </div>
      
      {/* Time grid */}
      <div className="flex-1 relative">
        {timeSlots.map((slot) => (
          <TimeSlot
            key={slot.start.toISOString()}
            slot={slot}
            isSelected={selectedPosition?.getTime() === slot.start.getTime()}
            onClick={() => onPositionSelect(slot.start)}
          />
        ))}
        
        {/* Calendar events */}
        <CalendarEventRenderer events={events} />
        
        {/* Task preview */}
        {previewTask && (
          <div
            className="absolute bg-purple-100 border-2 border-purple-400 rounded"
            style={calculateTaskPosition(previewTask)}
          >
            <div className="p-2 text-sm">{task.content}</div>
          </div>
        )}
      </div>
    </div>
  )
}
```

## Phase 2: Calendar Integration

### Step 1: Set Up API Routes

Create `/app/api/calendar/config/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    apiKey: process.env.GOOGLE_CALENDAR_API_KEY,
    calendarIds: process.env.GOOGLE_CALENDAR_IDS?.split(',') || [],
    timezone: 'America/Los_Angeles'
  })
}
```

Create `/app/api/calendar/events/route.ts`:

```typescript
import { google } from 'googleapis'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const days = parseInt(searchParams.get('days') || '1')
  
  // For MVP, use service account or API key
  const calendar = google.calendar({
    version: 'v3',
    auth: process.env.GOOGLE_CALENDAR_API_KEY
  })
  
  const calendarIds = process.env.GOOGLE_CALENDAR_IDS?.split(',') || []
  
  // Fetch events from all calendars
  const allEvents = await Promise.all(
    calendarIds.map(calendarId =>
      calendar.events.list({
        calendarId,
        timeMin: startOfDay(date),
        timeMax: endOfDay(date),
        singleEvents: true,
        orderBy: 'startTime'
      })
    )
  )
  
  // Transform and combine events
  const events = allEvents.flatMap((response, index) =>
    response.data.items?.map(event => ({
      id: event.id!,
      calendarId: calendarIds[index],
      title: event.summary || '',
      start: new Date(event.start?.dateTime || event.start?.date!),
      end: new Date(event.end?.dateTime || event.end?.date!),
      color: response.data.backgroundColor || '#4285f4',
      isAllDay: !event.start?.dateTime
    })) || []
  )
  
  return NextResponse.json({ events })
}
```

### Step 2: Create Calendar Hook

Create `hooks/useCalendarData.ts`:

```typescript
export function useCalendarData(date: Date) {
  const [data, setData] = useState({
    events: [],
    calendars: [],
    isLoading: true,
    error: null
  })
  
  const [visibility, setVisibility] = useLocalStorage('calendar-visibility', {})
  
  useEffect(() => {
    async function fetchData() {
      try {
        setData(d => ({ ...d, isLoading: true }))
        
        const response = await fetch(
          `/api/calendar/events?date=${date.toISOString()}&days=1`
        )
        const { events } = await response.json()
        
        // Filter by visibility
        const visibleEvents = events.filter(
          event => visibility[event.calendarId] !== false
        )
        
        setData({
          events: visibleEvents,
          calendars: [], // Extract from events
          isLoading: false,
          error: null
        })
      } catch (error) {
        setData(d => ({ ...d, isLoading: false, error }))
      }
    }
    
    fetchData()
  }, [date, visibility])
  
  return { ...data, visibility, setVisibility }
}
```

## Phase 3: Keyboard Navigation

### Step 1: Create Navigation Hook

Create `hooks/useKeyboardNavigation.ts`:

```typescript
export function useKeyboardNavigation({
  currentDate,
  events,
  onPositionChange
}) {
  const [currentPosition, setCurrentPosition] = useState<Date | null>(null)
  
  // Calculate available positions with 30-min clearance
  const availablePositions = useMemo(() => {
    const positions: Date[] = []
    const now = new Date()
    const start = currentDate.toDateString() === now.toDateString() 
      ? new Date(Math.ceil(now.getTime() / 900000) * 900000) // Next 15-min
      : startOfDay(currentDate)
    
    let current = new Date(start)
    const end = endOfDay(currentDate)
    
    while (current < end) {
      const taskEnd = addMinutes(current, 30)
      
      // Check if 30-min block is clear
      const hasConflict = events.some(event =>
        isOverlapping(current, taskEnd, event.start, event.end)
      )
      
      if (!hasConflict) {
        positions.push(new Date(current))
      }
      
      current = addMinutes(current, 15)
    }
    
    return positions
  }, [currentDate, events])
  
  const navigateUp = useCallback(() => {
    const currentIndex = availablePositions.findIndex(
      p => p.getTime() === currentPosition?.getTime()
    )
    
    if (currentIndex > 0) {
      const newPosition = availablePositions[currentIndex - 1]
      setCurrentPosition(newPosition)
      onPositionChange(newPosition)
    }
  }, [currentPosition, availablePositions, onPositionChange])
  
  const navigateDown = useCallback(() => {
    const currentIndex = currentPosition 
      ? availablePositions.findIndex(p => p.getTime() === currentPosition.getTime())
      : -1
    
    if (currentIndex < availablePositions.length - 1) {
      const newPosition = availablePositions[currentIndex + 1]
      setCurrentPosition(newPosition)
      onPositionChange(newPosition)
    }
  }, [currentPosition, availablePositions, onPositionChange])
  
  return { navigateUp, navigateDown, availablePositions }
}
```

## Phase 4: Visual Polish

### Step 1: Event Layout Algorithm

Create `components/TaskScheduler/CalendarEventRenderer.tsx`:

```typescript
export function CalendarEventRenderer({ events }: { events: CalendarEvent[] }) {
  const eventPositions = useMemo(() => 
    calculateEventPositions(events), [events]
  )
  
  return (
    <>
      {eventPositions.map(({ event, left, width, top, height }) => (
        <div
          key={event.id}
          className="absolute rounded px-2 py-1 text-xs cursor-pointer
                     hover:z-10 hover:shadow-lg transition-shadow"
          style={{
            backgroundColor: event.color,
            left: `${left}%`,
            width: `${width}%`,
            top: `${top}px`,
            height: `${height}px`
          }}
          title={`${event.calendarName}: ${event.title}`}
        >
          <div className="font-medium truncate">{event.title}</div>
        </div>
      ))}
    </>
  )
}

function calculateEventPositions(events: CalendarEvent[]) {
  // Group overlapping events
  const groups = groupOverlappingEvents(events)
  
  return groups.flatMap(group => {
    // Prefer side-by-side layout
    const columns = Math.min(group.length, 3) // Max 3 side-by-side
    const columnWidth = 100 / columns
    
    return group.map((event, index) => {
      const column = index % columns
      const overlap = Math.floor(index / columns)
      
      return {
        event,
        left: column * columnWidth + (overlap * 5), // Slight offset for overlaps
        width: columnWidth - 2, // Gap between events
        top: timeToPixels(event.start),
        height: timeToPixels(event.end) - timeToPixels(event.start)
      }
    })
  })
}
```

### Step 2: Calendar Visibility Toggle

Create `components/TaskScheduler/CalendarVisibilityPanel.tsx`:

```typescript
export function CalendarVisibilityPanel({
  calendars,
  visibility,
  onToggle
}: CalendarVisibilityPanelProps) {
  return (
    <div className="p-4 border-b">
      <h3 className="text-sm font-medium mb-2">Calendars</h3>
      <div className="space-y-1">
        {calendars.map(calendar => (
          <label key={calendar.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={visibility[calendar.id] !== false}
              onChange={() => onToggle(calendar.id)}
              className="rounded"
            />
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: calendar.color }}
            />
            <span className="text-sm">{calendar.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

## Testing Strategy

### Unit Tests

```typescript
// __tests__/timeSlotCalculation.test.ts
describe('Time Slot Calculation', () => {
  it('should skip positions without 30-min clearance', () => {
    const events = [{
      start: new Date('2024-01-15T10:00:00'),
      end: new Date('2024-01-15T10:45:00')
    }]
    
    const positions = calculateAvailablePositions(
      new Date('2024-01-15'),
      events
    )
    
    // Should not include 9:45 (only 15 min before event)
    expect(positions).not.toContainEqual(
      expect.objectContaining({
        start: new Date('2024-01-15T09:45:00')
      })
    )
  })
})
```

### Integration Tests

```typescript
// __tests__/scheduler.integration.test.tsx
describe('Task Scheduler Integration', () => {
  it('should navigate only to available slots', async () => {
    render(<TaskSchedulerOverlay {...props} />)
    
    // Press down arrow
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    
    // Should skip occupied slots
    await waitFor(() => {
      expect(screen.getByTestId('selected-time')).toHaveTextContent('10:30 AM')
    })
  })
})
```

## Deployment Checklist

- [ ] Environment variables set for Google Calendar
- [ ] Feature flag created for gradual rollout
- [ ] Performance monitoring configured
- [ ] Error tracking enabled
- [ ] Documentation updated
- [ ] Team trained on new feature

## Common Issues and Solutions

### Issue: Calendar events not loading
**Solution**: Check API key and calendar IDs in environment variables

### Issue: Keyboard navigation feels slow
**Solution**: Ensure positions are pre-calculated and memoized

### Issue: Events overlapping incorrectly
**Solution**: Verify the event layout algorithm handles edge cases

## Next Steps

After MVP implementation:
1. Add OAuth for proper authentication
2. Implement duration adjustment
3. Add working hours configuration
4. Support multiple timezones
5. Create calendar events from tasks