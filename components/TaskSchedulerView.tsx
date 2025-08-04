'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TodoistTask } from '@/lib/types'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'
import CalendarGrid from './CalendarGrid'

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

export default function TaskSchedulerView({
  currentTask,
  onScheduledDateChange,
  onClose,
  isVisible,
  isLoading,
  mode = 'scheduled'
}: TaskSchedulerViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [currentTimeSlotIndex, setCurrentTimeSlotIndex] = useState(0)
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const timeGridRef = useRef<HTMLDivElement>(null)
  const selectedSlotRef = useRef<HTMLDivElement>(null)

  // Use the calendar events hook for 3 days
  const { events: calendarEvents, loading: loadingCalendar, error: calendarError, authRequired, refresh } = useCalendarEvents(selectedDate, 3)
  
  // Trigger calendar sync on component mount and when becoming visible
  useEffect(() => {
    if (isVisible) {
      // Trigger background sync
      fetch('/api/calendar/sync', { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('Calendar sync triggered:', data))
        .catch(err => console.error('Failed to trigger sync:', err))
    }
  }, [isVisible])

  // Generate time slots for the day (15-minute increments)
  const generateTimeSlots = useCallback((date: Date, events: CalendarEvent[]): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const startHour = 0
    const endHour = 24
    const now = new Date()
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const slotTime = new Date(date)
        slotTime.setHours(hour, minute, 0, 0)
        
        // Skip past times for today
        if (date.toDateString() === now.toDateString() && slotTime < now) {
          continue
        }
        
        // Check for conflicts with calendar events
        const slotEnd = new Date(slotTime)
        slotEnd.setMinutes(slotEnd.getMinutes() + 30) // 30-minute task duration
        
        const conflictingEvents = events.filter(event => {
          const eventStart = new Date(event.start)
          const eventEnd = new Date(event.end)
          return (slotTime < eventEnd && slotEnd > eventStart)
        })
        
        // Determine if slot has enough time (30 minutes) without conflicts
        const hasEnoughTime = !events.some(event => {
          const eventStart = new Date(event.start)
          return eventStart >= slotTime && eventStart < slotEnd
        })
        
        slots.push({
          time: slotTime,
          available: hasEnoughTime && conflictingEvents.length === 0,
          hasConflict: conflictingEvents.length > 0,
          events: conflictingEvents
        })
      }
    }
    
    return slots
  }, [])

  // Generate time slots when date or events change
  const timeSlots = generateTimeSlots(selectedDate, calendarEvents)

  // Find next available slot index
  const findNextAvailableSlot = (startIndex: number): number => {
    for (let i = startIndex + 1; i < timeSlots.length; i++) {
      if (timeSlots[i].available) return i
    }
    // Wrap around to beginning
    for (let i = 0; i < startIndex; i++) {
      if (timeSlots[i].available) return i
    }
    return startIndex
  }

  // Find previous available slot index
  const findPrevAvailableSlot = (startIndex: number): number => {
    for (let i = startIndex - 1; i >= 0; i--) {
      if (timeSlots[i].available) return i
    }
    // Wrap around to end
    for (let i = timeSlots.length - 1; i > startIndex; i--) {
      if (timeSlots[i].available) return i
    }
    return startIndex
  }

  // Reset state when opening
  useEffect(() => {
    if (isVisible) {
      // Only reset date if it's not already today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const currentDateReset = new Date(selectedDate)
      currentDateReset.setHours(0, 0, 0, 0)
      
      if (currentDateReset.getTime() !== today.getTime()) {
        setSelectedDate(today)
      }
      
      setSelectedSlot(null)
      setPreviewMode(false)
      setCurrentTimeSlotIndex(0)
    }
  }, [isVisible])

  // Find first available slot when time slots change
  useEffect(() => {
    if (isVisible && timeSlots.length > 0 && !selectedSlot) {
      const now = new Date()
      let startTime = new Date(selectedDate)
      
      // If today, start from next 15-minute slot
      if (selectedDate.toDateString() === now.toDateString()) {
        startTime = new Date(now)
        startTime.setMinutes(Math.ceil(startTime.getMinutes() / 15) * 15, 0, 0)
      } else {
        // Otherwise start at 9 AM
        startTime.setHours(9, 0, 0, 0)
      }
      
      setSelectedSlot({
        time: startTime,
        available: true,
        hasConflict: false,
        events: []
      })
    }
  }, [isVisible, selectedDate])

  // Auto-scroll to selected slot
  useEffect(() => {
    if (selectedSlotRef.current && timeGridRef.current) {
      const container = timeGridRef.current
      const element = selectedSlotRef.current
      const elementTop = element.offsetTop
      const elementBottom = elementTop + element.offsetHeight
      const containerTop = container.scrollTop
      const containerBottom = containerTop + container.clientHeight

      if (elementTop < containerTop || elementBottom > containerBottom) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentTimeSlotIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (selectedSlot) {
            const newTime = new Date(selectedSlot.time)
            newTime.setMinutes(newTime.getMinutes() + 15)
            // Skip past times
            const now = new Date()
            if (selectedDate.toDateString() === now.toDateString() && newTime < now) {
              newTime.setTime(now.getTime())
              newTime.setMinutes(Math.ceil(newTime.getMinutes() / 15) * 15)
            }
            setSelectedSlot({
              time: newTime,
              available: true,
              hasConflict: false,
              events: []
            })
          } else {
            setCurrentTimeSlotIndex(findNextAvailableSlot(currentTimeSlotIndex))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (selectedSlot) {
            const newTime = new Date(selectedSlot.time)
            newTime.setMinutes(newTime.getMinutes() - 15)
            // Don't go before current time
            const now = new Date()
            if (selectedDate.toDateString() === now.toDateString() && newTime < now) {
              return
            }
            setSelectedSlot({
              time: newTime,
              available: true,
              hasConflict: false,
              events: []
            })
          } else {
            setCurrentTimeSlotIndex(findPrevAvailableSlot(currentTimeSlotIndex))
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(newDate.getDate() - 1)
            newDate.setHours(0, 0, 0, 0)
            
            // Move selected slot to the new date, keeping the same time
            if (selectedSlot) {
              const newSlotTime = new Date(selectedSlot.time)
              newSlotTime.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
              setSelectedSlot({
                time: newSlotTime,
                available: true,
                hasConflict: false,
                events: []
              })
            } else {
              // If no slot selected, create one at 9 AM on the new date
              const defaultTime = new Date(newDate)
              defaultTime.setHours(9, 0, 0, 0)
              setSelectedSlot({
                time: defaultTime,
                available: true,
                hasConflict: false,
                events: []
              })
            }
            
            // Shift calendar view left to keep the selected date visible
            return newDate
          })
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(newDate.getDate() + 1)
            newDate.setHours(0, 0, 0, 0)
            
            // Move selected slot to the new date, keeping the same time
            if (selectedSlot) {
              const newSlotTime = new Date(selectedSlot.time)
              newSlotTime.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
              setSelectedSlot({
                time: newSlotTime,
                available: true,
                hasConflict: false,
                events: []
              })
            } else {
              // If no slot selected, create one at 9 AM on the new date
              const defaultTime = new Date(newDate)
              defaultTime.setHours(9, 0, 0, 0)
              setSelectedSlot({
                time: defaultTime,
                available: true,
                hasConflict: false,
                events: []
              })
            }
            
            // Check if we need to shift the calendar view to keep selected date visible
            const currentViewEnd = new Date(prev)
            currentViewEnd.setDate(currentViewEnd.getDate() + 2) // 3-day view (0, 1, 2)
            currentViewEnd.setHours(0, 0, 0, 0)
            
            if (newDate.getTime() > currentViewEnd.getTime()) {
              // Shift view right: new date becomes day 2 of the 3-day view
              const newViewStart = new Date(newDate)
              newViewStart.setDate(newViewStart.getDate() - 1)
              return newViewStart
            }
            
            return prev // Keep current view if new date is still visible
          })
          break
        case 'Enter':
          e.preventDefault()
          if (!previewMode && timeSlots[currentTimeSlotIndex]?.available) {
            // First Enter: Show preview
            setSelectedSlot(timeSlots[currentTimeSlotIndex])
            setPreviewMode(true)
          } else if (previewMode && selectedSlot) {
            // Second Enter: Confirm selection
            handleConfirmSelection()
          }
          break
        case 'Escape':
          e.preventDefault()
          if (previewMode) {
            setPreviewMode(false)
            setSelectedSlot(null)
          } else {
            onClose()
          }
          break
        case 'Delete':
          if (e.shiftKey) {
            e.preventDefault()
            handleClearDate()
          }
          break
        case 'd':
          e.preventDefault()
          // Future: Open date picker
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, currentTimeSlotIndex, selectedDate, previewMode, selectedSlot, timeSlots])

  const handleSlotClick = (slot: TimeSlot, index: number) => {
    if (!previewMode) {
      setSelectedSlot(slot)
      setCurrentTimeSlotIndex(index)
      setPreviewMode(true)
    } else if (selectedSlot === slot) {
      handleConfirmSelection()
    } else {
      setSelectedSlot(slot)
      setCurrentTimeSlotIndex(index)
    }
  }

  const handleConfirmSelection = () => {
    if (selectedSlot) {
      const dateString = formatDateForTodoist(selectedSlot.time)
      onScheduledDateChange(dateString)
      onClose()
    }
  }

  const handleClearDate = () => {
    onScheduledDateChange('')
    onClose()
  }

  const handleDatePickerSelect = (date: Date) => {
    setSelectedDate(date)
    setShowDatePicker(false)
    setSelectedSlot(null) // Clear any selected slot when changing dates
    setPreviewMode(false)
  }

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

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-5xl w-full mx-4 h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {mode === 'scheduled' ? 'Schedule task' : 'Set deadline'}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5 font-medium truncate max-w-md">{currentTask.content}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDatePicker(true)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {authRequired ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect your calendar</h3>
                <p className="text-gray-600 text-sm max-w-sm">
                  To schedule tasks and avoid conflicts, please authorize access to your Google Calendar.
                </p>
              </div>
              <a 
                href="/api/auth/google" 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect Google Calendar
              </a>
            </div>
          ) : calendarError ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Connection error</h3>
                <p className="text-red-600 text-sm">{calendarError}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Show calendar grid with loading overlay */}
              <div className="relative flex-1">
                {loadingCalendar && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-30">
                    <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                      <span className="text-gray-700 font-medium">Loading events...</span>
                    </div>
                  </div>
                )}
                
                <CalendarGrid
                  events={calendarEvents}
                  selectedSlot={selectedSlot?.time || null}
                  onSlotClick={(time) => {
                    // Create a new slot for the clicked time
                    const newSlot: TimeSlot = {
                      time,
                      available: !calendarEvents.some(event => 
                        !event.isAllDay && // Don't consider all-day events as conflicts
                        time < new Date(event.end) && 
                        new Date(time.getTime() + 30 * 60000) > new Date(event.start)
                      ),
                      hasConflict: false,
                      events: []
                    }
                    setSelectedSlot(newSlot)
                    if (!previewMode) {
                      setPreviewMode(true)
                    }
                  }}
                  currentDate={selectedDate}
                  previewMode={previewMode}
                  taskDuration={30}
                  daysToShow={3}
                />
              </div>

              {/* Calendar List Sidebar */}
              <div className="w-72 border-l border-gray-200 bg-gray-50/50 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    My calendars
                  </h3>
                </div>
                
                <div className="p-4">
                  {/* Group events by calendar */}
                  {(() => {
                    const calendarMap = new Map<string, { name: string; color: string; events: CalendarEvent[] }>()
                    
                    calendarEvents.forEach(event => {
                      if (!calendarMap.has(event.calendarId)) {
                        calendarMap.set(event.calendarId, {
                          name: event.calendarName,
                          color: event.color || '#3b82f6',
                          events: []
                        })
                      }
                      calendarMap.get(event.calendarId)!.events.push(event)
                    })
                    
                    return Array.from(calendarMap.entries()).map(([id, calendar]) => (
                      <div key={id} className="mb-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: calendar.color }}
                            />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {calendar.name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                            {calendar.events.length}
                          </span>
                        </div>
                      </div>
                    ))
                  })()}
                  
                  {calendarEvents.length === 0 && !loadingCalendar && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">No events for these days</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-gray-600 font-mono">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-gray-600 font-mono">←→</kbd>
                <span>Change day</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-gray-600 font-mono">Enter</kbd>
                <span>{previewMode ? 'Confirm' : 'Preview'}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-gray-600 font-mono">Esc</kbd>
                <span>{previewMode ? 'Cancel' : 'Close'}</span>
              </div>
            </div>
            {previewMode && (
              <button
                onClick={handleConfirmSelection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Schedule task
              </button>
            )}
          </div>
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select date</h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Quick date options */}
                {[
                  { label: 'Today', date: new Date() },
                  { label: 'Tomorrow', date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })() },
                  { label: 'This weekend', date: (() => { 
                    const d = new Date(); 
                    const daysUntilSaturday = (6 - d.getDay()) % 7;
                    d.setDate(d.getDate() + daysUntilSaturday); 
                    return d 
                  })() },
                  { label: 'Next week', date: (() => { 
                    const d = new Date(); 
                    const daysUntilMonday = (8 - d.getDay()) % 7;
                    d.setDate(d.getDate() + daysUntilMonday); 
                    return d 
                  })() }
                ].map(({ label, date }) => {
                  date.setHours(0, 0, 0, 0)
                  const isSelected = selectedDate.getTime() === date.getTime()
                  return (
                    <button
                      key={label}
                      onClick={() => handleDatePickerSelect(date)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-900 font-medium' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        <span className="text-sm text-gray-500">
                          {date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </span>
                      </div>
                    </button>
                  )
                })}
                
                {/* HTML date input for custom dates */}
                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom date</label>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = new Date(e.target.value + 'T00:00:00')
                      handleDatePickerSelect(date)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}