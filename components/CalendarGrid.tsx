'use client'

import { useMemo, useRef, useEffect } from 'react'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'

interface CalendarGridProps {
  events: CalendarEvent[]
  selectedSlot: Date | null
  onSlotClick: (time: Date) => void
  currentDate: Date
  previewMode: boolean
  taskDuration?: number // in minutes, default 30
  daysToShow?: number // default 1
}

interface EventPosition {
  event: CalendarEvent
  day: number
  column: number
  maxColumns: number
  left: number
  width: number
}

export default function CalendarGrid({
  events,
  selectedSlot,
  onSlotClick,
  currentDate,
  previewMode,
  taskDuration = 30,
  daysToShow = 3
}: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const hoursRef = useRef<HTMLDivElement>(null)
  
  // Generate dates for multi-day view
  const dates = useMemo(() => {
    const result: Date[] = []
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(currentDate)
      date.setDate(date.getDate() + i)
      date.setHours(0, 0, 0, 0)
      result.push(date)
    }
    return result
  }, [currentDate, daysToShow])
  
  // Separate all-day and timed events
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: CalendarEvent[] = []
    const timed: CalendarEvent[] = []
    
    events.forEach(event => {
      if (event.isAllDay) {
        allDay.push(event)
      } else {
        timed.push(event)
      }
    })
    
    return { allDayEvents: allDay, timedEvents: timed }
  }, [events])
  
  // Calculate positions for timed events with multi-day support
  const eventPositions = useMemo((): EventPosition[] => {
    const positions: EventPosition[] = []
    
    // Group events by day
    const eventsByDay = new Map<number, CalendarEvent[]>()
    
    dates.forEach((date, dayIndex) => {
      const dayEvents = timedEvents.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === date.toDateString()
      })
      eventsByDay.set(dayIndex, dayEvents)
    })
    
    // Calculate positions for each day
    eventsByDay.forEach((dayEvents, dayIndex) => {
      const sortedEvents = [...dayEvents].sort((a, b) => a.start.getTime() - b.start.getTime())
      
      sortedEvents.forEach((event, index) => {
        let column = 0
        let maxColumns = 1
        
        // Check for overlaps within the same day
        for (let i = 0; i < index; i++) {
          const prevEvent = sortedEvents[i]
          const prevPos = positions.find(p => p.event === prevEvent && p.day === dayIndex)
          
          if (prevPos && event.start < prevEvent.end && event.end > prevEvent.start) {
            maxColumns = Math.max(maxColumns, prevPos.maxColumns)
            
            // Find available column
            const usedColumns = positions
              .filter(p => p.day === dayIndex && 
                sortedEvents.includes(p.event) &&
                p.event.start < event.end && 
                p.event.end > event.start)
              .map(p => p.column)
            
            while (usedColumns.includes(column)) {
              column++
            }
            
            maxColumns = Math.max(maxColumns, column + 1)
          }
        }
        
        // Update max columns for overlapping events
        positions.forEach(pos => {
          if (pos.day === dayIndex && 
              pos.event.start < event.end && 
              pos.event.end > event.start) {
            pos.maxColumns = Math.max(pos.maxColumns, maxColumns)
          }
        })
        
        positions.push({
          event,
          day: dayIndex,
          column,
          maxColumns,
          left: 0,
          width: 0
        })
      })
    })
    
    // Calculate actual positions
    positions.forEach(pos => {
      pos.width = 100 / pos.maxColumns
      pos.left = pos.column * pos.width
    })
    
    return positions
  }, [timedEvents, dates])
  
  // Sync scroll between time labels and grid
  useEffect(() => {
    const grid = gridRef.current
    const hours = hoursRef.current
    
    if (!grid || !hours) return
    
    const handleScroll = () => {
      hours.scrollTop = grid.scrollTop
    }
    
    grid.addEventListener('scroll', handleScroll)
    return () => grid.removeEventListener('scroll', handleScroll)
  }, [])
  
  const formatTime = (hour: number): string => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    if (hour < 12) return `${hour} AM`
    return `${hour - 12} PM`
  }
  
  const formatDate = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date.getTime() === today.getTime()) {
      return 'Today'
    }
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  
  const getTimeFromPosition = (y: number): Date => {
    const hourHeight = 60 // 60px per hour
    const hour = Math.floor(y / hourHeight)
    const minutes = Math.floor((y % hourHeight) / (hourHeight / 4)) * 15
    
    const time = new Date(currentDate)
    time.setHours(hour, minutes, 0, 0)
    return time
  }
  
  const getPositionFromTime = (time: Date): number => {
    const hours = time.getHours()
    const minutes = time.getMinutes()
    return (hours * 60) + ((minutes / 60) * 60)
  }
  
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top + e.currentTarget.scrollTop
    const time = getTimeFromPosition(y)
    
    // Set the correct date
    const clickedDate = new Date(dates[dayIndex])
    time.setFullYear(clickedDate.getFullYear(), clickedDate.getMonth(), clickedDate.getDate())
    
    // Round to nearest 15 minutes
    const minutes = Math.round(time.getMinutes() / 15) * 15
    time.setMinutes(minutes)
    
    onSlotClick(time)
  }
  
  const isCurrentTime = (date: Date) => {
    const now = new Date()
    return date.toDateString() === now.toDateString()
  }
  
  const getCurrentTimePosition = (): number | null => {
    const now = new Date()
    return getPositionFromTime(now)
  }
  
  // Check if time slot has enough space for task (excluding all-day events)
  const hasConflict = (time: Date): boolean => {
    const taskEnd = new Date(time)
    taskEnd.setMinutes(taskEnd.getMinutes() + taskDuration)
    
    // Only check events on the same day as the task
    return timedEvents.some(event => {
      // Only check timed events, not all-day events
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      
      // Skip events not on the same day
      if (eventStart.toDateString() !== time.toDateString()) {
        return false
      }
      
      return (time < eventEnd && taskEnd > eventStart)
    })
  }
  
  return (
    <div className="flex flex-col flex-1 h-full bg-white">
      {/* All-day events header */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <div className="w-16 flex-shrink-0 px-2 py-1 text-xs text-gray-500 border-r border-gray-200">
              All day
            </div>
            <div className="flex-1 flex">
              {dates.map((date, dayIndex) => (
                <div key={dayIndex} className="flex-1 border-r border-gray-200 last:border-r-0 p-1">
                  {allDayEvents
                    .filter(event => {
                      const eventDate = new Date(event.start)
                      return eventDate.toDateString() === date.toDateString()
                    })
                    .map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 mb-1 rounded truncate"
                        style={{
                          backgroundColor: event.color ? `${event.color}20` : '#3b82f620',
                          color: event.color || '#3b82f6',
                          borderLeft: `3px solid ${event.color || '#3b82f6'}`
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="w-16 flex-shrink-0" />
        {dates.map((date, index) => (
          <div 
            key={index} 
            className="flex-1 text-center py-2 border-r border-gray-200 last:border-r-0"
          >
            <div className="text-sm font-medium">{formatDate(date)}</div>
            <div className="text-xs text-gray-500">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Time labels */}
        <div 
          ref={hoursRef}
          className="w-16 flex-shrink-0 border-r border-gray-200 overflow-hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="relative">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-[60px] relative">
                <span className="absolute -top-2 right-2 text-xs text-gray-500">
                  {formatTime(hour)}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Calendar grids */}
        <div className="flex-1 flex overflow-y-auto overflow-x-hidden" ref={gridRef}>
          {dates.map((date, dayIndex) => (
            <div 
              key={dayIndex}
              className="flex-1 relative border-r border-gray-200 last:border-r-0"
              onClick={(e) => handleGridClick(e, dayIndex)}
            >
              <div className="relative" style={{ height: '1440px' }}>
                {/* Hour lines */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-gray-100"
                    style={{ top: `${hour * 60}px` }}
                  />
                ))}
                
                {/* Current time line */}
                {isCurrentTime(date) && getCurrentTimePosition() !== null && (
                  <div
                    className="absolute w-full border-t-2 border-red-500 z-20"
                    style={{ top: `${getCurrentTimePosition()}px` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                )}
                
                {/* Events for this day */}
                {eventPositions
                  .filter(pos => pos.day === dayIndex)
                  .map((pos, index) => {
                    const top = getPositionFromTime(new Date(pos.event.start))
                    const height = Math.max(
                      20,
                      getPositionFromTime(new Date(pos.event.end)) - top
                    )
                    
                    return (
                      <div
                        key={pos.event.id}
                        className="absolute px-1 overflow-hidden rounded-md border cursor-default"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `${pos.left}%`,
                          width: `calc(${pos.width}% - 2px)`,
                          backgroundColor: pos.event.color ? `${pos.event.color}20` : '#3b82f620',
                          borderColor: pos.event.color || '#3b82f6',
                          borderLeftWidth: '3px'
                        }}
                        title={`${pos.event.title}\n${new Date(pos.event.start).toLocaleTimeString()} - ${new Date(pos.event.end).toLocaleTimeString()}`}
                      >
                        <div className="text-xs font-medium truncate" style={{ color: pos.event.color || '#3b82f6' }}>
                          {pos.event.title}
                        </div>
                        {height > 30 && (
                          <div className="text-xs text-gray-600">
                            {new Date(pos.event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                
                {/* Task preview for this day */}
                {selectedSlot && 
                 selectedSlot.toDateString() === date.toDateString() && (
                  <div
                    className={`absolute px-2 py-1 rounded-md border-2 transition-all ${
                      previewMode 
                        ? 'bg-blue-100 border-blue-500 shadow-lg' 
                        : 'bg-blue-50 border-blue-300 opacity-75'
                    } ${
                      hasConflict(selectedSlot) ? 'border-dashed' : ''
                    }`}
                    style={{
                      top: `${getPositionFromTime(selectedSlot)}px`,
                      height: `${(taskDuration / 60) * 60}px`,
                      left: '0',
                      right: '0',
                      zIndex: 10
                    }}
                  >
                    <div className="text-sm font-medium text-blue-900">
                      {previewMode ? 'Task Preview' : 'New Task'}
                    </div>
                    <div className="text-xs text-blue-700">
                      {selectedSlot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - 
                      {new Date(selectedSlot.getTime() + taskDuration * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                    {hasConflict(selectedSlot) && (
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ Conflicts with existing event
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}