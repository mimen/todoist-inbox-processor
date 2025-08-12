'use client'

import { useMemo, useRef, useEffect } from 'react'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'
import { parseTodoistLinks } from '@/lib/todoist-link-parser'

interface CalendarGridProps {
  events: CalendarEvent[]
  selectedSlot: Date | null
  onSlotClick: (time: Date) => void
  currentDate: Date
  previewMode: boolean
  taskDuration?: number // in minutes, default 30
  daysToShow?: number // default 1
  mode?: 'scheduled' | 'deadline'
  taskContent?: string
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
  daysToShow = 1,
  mode = 'scheduled',
  taskContent = ''
}: CalendarGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedSlotRef = useRef<HTMLDivElement>(null)
  
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
  
  // Calculate positions for timed events
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
        
        // Check for overlaps
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
  
  // Scroll to selected time slot when it changes
  useEffect(() => {
    if (!scrollContainerRef.current || !selectedSlot) return
    
    const container = scrollContainerRef.current
    const slotTop = getPositionFromTime(selectedSlot)
    const taskHeight = (taskDuration / 60) * 60
    
    // Get container dimensions
    const containerHeight = container.clientHeight
    const scrollTop = container.scrollTop
    const maxScroll = container.scrollHeight - containerHeight
    
    // Calculate visible area (middle half of container)
    const visibleTop = scrollTop + containerHeight * 0.25
    const visibleBottom = scrollTop + containerHeight * 0.75
    
    // Check if slot is outside visible area
    const slotBottom = slotTop + taskHeight
    let newScrollTop = scrollTop
    
    if (slotTop < visibleTop) {
      // Slot is above visible area - scroll up to center it
      newScrollTop = slotTop - containerHeight * 0.25
    } else if (slotBottom > visibleBottom) {
      // Slot is below visible area - scroll down to center it
      newScrollTop = slotTop + taskHeight - containerHeight * 0.75
    }
    
    // Clamp to valid scroll range
    newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll))
    
    // Only scroll if needed
    if (Math.abs(newScrollTop - scrollTop) > 1) {
      container.scrollTo({
        top: newScrollTop,
        behavior: 'smooth'
      })
    }
  }, [selectedSlot, taskDuration])
  
  // Scroll to initial position on mount
  useEffect(() => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const containerHeight = container.clientHeight
    
    // Use selected slot if available, otherwise use current time
    const targetTime = selectedSlot || new Date()
    const targetTop = getPositionFromTime(targetTime)
    
    // Center the target time in view
    const scrollTop = targetTop - containerHeight / 2 + 30 // Add 30px to account for task height
    
    // Set initial scroll position
    setTimeout(() => {
      container.scrollTop = Math.max(0, Math.min(scrollTop, container.scrollHeight - containerHeight))
    }, 0)
  }, []) // Only on mount
  
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
  
  
  const getPositionFromTime = (time: Date): number => {
    const hours = time.getHours()
    const minutes = time.getMinutes()
    return (hours * 60) + ((minutes / 60) * 60)
  }
  
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    const container = scrollContainerRef.current
    if (!container) return
    
    // Get the click position relative to the scrollable container
    const containerRect = container.getBoundingClientRect()
    const clickY = e.clientY - containerRect.top + container.scrollTop
    
    // Calculate the time based on the click position
    const hourHeight = 60 // 60px per hour
    const totalMinutes = Math.floor(clickY / hourHeight) * 60 + Math.floor((clickY % hourHeight) / (hourHeight / 4)) * 15
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    // Clamp to valid time range (0-23 hours)
    const clampedHours = Math.max(0, Math.min(23, hours))
    const clampedMinutes = Math.max(0, Math.min(45, Math.floor(minutes / 15) * 15)) // Round to 15-minute increments
    
    // Create the time with the correct date
    const clickedDate = new Date(dates[dayIndex])
    clickedDate.setHours(clampedHours, clampedMinutes, 0, 0)
    
    onSlotClick(clickedDate)
  }
  
  const isCurrentTime = (date: Date) => {
    const now = new Date()
    return date.toDateString() === now.toDateString()
  }
  
  const getCurrentTimePosition = (): number | null => {
    const now = new Date()
    return getPositionFromTime(now)
  }
  
  const hasConflict = (time: Date): boolean => {
    const taskEnd = new Date(time)
    taskEnd.setMinutes(taskEnd.getMinutes() + taskDuration)
    
    return timedEvents.some(event => {
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
      {/* All-day events header - Fixed */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
      
      {/* Day headers - Fixed */}
      {daysToShow > 1 && (
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
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
      )}
      
      {/* Scrollable container for time grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none'
        } as React.CSSProperties}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="flex min-h-full">
          {/* Time labels - Part of scrollable content */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200">
            <div className="relative" style={{ height: '1440px' }}>
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
          <div className="flex-1 flex">
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
                  
                  {/* Events */}
                  {eventPositions
                    .filter(pos => pos.day === dayIndex)
                    .map((pos) => {
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
                  
                  {/* Task preview */}
                  {selectedSlot && 
                   selectedSlot.toDateString() === date.toDateString() && (
                    <div
                      ref={selectedSlotRef}
                      className={`absolute px-2 py-1 rounded-md border-2 transition-all ${
                        previewMode 
                          ? mode === 'deadline'
                            ? 'bg-red-100 border-red-500 shadow-lg' 
                            : 'bg-blue-100 border-blue-500 shadow-lg'
                          : mode === 'deadline'
                            ? 'bg-red-50 border-red-300 opacity-75'
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
                      <div className={`text-sm font-medium truncate ${
                        mode === 'deadline' ? 'text-red-900' : 'text-blue-900'
                      }`}>
                        {taskContent ? (
                          // Extract just the text content from links
                          parseTodoistLinks(taskContent).map(segment => segment.content).join('')
                        ) : (
                          mode === 'deadline' 
                            ? (previewMode ? 'Deadline Preview' : 'New Deadline')
                            : (previewMode ? 'Task Preview' : 'New Task')
                        )}
                      </div>
                      <div className={`text-xs ${
                        mode === 'deadline' ? 'text-red-700' : 'text-blue-700'
                      }`}>
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
    </div>
  )
}