'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TodoistTask } from '@/lib/types'
import SmartScheduleDateInput from './SmartScheduleDateInput'
import { getDateColor, getDateTimeLabel } from '@/lib/date-colors'
import { parseTodoistLinks } from '@/lib/todoist-link-parser'
import dynamic from 'next/dynamic'

// Lazy load the new scheduler to avoid loading calendar dependencies if not used
const TaskSchedulerView = dynamic(() => import('./TaskSchedulerView'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div className="text-white">Loading scheduler...</div>
  </div>
})

interface ScheduledDateSelectorProps {
  currentTask: TodoistTask
  onScheduledDateChange: (dateString: string) => void
  onClose: () => void
  isVisible: boolean
  isLoading?: boolean
}

interface DateSuggestion {
  id: string
  label: string
  sublabel?: string
  dateString: string
  icon?: string
}

export default function ScheduledDateSelector({ 
  currentTask,
  onScheduledDateChange, 
  onClose, 
  isVisible,
  isLoading
}: ScheduledDateSelectorProps) {
  // Check if we should use the new scheduler
  const useNewScheduler = process.env.NEXT_PUBLIC_USE_NEW_SCHEDULER === 'true'
  
  // If using new scheduler, render it instead
  if (useNewScheduler) {
    return (
      <TaskSchedulerView
        currentTask={currentTask}
        onScheduledDateChange={onScheduledDateChange}
        onClose={onClose}
        isVisible={isVisible}
        isLoading={isLoading}
        mode="scheduled"
      />
    )
  }
  
  // Otherwise, continue with the original implementation
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedSuggestionRef = useRef<HTMLButtonElement>(null)
  
  // Convert API priority (1-4) to UI priority (P4-P1) 
  const getUIPriority = (apiPriority: number) => {
    return 5 - apiPriority // 4→P1, 3→P2, 2→P3, 1→P4
  }

  const getPriorityColor = (apiPriority: number) => {
    const uiPriority = getUIPriority(apiPriority)
    switch (uiPriority) {
      case 1: return 'text-red-600 bg-red-50 border-red-200'    // P1 = Urgent
      case 2: return 'text-orange-600 bg-orange-50 border-orange-200' // P2 = High
      case 3: return 'text-blue-600 bg-blue-50 border-blue-200'  // P3 = Medium
      default: return 'text-gray-600 bg-gray-50 border-gray-200' // P4 = Normal
    }
  }

  // Generate smart suggestions based on current context
  const generateSuggestions = useCallback((): DateSuggestion[] => {
    const today = new Date()
    const suggestions: DateSuggestion[] = []
    
    // Priority-based suggestions
    const uiPriority = getUIPriority(currentTask.priority)
    
    if (uiPriority === 1) { // P1 - Urgent
      suggestions.push(
        { id: 'now', label: 'Right now', sublabel: 'Start immediately', dateString: 'now', icon: '🔥' },
        { id: 'today', label: 'Today', sublabel: 'Within the day', dateString: 'today', icon: '📅' },
        { id: 'tomorrow-morning', label: 'Tomorrow morning', sublabel: 'Early start', dateString: 'tomorrow at 9am', icon: '🌅' }
      )
    } else if (uiPriority === 2) { // P2 - High
      suggestions.push(
        { id: 'today', label: 'Today', sublabel: 'Get it done today', dateString: 'today', icon: '📅' },
        { id: 'tomorrow', label: 'Tomorrow', sublabel: 'Next business day', dateString: 'tomorrow', icon: '➡️' },
        { id: 'monday', label: 'Monday morning', sublabel: 'Start of week', dateString: 'Monday at 9am', icon: '🌅' }
      )
    } else { // P3/P4 - Medium/Normal
      suggestions.push(
        { id: 'tomorrow', label: 'Tomorrow', sublabel: 'Next day', dateString: 'tomorrow', icon: '➡️' },
        { id: 'next-week', label: 'Next week', sublabel: 'When you have time', dateString: 'next Monday', icon: '📅' },
        { id: 'weekend', label: 'This weekend', sublabel: 'Saturday morning', dateString: 'Saturday at 10am', icon: '🏠' }
      )
    }
    
    // Add contextual suggestions based on deadline
    if (currentTask.deadline) {
      const deadlineDate = new Date(currentTask.deadline.date)
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDeadline > 7) {
        suggestions.push({ id: 'week-before', label: 'Week before deadline', sublabel: 'Leave time for completion', dateString: 'in ' + (daysUntilDeadline - 7) + ' days', icon: '⏰' })
      }
      if (daysUntilDeadline > 3) {
        suggestions.push({ id: 'few-days-before', label: 'Few days before deadline', sublabel: 'Final push', dateString: 'in ' + (daysUntilDeadline - 3) + ' days', icon: '⚡' })
      }
    }
    
    // Common scheduling options
    suggestions.push(
      { id: 'tonight', label: 'Tonight', sublabel: 'After work', dateString: 'today at 7pm', icon: '🌙' },
      { id: 'lunch', label: 'During lunch', sublabel: 'Quick session', dateString: 'today at 12pm', icon: '🍽️' },
      { id: 'end-of-week', label: 'End of week', sublabel: 'Friday afternoon', dateString: 'Friday at 3pm', icon: '📋' }
    )
    
    // Helper to parse date strings to Date objects for sorting
    const parseDate = (dateString: string): Date => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (dateString === 'now') return now
      if (dateString === 'today') return todayStart
      if (dateString.startsWith('today at')) {
        const time = dateString.replace('today at ', '')
        const [hour] = time.replace(/[ap]m/i, '').split(':')
        let h = parseInt(hour)
        if (time.includes('pm') && h !== 12) h += 12
        if (time.includes('am') && h === 12) h = 0
        return new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate(), h)
      }
      if (dateString === 'tomorrow') {
        const tomorrow = new Date(todayStart)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow
      }
      if (dateString.startsWith('tomorrow at')) {
        const tomorrow = new Date(todayStart)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const time = dateString.replace('tomorrow at ', '')
        const [hour] = time.replace(/[ap]m/i, '').split(':')
        let h = parseInt(hour)
        if (time.includes('pm') && h !== 12) h += 12
        if (time.includes('am') && h === 12) h = 0
        tomorrow.setHours(h)
        return tomorrow
      }
      if (dateString.startsWith('in ') && dateString.includes('days')) {
        const days = parseInt(dateString.match(/\d+/)?.[0] || '1')
        const future = new Date(todayStart)
        future.setDate(future.getDate() + days)
        return future
      }
      if (dateString === 'Saturday' || dateString.startsWith('Saturday at')) {
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7
        const saturday = new Date(todayStart)
        saturday.setDate(saturday.getDate() + daysUntilSaturday)
        if (dateString.includes(' at ')) {
          const time = dateString.replace('Saturday at ', '')
          const [hour] = time.replace(/[ap]m/i, '').split(':')
          let h = parseInt(hour)
          if (time.includes('pm') && h !== 12) h += 12
          if (time.includes('am') && h === 12) h = 0
          saturday.setHours(h)
        }
        return saturday
      }
      if (dateString === 'Monday' || dateString.startsWith('Monday at')) {
        const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7
        const monday = new Date(todayStart)
        monday.setDate(monday.getDate() + daysUntilMonday)
        if (dateString.includes(' at ')) {
          const time = dateString.replace('Monday at ', '')
          const [hour] = time.replace(/[ap]m/i, '').split(':')
          let h = parseInt(hour)
          if (time.includes('pm') && h !== 12) h += 12
          if (time.includes('am') && h === 12) h = 0
          monday.setHours(h)
        }
        return monday
      }
      if (dateString === 'Friday' || dateString.startsWith('Friday at')) {
        const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7
        const friday = new Date(todayStart)
        friday.setDate(friday.getDate() + daysUntilFriday)
        if (dateString.includes(' at ')) {
          const time = dateString.replace('Friday at ', '')
          const [hour] = time.replace(/[ap]m/i, '').split(':')
          let h = parseInt(hour)
          if (time.includes('pm') && h !== 12) h += 12
          if (time.includes('am') && h === 12) h = 0
          friday.setHours(h)
        }
        return friday
      }
      if (dateString.startsWith('next ')) {
        const next = new Date(todayStart)
        next.setDate(next.getDate() + 7)
        return next
      }
      // For other complex patterns, return a far future date
      return new Date(now.getFullYear() + 1, 0, 1)
    }
    
    // Remove duplicates and sort chronologically
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex((s) => s.id === suggestion.id)
    )
    
    return uniqueSuggestions.sort((a, b) => {
      const dateA = parseDate(a.dateString)
      const dateB = parseDate(b.dateString)
      return dateA.getTime() - dateB.getTime()
    })
  }, [currentTask.priority, currentTask.deadline])

  const suggestions = generateSuggestions()
  
  // Filter suggestions based on search term and add custom option
  const filteredSuggestions = (() => {
    const filtered = suggestions.filter(suggestion => 
      suggestion.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.sublabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.dateString.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    // Add custom option at top if user is typing something specific
    if (searchTerm.trim() && !filtered.some(s => s.dateString.toLowerCase() === searchTerm.toLowerCase())) {
      filtered.unshift({
        id: 'custom',
        label: `"${searchTerm}"`,
        sublabel: 'Use your custom input',
        dateString: searchTerm,
        icon: '✏️'
      })
    }
    
    return filtered
  })()

  // Reset when opening
  useEffect(() => {
    if (isVisible) {
      setSearchTerm('')
      setSelectedIndex(0)
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    }
  }, [isVisible])

  // Update selected index when filtered suggestions change
  useEffect(() => {
    if (selectedIndex >= filteredSuggestions.length) {
      setSelectedIndex(Math.max(0, filteredSuggestions.length - 1))
    }
  }, [filteredSuggestions.length, selectedIndex])

  // Auto-scroll to keep selected suggestion in view
  useEffect(() => {
    if (selectedSuggestionRef.current) {
      selectedSuggestionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [selectedIndex])

  // Handle keyboard navigation and auto-focus typing
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // First handle special navigation keys
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1))
          return
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          return
        case 'Enter':
          e.preventDefault()
          if (searchTerm.trim()) {
            // Use custom search term
            handleApply(searchTerm.trim())
          } else if (filteredSuggestions[selectedIndex]) {
            // Use selected suggestion
            handleApply(filteredSuggestions[selectedIndex].dateString)
          }
          return
        case 'Delete':
        case 'Backspace':
          if (e.shiftKey) {
            e.preventDefault()
            handleClearDate()
          }
          return
        case 'Escape':
        case '`':
          e.preventDefault()
          onClose()
          return
        case 'Tab':
          // Allow tab for accessibility but don't capture other keys if tabbing
          return
      }

      // For all other keys (letters, numbers, space, etc.), focus the input and let it handle the typing
      if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
        // Only capture printable characters and backspace/delete
        const isPrintable = e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete'
        if (isPrintable) {
          e.preventDefault()
          searchInputRef.current.focus()
          
          // If it's a printable character, add it to the search term
          if (e.key.length === 1) {
            setSearchTerm(prev => prev + e.key)
          } else if (e.key === 'Backspace') {
            setSearchTerm(prev => prev.slice(0, -1))
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, filteredSuggestions, searchTerm])

  const handleApply = (dateString: string) => {
    onScheduledDateChange(dateString)
    onClose()
  }

  const handleSuggestionClick = useCallback((dateString: string) => {
    handleApply(dateString)
  }, [])

  const handleClearDate = () => {
    onScheduledDateChange('')
    onClose()
  }

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Task Information Header */}
        <div className="p-6 border-b border-gray-200 bg-blue-50 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-blue-900">Schedule Task</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(currentTask.priority)}`}>
                  P{getUIPriority(currentTask.priority)}
                </span>
              </div>
            </div>
          </div>
          <h3 className="text-sm font-medium text-blue-900 leading-tight">
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
                    className="text-blue-700 hover:text-blue-800 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {segment.content}
                  </a>
                )
              }
            })}
          </h3>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200">
          <SmartScheduleDateInput
            ref={searchInputRef}
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="When will you work on this? (e.g., tomorrow, next week)"
          />
          <div className="mt-2 text-sm text-gray-500">
            Type or select from suggestions below • ↑↓ to navigate • Enter to apply
          </div>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentTask.due && (() => {
            const colors = getDateColor(currentTask.due.date, false);
            const label = getDateTimeLabel(currentTask.due.date, true);
            return (
              <div className={`mb-4 p-3 ${colors.bg} border ${colors.border} rounded-lg`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm flex items-center gap-2">
                    <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={`font-medium ${colors.text}`}>Currently scheduled: </span>
                    <span className={colors.text}>{label}</span>
                  </div>
                  <button
                    onClick={handleClearDate}
                    className={`text-xs ${colors.text} hover:underline`}
                  >
                    Clear
                  </button>
                </div>
              </div>
            );
          })()}
          
          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? `No suggestions for "${searchTerm}"` : 'No suggestions available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSuggestions.map((suggestion, index) => {
                const isSelected = index === selectedIndex
                
                return (
                  <button
                    key={suggestion.id}
                    ref={isSelected ? selectedSuggestionRef : null}
                    onClick={() => handleSuggestionClick(suggestion.dateString)}
                    className={`
                      w-full text-left p-3 rounded-md transition-all duration-150 flex items-center space-x-3 border
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-300' 
                        : suggestion.id === 'custom'
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'hover:bg-gray-50 border-transparent'
                      }
                    `}
                  >
                    <div className="text-sm flex-shrink-0">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${
                        suggestion.id === 'custom' ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {suggestion.label}
                      </div>
                      {suggestion.sublabel && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className={`text-xs font-bold ${
                        suggestion.id === 'custom' ? 'text-green-600' : 'text-blue-500'
                      }`}>
                        ↵
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}