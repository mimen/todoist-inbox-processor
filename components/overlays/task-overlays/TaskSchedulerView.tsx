'use client'

import { useState, useEffect, useRef } from 'react'
import { TodoistTask } from '@/lib/types'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'
import CalendarGrid from '../../CalendarGrid'
import { parseDate } from 'chrono-node'
import { Calendar, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { parseTodoistLinks } from '@/lib/todoist-link-parser'

interface TaskSchedulerViewProps {
  currentTask: TodoistTask
  onScheduledDateChange: (dateString: string) => void
  onClose: () => void
  isVisible: boolean
  isLoading?: boolean
  mode?: 'scheduled' | 'deadline'
}

interface TimeSlot {
  time: Date
  available: boolean
  hasConflict: boolean
  events: CalendarEvent[]
}

interface CalendarVisibility {
  [calendarId: string]: boolean
}

export default function TaskSchedulerView({
  currentTask,
  onScheduledDateChange,
  onClose,
  isVisible,
  isLoading,
  mode = 'scheduled'
}: TaskSchedulerViewProps) {
  // Helper to get existing date from task
  const getExistingTaskDate = (): Date | null => {
    const existingDate = mode === 'deadline' ? currentTask.deadline : currentTask.due
    if (!existingDate?.datetime && !existingDate?.date) return null
    
    try {
      const dateStr = existingDate.datetime || existingDate.date
      const parsed = new Date(dateStr)
      
      // Check if date is valid and not overdue
      if (isNaN(parsed.getTime())) return null
      
      const now = new Date()
      if (parsed < now) return null // Overdue
      
      return parsed
    } catch {
      return null
    }
  }

  const [selectedDate, setSelectedDate] = useState(() => {
    const existingDate = getExistingTaskDate()
    if (existingDate) {
      const date = new Date(existingDate)
      date.setHours(0, 0, 0, 0)
      return date
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const existingDate = getExistingTaskDate()
    if (existingDate) {
      // Round existing time to nearest 15-minute increment
      const minutes = existingDate.getMinutes()
      const roundedMinutes = Math.round(minutes / 15) * 15
      
      existingDate.setMinutes(roundedMinutes)
      existingDate.setSeconds(0)
      existingDate.setMilliseconds(0)
      
      return existingDate
    }
    
    // No existing date or overdue - will be updated to first available slot when events load
    const now = new Date()
    const minutes = now.getMinutes()
    const roundedMinutes = Math.ceil(minutes / 15) * 15
    
    if (roundedMinutes === 60) {
      now.setHours(now.getHours() + 1)
      now.setMinutes(0)
    } else {
      now.setMinutes(roundedMinutes)
    }
    
    now.setSeconds(0)
    now.setMilliseconds(0)
    return now
  })
  const [dateInput, setDateInput] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [calendarVisibility, setCalendarVisibility] = useState<CalendarVisibility>({})
  const [isTyping, setIsTyping] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Use the calendar events hook for 1 day
  const { events: calendarEvents, loading: loadingCalendar, error: calendarError, authRequired, refresh } = useCalendarEvents(selectedDate, 1)
  
  // Initialize calendar visibility
  useEffect(() => {
    if (calendarEvents.length > 0 && Object.keys(calendarVisibility).length === 0) {
      const uniqueCalendars = Array.from(new Set(calendarEvents.map(e => e.calendarId)))
      const visibility: CalendarVisibility = {}
      uniqueCalendars.forEach(id => {
        visibility[id] = true
      })
      setCalendarVisibility(visibility)
    }
  }, [calendarEvents, calendarVisibility])

  // Filter events based on visibility
  const visibleEvents = calendarEvents.filter(event => 
    calendarVisibility[event.calendarId] !== false
  )

  // Check if a specific time slot has conflicts
  const hasTimeConflict = (time: Date, events: CalendarEvent[]): boolean => {
    const slotEnd = new Date(time)
    slotEnd.setMinutes(slotEnd.getMinutes() + 30) // 30-minute task duration
    
    return events.some(event => {
      if (event.isAllDay) return false // Ignore all-day events
      
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      
      // Skip events not on the same day
      if (eventStart.toDateString() !== time.toDateString()) {
        return false
      }
      
      return (time < eventEnd && slotEnd > eventStart)
    })
  }

  // Find the first available 30-minute slot
  const findFirstAvailableSlot = (events: CalendarEvent[], startTime: Date): Date => {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // For current day, start from current time. For future days, start from beginning of day.
    const isToday = startTime.toDateString() === now.toDateString()
    let currentSlot = new Date(isToday ? Math.max(startTime.getTime(), now.getTime()) : startTime.getTime())
    
    const minutes = currentSlot.getMinutes()
    const roundedMinutes = Math.ceil(minutes / 15) * 15
    
    if (roundedMinutes === 60) {
      currentSlot.setHours(currentSlot.getHours() + 1)
      currentSlot.setMinutes(0)
    } else {
      currentSlot.setMinutes(roundedMinutes)
    }
    currentSlot.setSeconds(0)
    currentSlot.setMilliseconds(0)
    
    // Check each 15-minute slot until we find one that's free
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 45, 0, 0)
    
    while (currentSlot <= endOfDay) {
      const slotEnd = new Date(currentSlot)
      slotEnd.setMinutes(slotEnd.getMinutes() + 30) // 30-minute task duration
      
      // Check if this slot conflicts with any events
      const hasConflict = events.some(event => {
        if (event.isAllDay) return false // Ignore all-day events
        
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end)
        
        // Skip events not on the same day
        if (eventStart.toDateString() !== currentSlot.toDateString()) {
          return false
        }
        
        return (currentSlot < eventEnd && slotEnd > eventStart)
      })
      
      if (!hasConflict) {
        return currentSlot
      }
      
      // Move to next 15-minute slot
      currentSlot.setMinutes(currentSlot.getMinutes() + 15)
    }
    
    // If no slot found today, return the original start time
    return startTime
  }

  // Get unique calendars with colors
  const uniqueCalendars = Array.from(
    new Map(calendarEvents.map(e => [e.calendarId, { 
      id: e.calendarId, 
      name: e.calendarName,
      color: e.color 
    }])).values()
  )

  // Update to first available slot when calendar events load (only if no existing valid date)
  useEffect(() => {
    if (calendarEvents.length > 0 && !isTyping) {
      const existingDate = getExistingTaskDate()
      
      // Only find first available slot if there's no existing valid date
      if (!existingDate) {
        const firstAvailable = findFirstAvailableSlot(visibleEvents, selectedTime)
        if (firstAvailable.getTime() !== selectedTime.getTime()) {
          setSelectedTime(firstAvailable)
        }
      }
    }
  }, [calendarEvents, visibleEvents]) // Only run when events change

  // Update date input when selected time changes (but not while typing)
  useEffect(() => {
    if (!isTyping && dateInput !== '') {
      setDateInput(formatDateTimeForDisplay(selectedTime))
    }
  }, [selectedTime, isTyping, dateInput])

  // Focus date input on mount
  useEffect(() => {
    if (isVisible && dateInputRef.current) {
      setTimeout(() => {
        dateInputRef.current?.focus()
      }, 100)
    }
  }, [isVisible])


  // Debounced parsing of date input
  const parseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  // Handle date input changes
  const handleDateInputChange = (value: string) => {
    setDateInput(value)
    setIsTyping(true)
    
    // Clear any existing timeout
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current)
    }
    
    // Set a new timeout for parsing
    parseTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      
      // Try to parse the date
      const parsed = parseDate(value)
      if (parsed) {
        const newDate = new Date(parsed)
        
        // Update selected date (day)
        const dayDate = new Date(newDate)
        dayDate.setHours(0, 0, 0, 0)
        setSelectedDate(dayDate)
        
        // Update selected time
        if (newDate.getHours() !== 0 || newDate.getMinutes() !== 0) {
          // User specified a time
          newDate.setSeconds(0)
          newDate.setMilliseconds(0)
          setSelectedTime(newDate)
        } else {
          // No time specified, round to next 15 minute increment
          const newTime = new Date(newDate)
          const now = new Date()
          
          // If the new date is today, use the current time rounded up
          if (newDate.toDateString() === now.toDateString()) {
            const minutes = now.getMinutes()
            const roundedMinutes = Math.ceil(minutes / 15) * 15
            
            if (roundedMinutes === 60) {
              newTime.setHours(now.getHours() + 1, 0, 0, 0)
            } else {
              newTime.setHours(now.getHours(), roundedMinutes, 0, 0)
            }
          } else {
            // For future dates, use the same time as currently selected
            newTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0)
          }
          
          setSelectedTime(newTime)
        }
      }
    }, 500) // Wait 500ms after user stops typing
  }

  // Format date/time for display
  const formatDateTimeForDisplay = (date: Date): string => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase()
    
    if (date.toDateString() === now.toDateString()) {
      return `today at ${time}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `tomorrow at ${time}`
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      })
      return `${dateStr} at ${time}`
    }
  }

  // Format date for Todoist API
  const formatDateForTodoist = (date: Date): string => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: date.getMinutes() > 0 ? '2-digit' : undefined,
      hour12: true 
    }).toLowerCase()
    
    if (date.toDateString() === now.toDateString()) {
      return `today at ${time}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `tomorrow at ${time}`
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      return `${dateStr} at ${time}`
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle shift+delete/backspace first - should work regardless of focus
      if ((e.key === 'Delete' || e.key === 'Backspace') && e.shiftKey) {
        e.preventDefault()
        handleClearDate()
        return
      }

      // Handle navigation keys even when input is focused
      const isNavigationKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      
      // Special handling when input is focused
      if (document.activeElement === dateInputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault()
          setPreviewMode(true)
          dateInputRef.current?.blur() // Blur input so user can immediately confirm
          return
        } else if (e.key === 'Escape') {
          e.preventDefault()
          dateInputRef.current?.blur()
          return
        } else if (!isNavigationKey) {
          // Let other keys work normally in input
          return
        }
        // Continue to handle navigation keys below
      }

      // Allow simultaneous navigation and typing
      const isModifierKey = e.ctrlKey || e.metaKey || e.altKey
      const isActionKey = ['Enter', 'Escape'].includes(e.key)
      
      if (isNavigationKey || isActionKey) {
        e.preventDefault()
        
        switch (e.key) {
          case 'ArrowDown':
            setSelectedTime(prev => {
              const endOfDay = new Date(prev)
              endOfDay.setHours(23, 45, 0, 0)
              
              let newTime = new Date(prev)
              const currentMinutes = newTime.getMinutes()
              
              // Find the next 15-minute increment
              const nextIncrement = Math.ceil(currentMinutes / 15) * 15
              
              if (nextIncrement === 60) {
                // Move to next hour
                newTime.setHours(newTime.getHours() + 1)
                newTime.setMinutes(0)
              } else if (nextIncrement === currentMinutes) {
                // Already on a 15-minute mark, go to next one
                newTime.setMinutes(currentMinutes + 15)
              } else {
                // Snap to next 15-minute increment
                newTime.setMinutes(nextIncrement)
              }
              
              // If we go past midnight, stay at 11:45 PM
              if (newTime.getDate() !== prev.getDate()) {
                newTime.setDate(prev.getDate())
                newTime.setHours(23, 45, 0, 0)
              }
              
              newTime.setSeconds(0)
              newTime.setMilliseconds(0)
              
              // Skip over conflicts by continuing to move forward
              while (newTime <= endOfDay && hasTimeConflict(newTime, visibleEvents)) {
                newTime.setMinutes(newTime.getMinutes() + 15)
                if (newTime.getMinutes() === 0 && newTime.getHours() === 0) {
                  // Went past midnight, reset to end of day
                  newTime.setDate(prev.getDate())
                  newTime.setHours(23, 45, 0, 0)
                  break
                }
              }
              
              return newTime
            })
            break
          case 'ArrowUp':
            setSelectedTime(prev => {
              const startOfDay = new Date(prev)
              startOfDay.setHours(0, 0, 0, 0)
              
              let newTime = new Date(prev)
              const currentMinutes = newTime.getMinutes()
              
              // Find the previous 15-minute increment
              const prevIncrement = Math.floor(currentMinutes / 15) * 15
              
              if (prevIncrement === currentMinutes && currentMinutes > 0) {
                // Already on a 15-minute mark, go to previous one
                newTime.setMinutes(currentMinutes - 15)
              } else if (currentMinutes === 0) {
                // At top of hour, go to previous hour's :45
                newTime.setHours(newTime.getHours() - 1)
                newTime.setMinutes(45)
              } else {
                // Snap to previous 15-minute increment
                newTime.setMinutes(prevIncrement)
              }
              
              // Don't go before midnight
              if (newTime.getDate() !== prev.getDate()) {
                newTime.setDate(prev.getDate())
                newTime.setHours(0, 0, 0, 0)
              }
              
              newTime.setSeconds(0)
              newTime.setMilliseconds(0)
              
              // Skip over conflicts by continuing to move backward
              while (newTime >= startOfDay && hasTimeConflict(newTime, visibleEvents)) {
                newTime.setMinutes(newTime.getMinutes() - 15)
                if (newTime < startOfDay) {
                  // Went before start of day, reset to start of day
                  newTime = new Date(startOfDay)
                  break
                }
              }
              
              return newTime
            })
            break
          case 'ArrowLeft':
            const prevDate = new Date(selectedDate)
            prevDate.setDate(prevDate.getDate() - 1)
            setSelectedDate(prevDate)
            
            // Update selected time to same time on new date
            setSelectedTime(prev => {
              const newTime = new Date(prevDate)
              newTime.setHours(prev.getHours(), prev.getMinutes(), 0, 0)
              return newTime
            })
            break
          case 'ArrowRight':
            const nextDate = new Date(selectedDate)
            nextDate.setDate(nextDate.getDate() + 1)
            setSelectedDate(nextDate)
            
            // Update selected time to same time on new date
            setSelectedTime(prev => {
              const newTime = new Date(nextDate)
              newTime.setHours(prev.getHours(), prev.getMinutes(), 0, 0)
              return newTime
            })
            break
          case 'Enter':
            if (!previewMode) {
              setPreviewMode(true)
            } else {
              handleConfirmSelection()
            }
            break
          case 'Escape':
            if (previewMode) {
              setPreviewMode(false)
            } else {
              onClose()
            }
            break
        }
      } else if (!isModifierKey && e.key.length === 1 && dateInputRef.current) {
        // Single character key - focus input and type
        dateInputRef.current.focus()
        // Let the default behavior handle the typing
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedDate, selectedTime, previewMode])

  const handleSlotClick = (time: Date) => {
    setSelectedTime(time)
    if (!previewMode) {
      setPreviewMode(true)
    } else if (selectedTime.getTime() === time.getTime()) {
      handleConfirmSelection()
    }
  }

  const handleConfirmSelection = () => {
    const dateString = formatDateForTodoist(selectedTime)
    onScheduledDateChange(dateString)
    onClose()
  }

  const handleClearDate = () => {
    onScheduledDateChange('')
    onClose()
  }

  const toggleCalendarVisibility = (calendarId: string) => {
    setCalendarVisibility(prev => ({
      ...prev,
      [calendarId]: !prev[calendarId]
    }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8">
      <div 
        ref={containerRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[800px] flex flex-col"
      >
        {/* Header */}
        <div className={`border-b border-gray-200 ${mode === 'deadline' ? 'bg-red-50' : 'bg-blue-50'}`}>
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                mode === 'deadline' ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mode === 'deadline' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  mode === 'deadline' ? 'text-red-900' : 'text-blue-900'
                }`}>
                  {mode === 'deadline' ? 'Set Deadline' : 'Schedule Task'}
                </h3>
                <p className={`text-sm ${
                  mode === 'deadline' ? 'text-red-700' : 'text-blue-700'
                } truncate max-w-md`}>
                  {parseTodoistLinks(currentTask.content).map((segment, index) => {
                    if (segment.type === 'text') {
                      return <span key={index}>{segment.content}</span>
                    } else {
                      return (
                        <a
                          key={index}
                          href={segment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${
                            mode === 'deadline' ? 'text-red-800' : 'text-blue-800'
                          } hover:underline`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {segment.content}
                        </a>
                      )
                    }
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Date input bar */}
          <div className="px-6 py-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={dateInputRef}
                type="text"
                value={dateInput}
                onChange={(e) => handleDateInputChange(e.target.value)}
                placeholder={mode === 'deadline' ? "When must this be done?" : "When will you work on this?"}
                className={`flex-1 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                  mode === 'deadline' ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
              />
              <div className="relative group">
                <span className="text-xs text-gray-500 flex-shrink-0 cursor-help">
                  Type naturally or use arrow keys
                </span>
                
                {/* Keyboard shortcuts tooltip */}
                <div className="absolute top-full right-0 mt-2 w-56 p-3 bg-gray-900 text-white rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Navigate time</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs font-mono">↑ ↓</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Change day</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs font-mono">← →</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Confirm</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs font-mono">Enter</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Cancel</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs font-mono">Esc</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Clear date</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs font-mono">⇧ Del</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 overflow-hidden border-r border-gray-200">
            <CalendarGrid
              events={visibleEvents}
              selectedSlot={selectedTime}
              onSlotClick={handleSlotClick}
              currentDate={selectedDate}
              previewMode={previewMode}
              taskDuration={30}
              daysToShow={1}
              mode={mode}
              taskContent={currentTask.content}
            />
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-gray-50">
            {/* Calendar visibility toggles */}
            <div className="flex flex-col h-full">
              <div className="p-4 pb-2">
                <h4 className="text-sm font-medium text-gray-700">Calendars</h4>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="space-y-2">
                  {uniqueCalendars.map((calendar) => {
                    const calendarEvents = visibleEvents.filter(e => e.calendarId === calendar.id)
                    return (
                      <div
                        key={calendar.id}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => toggleCalendarVisibility(calendar.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={calendarVisibility[calendar.id] !== false}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleCalendarVisibility(calendar.id)
                              }}
                              className="rounded text-blue-500 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ 
                                backgroundColor: calendar.color || '#4285f4'
                              }}
                            />
                            <div className="font-medium text-gray-900 truncate text-sm pr-2" title={calendar.name}>
                              {calendar.name}
                            </div>
                          </div>
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 flex-shrink-0 ml-2">
                            {calendarEvents.length}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Status indicators */}
            {(loadingCalendar || authRequired || calendarError) && (
              <div className="p-4 space-y-2">
                {loadingCalendar && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading calendar events...
                  </div>
                )}
                {authRequired && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    Calendar authorization required
                  </div>
                )}
                {calendarError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    Error loading calendar
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="px-6 py-3 flex items-center justify-between">
            {/* Left side - Selected time */}
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-700">
                {selectedTime.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {selectedTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearDate}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                Clear Date
              </button>
              {previewMode && (
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  Cancel Preview
                </button>
              )}
              <button
                onClick={handleConfirmSelection}
                className={`px-4 py-1.5 text-sm rounded font-medium flex items-center gap-2 ${
                  previewMode 
                    ? mode === 'deadline'
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!previewMode}
              >
                {mode === 'deadline' ? 'Set Deadline' : 'Schedule Task'}
                {previewMode && (
                  <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                    mode === 'deadline' ? 'bg-red-600' : 'bg-blue-600'
                  }`}>↵</kbd>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}