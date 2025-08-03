# Component Templates: Task Scheduler

This document provides reusable component templates and code patterns for the Task Scheduler feature implementation.

## Core Components

### TaskSchedulerOverlay Template

```typescript
// components/TaskScheduler/TaskSchedulerOverlay.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { TodoistTask } from '@/lib/types'
import { CalendarDayView } from './CalendarDayView'
import { DayNavigationControls } from './DayNavigationControls'
import { CalendarVisibilityPanel } from './CalendarVisibilityPanel'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useSchedulerKeyboard } from '@/hooks/useSchedulerKeyboard'
import { useClickOutside } from '@/hooks/useClickOutside'

interface TaskSchedulerOverlayProps {
  mode: 'scheduled' | 'deadline'
  task: TodoistTask
  onSelect: (date: Date | null) => void
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
  const overlayRef = useRef<HTMLDivElement>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPosition, setSelectedPosition] = useState<Date | null>(null)
  const [confirmationState, setConfirmationState] = useState<'idle' | 'preview' | 'confirming'>('idle')
  
  // Calendar data and visibility
  const { events, calendars, visibility, toggleCalendar, isLoading, error } = useCalendarData(currentDate)
  
  // Click outside to close
  useClickOutside(overlayRef, onClose)
  
  // Keyboard navigation
  useSchedulerKeyboard({
    isVisible,
    currentDate,
    events,
    selectedPosition,
    confirmationState,
    onNavigate: setSelectedPosition,
    onDayChange: setCurrentDate,
    onConfirm: handleConfirm,
    onCancel: onClose,
    onClearDate: handleClearDate
  })
  
  const handleConfirm = useCallback(() => {
    if (confirmationState === 'idle' && selectedPosition) {
      setConfirmationState('preview')
    } else if (confirmationState === 'preview') {
      setConfirmationState('confirming')
      onSelect(selectedPosition)
      setTimeout(onClose, 200) // Brief delay for visual feedback
    }
  }, [confirmationState, selectedPosition, onSelect, onClose])
  
  const handleClearDate = useCallback(() => {
    if (window.confirm('Clear the current date?')) {
      onSelect(null)
      onClose()
    }
  }, [onSelect, onClose])
  
  const handlePositionClick = useCallback((position: Date) => {
    if (selectedPosition?.getTime() === position.getTime() && confirmationState === 'preview') {
      handleConfirm()
    } else {
      setSelectedPosition(position)
      setConfirmationState('idle')
    }
  }, [selectedPosition, confirmationState, handleConfirm])
  
  if (!isVisible) return null
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Select ${mode} date`}
    >
      <div 
        ref={overlayRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] 
                   flex flex-col animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Schedule {mode === 'scheduled' ? 'Task' : 'Deadline'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Calendar Visibility Sidebar */}
          <div className="w-64 border-r overflow-y-auto">
            <CalendarVisibilityPanel
              calendars={calendars}
              visibility={visibility}
              onToggle={toggleCalendar}
            />
          </div>
          
          {/* Calendar View */}
          <div className="flex-1 flex flex-col">
            <DayNavigationControls
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onToday={() => setCurrentDate(new Date())}
              onClearDate={task.due || task.deadline ? handleClearDate : undefined}
            />
            
            <CalendarDayView
              date={currentDate}
              events={events.filter(e => visibility[e.calendarId] !== false)}
              selectedPosition={selectedPosition}
              showPreview={confirmationState === 'preview'}
              previewTask={{
                content: task.content,
                duration: 30
              }}
              onPositionSelect={handlePositionClick}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
        
        {/* Footer with shortcuts */}
        <div className="p-3 border-t text-xs text-gray-500 flex justify-between">
          <div className="flex gap-4">
            <span>↑↓ Navigate slots</span>
            <span>←→ Change days</span>
            <span>Enter Select</span>
            <span>Esc Cancel</span>
          </div>
          {(task.due || task.deadline) && (
            <span>Shift+Delete Clear date</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
```

### CalendarDayView Template

```typescript
// components/TaskScheduler/CalendarDayView.tsx
import { useMemo, useRef, useEffect } from 'react'
import { CalendarEvent } from '@/lib/types'
import { TimeSlot } from './TimeSlot'
import { CalendarEventRenderer } from './CalendarEventRenderer'
import { TaskPreview } from './TaskPreview'
import { generateTimeSlots, timeToPixels } from '@/lib/scheduler-utils'

interface CalendarDayViewProps {
  date: Date
  events: CalendarEvent[]
  selectedPosition: Date | null
  showPreview: boolean
  previewTask: { content: string; duration: number }
  onPositionSelect: (position: Date) => void
  isLoading: boolean
  error: Error | null
}

export function CalendarDayView({
  date,
  events,
  selectedPosition,
  showPreview,
  previewTask,
  onPositionSelect,
  isLoading,
  error
}: CalendarDayViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const slots = useMemo(() => generateTimeSlots(date, events), [date, events])
  
  // Auto-scroll to current time or selected position
  useEffect(() => {
    if (!scrollContainerRef.current) return
    
    const targetTime = selectedPosition || (date.toDateString() === new Date().toDateString() ? new Date() : null)
    if (!targetTime) return
    
    const pixels = timeToPixels(targetTime)
    scrollContainerRef.current.scrollTo({
      top: Math.max(0, pixels - 100),
      behavior: 'smooth'
    })
  }, [selectedPosition, date])
  
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load calendar</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }
  
  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
      <div className="flex min-h-full">
        {/* Time labels */}
        <div className="w-16 flex-shrink-0 border-r bg-gray-50">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="h-16 border-b relative">
              <span className="absolute top-0 left-2 text-xs text-gray-500 -translate-y-1/2 bg-gray-50 px-1">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            </div>
          ))}
        </div>
        
        {/* Time grid and events */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {Array.from({ length: 96 }, (_, i) => (
              <div 
                key={i} 
                className={`h-4 border-b ${i % 4 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
              />
            ))}
          </div>
          
          {/* Time slots */}
          <div className="relative">
            {slots.map(slot => (
              <TimeSlot
                key={slot.start.toISOString()}
                slot={slot}
                isSelected={selectedPosition?.getTime() === slot.start.getTime()}
                onClick={() => onPositionSelect(slot.start)}
              />
            ))}
          </div>
          
          {/* Calendar events */}
          <div className="absolute inset-0 pointer-events-none">
            <CalendarEventRenderer events={events} />
          </div>
          
          {/* Task preview */}
          {showPreview && selectedPosition && (
            <div 
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: timeToPixels(selectedPosition) }}
            >
              <TaskPreview task={previewTask} />
            </div>
          )}
          
          {/* Current time indicator */}
          {date.toDateString() === new Date().toDateString() && (
            <CurrentTimeIndicator />
          )}
        </div>
      </div>
    </div>
  )
}
```

### Time Slot Template

```typescript
// components/TaskScheduler/TimeSlot.tsx
import { memo } from 'react'
import { TimeSlot as TimeSlotType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TimeSlotProps {
  slot: TimeSlotType
  isSelected: boolean
  onClick: () => void
}

export const TimeSlot = memo(function TimeSlot({
  slot,
  isSelected,
  onClick
}: TimeSlotProps) {
  const isClickable = slot.hasRequiredClearance || !slot.isKeyboardNavigable
  
  return (
    <div
      className={cn(
        'absolute left-0 right-0 h-4 transition-colors',
        isClickable && 'cursor-pointer',
        isClickable && !isSelected && 'hover:bg-blue-50',
        isSelected && 'bg-blue-100',
        !slot.hasRequiredClearance && 'opacity-50'
      )}
      style={{ top: timeToPixels(slot.start) }}
      onClick={isClickable ? onClick : undefined}
      role="button"
      aria-label={`${formatTime(slot.start)} - ${slot.hasRequiredClearance ? 'Available' : 'Unavailable'}`}
      aria-selected={isSelected}
      data-time={slot.start.toISOString()}
      data-available={slot.hasRequiredClearance}
    />
  )
})
```

## Utility Functions

### Time Calculation Utilities

```typescript
// lib/scheduler-utils.ts
export function generateTimeSlots(date: Date, events: CalendarEvent[]): TimeSlot[] {
  const slots: TimeSlot[] = []
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  let current = new Date(dayStart)
  
  // For today, start from next 15-minute mark
  if (isToday) {
    const minutes = now.getMinutes()
    const nextQuarter = Math.ceil(minutes / 15) * 15
    current = new Date(now)
    current.setMinutes(nextQuarter, 0, 0)
  }
  
  while (current < dayEnd) {
    const taskEnd = addMinutes(current, 30)
    
    // Check for conflicts
    const hasConflict = events.some(event => 
      isOverlapping(current, taskEnd, event.start, event.end)
    )
    
    slots.push({
      start: new Date(current),
      end: taskEnd,
      isAvailable: !hasConflict && taskEnd <= dayEnd,
      hasRequiredClearance: !hasConflict && taskEnd <= dayEnd,
      isKeyboardNavigable: true
    })
    
    current = addMinutes(current, 15)
  }
  
  return slots
}

export function timeToPixels(time: Date): number {
  const hours = time.getHours()
  const minutes = time.getMinutes()
  return (hours * 64) + (minutes / 60 * 64) // 64px per hour
}

export function pixelsToTime(pixels: number, baseDate: Date): Date {
  const totalMinutes = (pixels / 64) * 60
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  
  const result = new Date(baseDate)
  result.setHours(hours, minutes, 0, 0)
  return result
}

export function isOverlapping(
  start1: Date, 
  end1: Date, 
  start2: Date, 
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
```

### Calendar Event Layout Algorithm

```typescript
// lib/event-layout.ts
interface EventPosition {
  event: CalendarEvent
  left: number  // percentage
  width: number // percentage
  top: number   // pixels
  height: number // pixels
  column: number
  zIndex: number
}

export function calculateEventPositions(
  events: CalendarEvent[],
  containerWidth: number
): EventPosition[] {
  // Sort by start time, then by duration (longer first)
  const sorted = [...events].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime()
    if (startDiff !== 0) return startDiff
    return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime())
  })
  
  const groups = groupOverlappingEvents(sorted)
  const positions: EventPosition[] = []
  
  groups.forEach(group => {
    // Calculate columns for this group
    const columns: CalendarEvent[][] = []
    
    group.forEach(event => {
      // Find first column where event fits
      let placed = false
      
      for (let i = 0; i < columns.length; i++) {
        const canFit = !columns[i].some(e => 
          isOverlapping(event.start, event.end, e.start, e.end)
        )
        
        if (canFit) {
          columns[i].push(event)
          placed = true
          break
        }
      }
      
      if (!placed) {
        columns.push([event])
      }
    })
    
    // Calculate positions
    const minWidth = 100 // Minimum width in pixels
    const maxColumns = Math.floor(containerWidth / minWidth)
    const effectiveColumns = Math.min(columns.length, maxColumns)
    const columnWidth = 100 / effectiveColumns
    
    columns.forEach((column, colIndex) => {
      column.forEach(event => {
        const isOverlapping = columns.length > maxColumns
        
        positions.push({
          event,
          left: isOverlapping 
            ? (colIndex % maxColumns) * columnWidth + (Math.floor(colIndex / maxColumns) * 5)
            : colIndex * columnWidth,
          width: isOverlapping ? columnWidth - 5 : columnWidth - 2,
          top: timeToPixels(event.start),
          height: timeToPixels(event.end) - timeToPixels(event.start),
          column: colIndex,
          zIndex: isOverlapping ? Math.floor(colIndex / maxColumns) : 0
        })
      })
    })
  })
  
  return positions
}

function groupOverlappingEvents(events: CalendarEvent[]): CalendarEvent[][] {
  const groups: CalendarEvent[][] = []
  let currentGroup: CalendarEvent[] = []
  let groupEnd: Date | null = null
  
  events.forEach(event => {
    if (!groupEnd || event.start >= groupEnd) {
      // Start new group
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = [event]
      groupEnd = event.end
    } else {
      // Add to current group
      currentGroup.push(event)
      if (event.end > groupEnd) {
        groupEnd = event.end
      }
    }
  })
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }
  
  return groups
}
```

## Custom Hooks

### useSchedulerKeyboard Hook

```typescript
// hooks/useSchedulerKeyboard.ts
interface UseSchedulerKeyboardProps {
  isVisible: boolean
  currentDate: Date
  events: CalendarEvent[]
  selectedPosition: Date | null
  confirmationState: 'idle' | 'preview' | 'confirming'
  onNavigate: (position: Date) => void
  onDayChange: (date: Date) => void
  onConfirm: () => void
  onCancel: () => void
  onClearDate?: () => void
}

export function useSchedulerKeyboard({
  isVisible,
  currentDate,
  events,
  selectedPosition,
  confirmationState,
  onNavigate,
  onDayChange,
  onConfirm,
  onCancel,
  onClearDate
}: UseSchedulerKeyboardProps) {
  const availableSlots = useMemo(() => 
    generateTimeSlots(currentDate, events)
      .filter(slot => slot.hasRequiredClearance)
      .map(slot => slot.start),
    [currentDate, events]
  )
  
  useEffect(() => {
    if (!isVisible) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          navigateSlot('up')
          break
          
        case 'ArrowDown':
          e.preventDefault()
          navigateSlot('down')
          break
          
        case 'ArrowLeft':
        case 'Tab':
          if (e.shiftKey || e.key === 'ArrowLeft') {
            e.preventDefault()
            navigateDay(-1)
          }
          break
          
        case 'ArrowRight':
          if (!e.shiftKey) {
            e.preventDefault()
            navigateDay(1)
          }
          break
          
        case 'Enter':
          e.preventDefault()
          onConfirm()
          break
          
        case 'Escape':
          e.preventDefault()
          onCancel()
          break
          
        case 'd':
        case 'D':
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            openDatePicker()
          }
          break
          
        case 'Delete':
          if (e.shiftKey && onClearDate) {
            e.preventDefault()
            onClearDate()
          }
          break
      }
    }
    
    const navigateSlot = (direction: 'up' | 'down') => {
      if (availableSlots.length === 0) return
      
      const currentIndex = selectedPosition 
        ? availableSlots.findIndex(slot => slot.getTime() === selectedPosition.getTime())
        : -1
      
      let newIndex: number
      if (direction === 'up') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : 0
      } else {
        newIndex = currentIndex < availableSlots.length - 1 
          ? currentIndex + 1 
          : availableSlots.length - 1
      }
      
      if (newIndex >= 0 && newIndex < availableSlots.length) {
        onNavigate(availableSlots[newIndex])
      }
    }
    
    const navigateDay = (delta: number) => {
      const newDate = addDays(currentDate, delta)
      onDayChange(newDate)
    }
    
    const openDatePicker = () => {
      // This would open a date picker modal
      console.log('Open date picker')
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, currentDate, events, selectedPosition, availableSlots, onNavigate, onDayChange, onConfirm, onCancel, onClearDate])
}
```

### useCalendarData Hook

```typescript
// hooks/useCalendarData.ts
interface CalendarData {
  events: CalendarEvent[]
  calendars: Calendar[]
  visibility: CalendarVisibilityState
  toggleCalendar: (calendarId: string) => void
  isLoading: boolean
  error: Error | null
}

export function useCalendarData(date: Date): CalendarData {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Calendar visibility with localStorage
  const [visibility, setVisibility] = useLocalStorage<CalendarVisibilityState>(
    'task-scheduler-calendar-visibility',
    {}
  )
  
  const toggleCalendar = useCallback((calendarId: string) => {
    setVisibility(prev => ({
      ...prev,
      [calendarId]: prev[calendarId] === false
    }))
  }, [setVisibility])
  
  useEffect(() => {
    let cancelled = false
    
    async function fetchEvents() {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(
          `/api/calendar/events?date=${date.toISOString()}&days=1`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch calendar events')
        }
        
        const data = await response.json()
        
        if (!cancelled) {
          setEvents(data.events || [])
          setCalendars(data.calendars || [])
          
          // Initialize visibility for new calendars
          const newVisibility = { ...visibility }
          data.calendars?.forEach((cal: Calendar) => {
            if (!(cal.id in newVisibility)) {
              newVisibility[cal.id] = true
            }
          })
          setVisibility(newVisibility)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    
    fetchEvents()
    
    return () => {
      cancelled = true
    }
  }, [date])
  
  return {
    events,
    calendars,
    visibility,
    toggleCalendar,
    isLoading,
    error
  }
}
```

## Styling Templates

### Tailwind Configuration

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
}
```

### Component Styles

```css
/* styles/scheduler.css */
.time-slot-grid {
  @apply relative;
  min-height: 1536px; /* 24 hours * 64px */
}

.time-slot {
  @apply absolute left-0 right-0 transition-colors duration-150;
  height: 16px; /* 15 minutes */
}

.time-slot-available {
  @apply cursor-pointer hover:bg-blue-50;
}

.time-slot-selected {
  @apply bg-blue-100 ring-2 ring-blue-500 ring-inset;
}

.calendar-event {
  @apply absolute rounded px-2 py-1 text-xs font-medium text-white
         cursor-pointer transition-all duration-150
         hover:shadow-lg hover:z-10;
}

.task-preview {
  @apply absolute left-0 right-0 bg-purple-100 border-2 border-purple-400
         rounded-md p-2 animate-pulse;
  height: 32px; /* 30 minutes */
}

.current-time-indicator {
  @apply absolute left-0 right-0 h-0.5 bg-red-500 pointer-events-none;
  z-index: 20;
}

.current-time-indicator::before {
  @apply absolute w-2 h-2 bg-red-500 rounded-full;
  content: '';
  left: -4px;
  top: -3px;
}
```

## Testing Templates

### Component Tests

```typescript
// __tests__/TaskScheduler.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskSchedulerOverlay } from '@/components/TaskScheduler/TaskSchedulerOverlay'

describe('TaskSchedulerOverlay', () => {
  const mockProps = {
    mode: 'scheduled' as const,
    task: {
      id: '1',
      content: 'Test task',
      projectId: 'project1'
    },
    onSelect: jest.fn(),
    onClose: jest.fn(),
    isVisible: true
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should render calendar view when visible', () => {
    render(<TaskSchedulerOverlay {...mockProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  
  it('should navigate to available slots with keyboard', async () => {
    render(<TaskSchedulerOverlay {...mockProps} />)
    
    // Mock available slots
    const slots = screen.getAllByRole('button', { name: /Available/ })
    
    // Press down arrow
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    
    await waitFor(() => {
      expect(slots[0]).toHaveAttribute('aria-selected', 'true')
    })
  })
  
  it('should require two enters to confirm selection', async () => {
    render(<TaskSchedulerOverlay {...mockProps} />)
    
    // Select a slot
    const slot = screen.getByRole('button', { name: /10:00 AM - Available/ })
    fireEvent.click(slot)
    
    // First enter - should show preview
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('task-preview')).toBeInTheDocument()
    
    // Second enter - should confirm
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(mockProps.onSelect).toHaveBeenCalledWith(expect.any(Date))
  })
})
```

## Usage Examples

### Integration with TaskProcessor

```typescript
// In TaskProcessor component
const [schedulerConfig, setSchedulerConfig] = useState<{
  mode: 'scheduled' | 'deadline'
  task: TodoistTask
} | null>(null)

// Replace existing date overlays
const handleScheduledClick = () => {
  setSchedulerConfig({ mode: 'scheduled', task: currentTask })
}

const handleDeadlineClick = () => {
  setSchedulerConfig({ mode: 'deadline', task: currentTask })
}

// Render scheduler
{schedulerConfig && (
  <TaskSchedulerOverlay
    mode={schedulerConfig.mode}
    task={schedulerConfig.task}
    onSelect={(date) => {
      if (schedulerConfig.mode === 'scheduled') {
        handleScheduledDateChange(date ? formatDate(date) : '')
      } else {
        handleDeadlineChange(date ? formatDate(date) : '')
      }
    }}
    onClose={() => setSchedulerConfig(null)}
    isVisible={true}
  />
)}
```

This completes the component templates documentation with reusable patterns and examples for implementing the Task Scheduler feature.